import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useNavigation} from '@react-navigation/native';
import {SCREEN_NAMES} from '../constants/screenNames';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';
import {ImagePath} from '../assets/images';

// Helper function to format date
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', {month: 'long'});
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

export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();
  const [storiesData, setStoriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Fetch stories from API
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const response = await getData(Apis.FARMER_STORIES, {});
        
        if (response?.status === true && Array.isArray(response?.data)) {
          // Transform API response to match expected format
          const transformedStories = response.data.map((story: any) => ({
            id: story.id?.toString() || '',
            title: story.title || '',
            shortTitle: story.title?.length > 40 ? `${story.title.substring(0, 40)}...` : story.title || '',
            date: formatDate(story.createdAt),
            bannerImage: getImageUrl(story.image),
            logo: ImagePath.captainEnglishLogo, // Keep logo as static for now
            overlayText: story.title || '', // Use title as overlay text
            description: story.description || '',
            image: story.image,
            video_url: story.video_url,
          }));
          setStoriesData(transformedStories);
        } else if (Array.isArray(response)) {
          // Fallback: if response is directly an array
          const transformedStories = response.map((story: any) => ({
            id: story.id?.toString() || '',
            title: story.title || '',
            shortTitle: story.title?.length > 40 ? `${story.title.substring(0, 40)}...` : story.title || '',
            date: formatDate(story.createdAt),
            bannerImage: getImageUrl(story.image),
            logo: ImagePath.captainEnglishLogo,
            overlayText: story.title || '',
            description: story.description || '',
            image: story.image,
            video_url: story.video_url,
          }));
          setStoriesData(transformedStories);
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top ,
        },
        title: {
          ...Typography.boldXxl,
          fontSize: moderateScale(24),
          color: colors.textPrimary,
          marginBottom: moderateScale(24),
        },
        storyCard: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          marginBottom: moderateScale(16),
          overflow: 'hidden',
          shadowColor: colors.shadowColor,
          shadowOffset: {width: 0, height: moderateScale(2)},
          shadowOpacity: 0.05,
          shadowRadius: moderateScale(4),
          elevation: 2,
        },
        bannerContainer: {
          flexDirection: 'row',
          height: moderateScale(170),
          overflow: 'hidden',
          marginHorizontal:moderateScale(10),
          marginTop:moderateScale(10),
          backgroundColor: colors.grey,
          borderRadius:moderateScale(10)
        },
        bannerLeft: {
          flex: 1,
          backgroundColor:colors.grey, // Light beige/off-white
          padding: moderateScale(13),
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        logo: {
          width: moderateScale(32),
          height: moderateScale(32),
          resizeMode: 'contain',
        },
        mainTitle: {
          ...Typography.boldXl,
          fontSize: moderateScale(14),
          color: '#1667c6', // Dark blue
          lineHeight: moderateScale(18),
          marginBottom: moderateScale(6),
        },
        subtitle: {
          ...Typography.boldMd,
          fontSize: moderateScale(12),
          color: colors.primaryDark, // Orange
          lineHeight: moderateScale(16),
          // marginBottom: moderateScale(12),
        },
        arrowButton: {
          width: moderateScale(60),
          height: moderateScale(20),
          borderWidth: 1,
          borderColor: colors.textPrimary,
          borderRadius: moderateScale(4),
          alignItems: 'center',
          justifyContent: 'center',
          // marginTop: 'auto',
        },
        bannerRight: {
          // flex: 1.4,
          position: 'relative',
        },
        bannerImage: {
          width: moderateScale(190),
          height: moderateScale(170),
          resizeMode: 'contain',
        },
        overlayText: {
          position: 'absolute',
          top: moderateScale(20),
          left: moderateScale(8),
          right: moderateScale(8),
          ...Typography.boldMd,
          fontSize: moderateScale(14),
          color: colors.primary,
          textAlign: 'center',
          lineHeight: moderateScale(16),
        },
        storyContent: {
          padding: moderateScale(16),
        },
        storyTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(8),
        },
        dateContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        dateText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
          marginLeft: moderateScale(6),
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <View style={dynamicStyles.container}>
      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: moderateScale(20)}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.scrollContent}>
          <Text style={dynamicStyles.title}>Stories</Text>

          {storiesData.length > 0 ? (
            storiesData.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={dynamicStyles.storyCard}
                activeOpacity={0.7}
                onPress={() => {
                  (navigation as any).navigate(SCREEN_NAMES.StoryDetails, {
                    storyId: story.id,
                    title: story.title,
                    date: story.date,
                    description: story.description,
                    image: story.image,
                    video_url: story.video_url,
                    fromScreen: 'List',
                  });
                }}>
            {/* Banner Section */}
            <View style={dynamicStyles.bannerContainer}>
              {/* Left Section - Logo and Text */}
              <View style={dynamicStyles.bannerLeft}>
                <Image
                  source={story.logo}
                  style={dynamicStyles.logo}
                  resizeMode="contain"
                />
                <View style={{flex: 1,marginBottom:moderateScale(10)}}>
                  <Text style={dynamicStyles.mainTitle} numberOfLines={3}>
                    {story.title || 'Story Title'}
                  </Text>
                </View>
                <View style={dynamicStyles.arrowButton}>
                  <Ionicons
                    name="arrow-forward"
                    size={moderateScale(16)}
                    color={colors.textPrimary}
                  />
                </View>
              </View>

              {/* Right Section - Image with Overlay */}
              <View style={dynamicStyles.bannerRight}>
                <Image
                  source={story.bannerImage || ImagePath.farmerTractor}
                  style={dynamicStyles.bannerImage}
                  resizeMode="cover"
                />
                {story.title && (
                  <Text style={dynamicStyles.overlayText} numberOfLines={3}>
                    {story.title}
                  </Text>
                )}
              </View>
            </View>

            {/* Story Content */}
            <View style={dynamicStyles.storyContent}>
              <Text style={dynamicStyles.storyTitle} numberOfLines={1}>
                {story.shortTitle}
              </Text>
              <View style={dynamicStyles.dateContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={moderateScale(14)}
                  color={colors.textSecondary}
                />
                <Text style={dynamicStyles.dateText}>{story.date}</Text>
              </View>
              </View>
            </TouchableOpacity>
            ))
          ) : (
            <View style={{padding: moderateScale(20), alignItems: 'center'}}>
              <Text style={[Typography.regularMd, {color: colors.textSecondary}]}>
                No stories found
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

