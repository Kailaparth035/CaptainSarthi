import React, {useMemo, useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {FarmerTabParamList} from '../navigation/FarmerTabNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography, FontFamily} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import VideoPlayer from '../components/VideoPlayer';
import {SCREEN_NAMES} from '../constants/screenNames';
import {ImagePath} from '../assets/images';
import {Platform} from 'react-native';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', {month: 'short'});
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (error) {
    return dateString;
  }
};

// Helper function to get full image URL
const getImageUrl = (imagePath: string | null | undefined): any => {
  if (!imagePath) return ImagePath.farmerTractor;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return {uri: imagePath};
  }
  // If relative path, prepend base URL
  return {uri: `${API_BASE_URL}${imagePath}`};
};

const membershipServices = [
  {
    id: '1',
    imageName:ImagePath.support ,
    title: 'Quick problem solution',
    description: '24/7 active support',
  },
  {
    id: '2',    
    imageName:ImagePath.prioritySupport ,
    title: 'Priority customer support',
    description: 'Priority support from our team',
  },
  {
    id: '3',
    imageName:ImagePath.call ,
    title: 'Direct contact to company',
    description: 'Contact our core team',
  },
  {
    id: '4',
    imageName:ImagePath.events ,
    title: 'Special invite in events',
    description: 'Special invitations to our events',
  },
  {
    id: '5',
    imageName:ImagePath.offer ,
    title: 'Special discount',
    description: 'On tractor services, charges, spares',
  },
];

export default function FarmerHomeScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Dashboard data from API
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [topVideos, setTopVideos] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await getData(Apis.FARMER_DASHBOARD, {});
        
        if (response?.status === true) {
          // Transform recentStories
          if (Array.isArray(response.recentStories)) {
            const transformedStories = response.recentStories.map((story: any) => ({
              id: story.id?.toString() || '',
              title: story.title || '',
              date: formatDate(story.created_at),
              thumbnail: getImageUrl(story.image),
              image: story.image,
            }));
            setRecentStories(transformedStories);
          }
          
          // Transform topVideos
          if (Array.isArray(response.topVideos)) {
            const transformedVideos = response.topVideos.map((video: any) => ({
              id: video.id?.toString() || '',
              type: 'video',
              title: video.title || '',
              videoUri: video.video_url || '',
              thumbnailSource: ImagePath.farmerTractor,
              thumbnail: getImageUrl(video.image),
            }));
            setTopVideos(transformedVideos);
          }
          
          // Transform upcomingEvents
          if (Array.isArray(response.upcomingEvents)) {
            const transformedEvents = response.upcomingEvents.map((event: any) => ({
              id: event.id?.toString() || '',
              title: event.title || '',
              date: formatDate(event.event_date),
              location: event.location || '',
              thumbnail: getImageUrl(event.image),
            }));
            setUpcomingEvents(transformedEvents);
          }
        }
      } catch (error) {
        console.error('Error fetching farmer dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Create carousel items from topVideos (combine videos and stories for carousel)
  const carouselItems = useMemo(() => {
    const items: any[] = [];
    
    // Add videos first
    topVideos.forEach(video => {
      items.push({
        id: `video_${video.id}`,
        type: 'video',
        thumbnailSource: video.thumbnail,
        videoUri: video.videoUri,
        title: video.title,
      });
    });
    
    // Add stories as images
    recentStories.slice(0, 3).forEach(story => {
      items.push({
        id: `story_${story.id}`,
        type: 'image',
        imageUri: story.thumbnail,
      });
    });
    
    // If no items, add default
    if (items.length === 0) {
      items.push({
        id: 'default',
        type: 'image',
        imageUri: ImagePath.farmerTractor,
      });
    }
    
    return items;
  }, [topVideos, recentStories]);

  // Auto slide functionality
  const startAutoSlide = () => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
    }
    autoSlideTimerRef.current = setInterval(() => {
      setCurrentCarouselIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % carouselItems.length;
        carouselRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000); // Auto slide every 3 seconds
  };

  useEffect(() => {
    if (carouselItems.length > 0) {
      startAutoSlide();
    }

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, [carouselItems]);

  // Reset auto slide timer when user manually scrolls
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const itemWidth = screenWidth - moderateScale(32) - moderateScale(20); // Account for margins and padding
    const index = Math.round(scrollPosition / itemWidth);
    
    if (index !== currentCarouselIndex && index >= 0 && index < carouselItems.length) {
      setCurrentCarouselIndex(index);
      // Reset auto slide timer after manual scroll
      startAutoSlide();
    }
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        scrollContent: {
          paddingBottom: moderateScale(16),
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top,
          paddingBottom: moderateScale(16),
        },
        greeting: {
          ...Typography.boldXxl,
          fontSize: moderateScale(22),
          color: colors.textPrimary,
          fontFamily: FontFamily.SemiBold,
        },
        bellIcon: {
          padding: moderateScale(4),
          alignItems: 'center',
          justifyContent: 'center',
        },
        carouselContainer: {
          marginHorizontal: moderateScale(16),
          marginBottom: moderateScale(16),
          backgroundColor: colors.white,
          borderRadius: moderateScale(12),
          padding: moderateScale(10),
          position: 'relative',
          overflow: 'hidden',
        },
        carouselWrapper: {
          width: screenWidth - moderateScale(32) - moderateScale(20), // Full width minus margins and padding
          height: moderateScale(180),
        },
        carouselItem: {
          width: screenWidth - moderateScale(32) - moderateScale(20), // Full width minus margins and padding
          height: moderateScale(180),
          borderRadius: moderateScale(12),
          overflow: 'hidden',
        },
        paginationContainer: {
          position: 'absolute',
          bottom: moderateScale(16),
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        },
        paginationDot: {
          width: moderateScale(8),
          height: moderateScale(8),
          borderRadius: moderateScale(4),
          backgroundColor: colors.textSecondary,
          marginHorizontal: moderateScale(4),
          opacity: 0.3,
        },
        paginationDotActive: {
          width: moderateScale(24),
          backgroundColor: colors.primary,
          opacity: 1,
        },
        carouselImage: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(12),
        },
        sectionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          marginBottom: moderateScale(12),
        },
        sectionTitle: {
          ...Typography.semiBoldLg,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
        },
        seeAllText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.primary,
        },
        eventSliderContainer: {
          backgroundColor: colors.white,
          paddingVertical: moderateScale(12),
          marginBottom: moderateScale(16),
          marginHorizontal:moderateScale(16),
          borderRadius: moderateScale(12),
        },
        eventCard: {
          width: screenWidth / 2,
          marginRight: moderateScale(12),
          backgroundColor: colors.white,
          borderRadius: moderateScale(12),
          borderWidth: 1,
          borderColor: colors.borderDefault,
          flexDirection: 'row',
          padding: moderateScale(10),
          overflow: 'hidden',
        },
        eventThumbnail: {
          width: moderateScale(55),
          height: moderateScale(55),
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          marginRight: moderateScale(10),
          flexShrink: 0,
        },
        eventContent: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          flexShrink: 1,
        },
        eventTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(13),
          color: colors.textPrimary,
          marginBottom: moderateScale(6),
          lineHeight: moderateScale(18),
        },
        eventDate: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        eventDateText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
          marginLeft: moderateScale(4),
        },
        serviceCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: moderateScale(12),
          borderWidth:1,
          borderColor:colors.borderColor,
          padding: moderateScale(10),
          marginBottom: moderateScale(14),
          marginHorizontal: moderateScale(16),         
        },
        serviceIconContainer: {
          width: moderateScale(48),
          height: moderateScale(48),
          borderRadius: moderateScale(10),
          backgroundColor: colors.light_orange,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        serviceContent: {
          flex: 1,
        },
        serviceTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        serviceDescription: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
        },
      }),
    [moderateScale, insets.top],
  );

  const renderCarouselItem = ({item, index}: {item: any; index: number}) => {
    if (item.type === 'video') {
      return (
        <View style={dynamicStyles.carouselItem}>
          <VideoPlayer
            thumbnailUri={item.thumbnailUri}
            thumbnailSource={item.thumbnailSource}
            videoUri={item.videoUri}
            title={item.title}
            containerStyle={dynamicStyles.carouselItem}
          />
        </View>
      );
    } else {
      return (
        <View style={dynamicStyles.carouselItem}>
          <Image
            source={item.imageUri}
            style={dynamicStyles.carouselImage}
            resizeMode="cover"
          />
        </View>
      );
    }
  };

  const renderEventCard = ({item}: {item: any}) => (
    <TouchableOpacity 
      style={dynamicStyles.eventCard} 
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to Events tab and then to EventDetails
        tabNavigation.navigate(SCREEN_NAMES.Events, {
          screen: SCREEN_NAMES.EventDetails,
          params: {
            eventId: item.id,
            title: item.title,
            date: item.date,
            location: item.location,
            fromScreen: 'Home',
          },
        } as any);
      }}>
      <Image
        source={item.thumbnail || ImagePath.farmerTractor}
        style={dynamicStyles.eventThumbnail}
        resizeMode="cover"
      />
      <View style={dynamicStyles.eventContent}>
        <Text 
          style={dynamicStyles.eventTitle} 
          numberOfLines={1}
          ellipsizeMode="tail">
          {item.title}
        </Text>
        <View style={dynamicStyles.eventDate}>
          <Ionicons
            name="calendar-outline"
            size={moderateScale(14)}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.eventDateText}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStoryCard = ({item}: {item: any}) => (
    <TouchableOpacity 
      style={dynamicStyles.eventCard} 
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to Stories tab and then to StoryDetails
        tabNavigation.navigate(SCREEN_NAMES.Stories, {
          screen: SCREEN_NAMES.StoryDetails,
          params: {
            storyId: item.id,
            title: item.title,
            date: item.date,
            image: item.image,
            fromScreen: 'Home',
          },
        } as any);
      }}>
      <Image
        source={item.thumbnail || ImagePath.farmerTractor}
        style={dynamicStyles.eventThumbnail}
        resizeMode="cover"
      />
      <View style={dynamicStyles.eventContent}>
        <Text 
          style={dynamicStyles.eventTitle} 
          numberOfLines={1}
          ellipsizeMode="tail">
          {item.title}
        </Text>
        <View style={dynamicStyles.eventDate}>
          <Ionicons
            name="calendar-outline"
            size={moderateScale(14)}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.eventDateText}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderServiceCard = (service: any) => (
    <View key={service.id} style={dynamicStyles.serviceCard}>
      <View style={dynamicStyles.serviceIconContainer}>
        <Image
        source={service.imageName}
        style={{width:moderateScale(20),height:moderateScale(20)}}
        />
        {/* {service.id === '1' ? (
          <View
            style={{
              width: moderateScale(32),
              height: moderateScale(32),
              borderRadius: moderateScale(16),
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                ...Typography.boldSm,
                fontSize: moderateScale(12),
                color: colors.textWhite,
              }}>
              24
            </Text>
          </View>
        ) : (
          <Ionicons
            name={service.icon}
            size={moderateScale(24)}
            color={colors.primary}
          />
        )} */}
      </View>
      <View style={dynamicStyles.serviceContent}>
        <Text style={dynamicStyles.serviceTitle}>{service.title}</Text>
        <Text style={dynamicStyles.serviceDescription}>
          {service.description}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.greeting}>{t('farmerHome.greeting')} Harrison</Text>
        <TouchableOpacity
          style={dynamicStyles.bellIcon}
          activeOpacity={0.7}
          onPress={() => {
            // Navigate to notifications
            (navigation as any).navigate(SCREEN_NAMES.Notifications);
          }}>
          <Ionicons
            name="notifications-outline"
            size={moderateScale(22)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}>
        {/* Full Screen Video/Image Carousel */}
        <View style={dynamicStyles.carouselContainer}>
          <View style={dynamicStyles.carouselWrapper}>
            <FlatList
              ref={carouselRef}
              data={carouselItems}
              renderItem={renderCarouselItem}
              keyExtractor={item => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={screenWidth - moderateScale(32) - moderateScale(20)}
              snapToAlignment="center"
              decelerationRate="fast"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={{
                paddingHorizontal: 0,
              }}
              onScrollToIndexFailed={(info) => {
                const wait = new Promise(resolve => setTimeout(resolve, 500));
                wait.then(() => {
                  carouselRef.current?.scrollToIndex({ index: info.index, animated: true });
                });
              }}
            />
          </View>
          {/* Pagination Dots */}
          <View style={dynamicStyles.paginationContainer}>
            {carouselItems.map((_, index) => (
              <View
                key={index}
                style={[
                  dynamicStyles.paginationDot,
                  index === currentCarouselIndex && dynamicStyles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Recent Events Section */}
        {loading ? (
          <View style={{padding: moderateScale(20), alignItems: 'center'}}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View style={dynamicStyles.eventSliderContainer}>
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>Recent events</Text>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => {
                  // Navigate to Events tab and ensure we're on the Events list screen
                  tabNavigation.dispatch(
                    CommonActions.navigate({
                      name: SCREEN_NAMES.Events,
                      params: {
                        screen: SCREEN_NAMES.Events,
                      },
                    }),
                  );
                }}>
                <Text style={dynamicStyles.seeAllText}>{t('home.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            {upcomingEvents.length > 0 ? (
              <FlatList
                data={upcomingEvents}
                renderItem={renderEventCard}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingLeft: moderateScale(16),
                  paddingRight: moderateScale(16),
                }}
              />
            ) : (
              <View style={{padding: moderateScale(20), alignItems: 'center'}}>
                <Text style={[Typography.regularMd, {color: colors.textSecondary}]}>
                  No events found
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Stories Section */}
        {!loading && (
          <View style={dynamicStyles.eventSliderContainer}>
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>Recent stories</Text>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                  // Navigate to Stories tab and ensure we're on the Stories list screen
                  tabNavigation.dispatch(
                    CommonActions.navigate({
                      name: SCREEN_NAMES.Stories,
                      params: {
                        screen: SCREEN_NAMES.Stories,
                      },
                    }),
                  );
                }}>
                <Text style={dynamicStyles.seeAllText}>{t('home.seeAll')}</Text>
              </TouchableOpacity>
            </View>
            {recentStories.length > 0 ? (
              <FlatList
                data={recentStories}
                renderItem={renderStoryCard}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingLeft: moderateScale(16),
                  paddingRight: moderateScale(16),
                }}
              />
            ) : (
              <View style={{padding: moderateScale(20), alignItems: 'center'}}>
                <Text style={[Typography.regularMd, {color: colors.textSecondary}]}>
                  No stories found
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Membership Services Section */}
        <View style={{backgroundColor:colors.white,marginHorizontal:moderateScale(16),borderRadius:moderateScale(10),paddingTop:moderateScale(15)}}>
        <View
          style={[
            dynamicStyles.sectionHeader,
            {marginBottom: moderateScale(12)},
          ]}>
          <Text style={dynamicStyles.sectionTitle}>Membership services</Text>
        </View>
        {membershipServices.map(service => renderServiceCard(service))}
        </View>
      </ScrollView>
    </View>
  );
}
