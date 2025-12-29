import React, {useMemo, useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {ImagePath} from '../assets/images';
import {useNavigation} from '@react-navigation/native';
import {SCREEN_NAMES} from '../constants/screenNames';
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';

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

export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);

  // Fetch stories from API
  const fetchStories = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      console.log('[StoriesScreen] Fetching stories data');
      const response = await getData(Apis.FARMER_STORIES, {});
      
      console.log('[StoriesScreen] Stories API Response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        // Check if data has stories array (new structure) or is directly an array
        const storiesArray = response.data.stories || 
                           response.data.list ||
                           (Array.isArray(response.data) ? response.data : []);
        
        console.log('[StoriesScreen] Stories array extracted:', storiesArray?.length || 0, 'stories');
        
        if (Array.isArray(storiesArray) && storiesArray.length > 0) {
          // Transform API stories to match UI structure
          const transformedStories = storiesArray.map((story: any) => {
            const imageUrl = story.image_url ? getImageUrl(story.image_url) : null;
            const bannerImage = imageUrl ? {uri: imageUrl} : ImagePath.storycard;
            
            // Create short title (truncate if needed)
            const fullTitle = story.title || 'Story';
            const shortTitle = fullTitle.length > 40 ? fullTitle.substring(0, 37) + '...' : fullTitle;
            
            return {
              id: story.story_id || story.id || String(Math.random()),
              title: fullTitle,
              shortTitle: shortTitle,
              date: formatDate(story.publish_date || story.story_date || story.date || ''),
              bannerImage: bannerImage,
              logo: ImagePath.captainEnglishLogo,
              overlayText: story.overlay_text || story.overlayText || '',
            };
          });
          
          setStories(transformedStories);
        } else {
          console.warn('[StoriesScreen] No stories found in response');
          setStories([]);
        }
      } else {
        console.warn('[StoriesScreen] Unexpected API response format:', response);
        setStories([]);
      }
    } catch (error) {
      console.error('[StoriesScreen] Error fetching stories:', error);
      setStories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchStories(true);
  }, [fetchStories]);

  // Fetch stories on mount
  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
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

  // Skeleton component matching the exact design
  const renderSkeleton = () => {
    return (
      <SkeletonPlaceholder
        backgroundColor={colors.backgroundGray}
        highlightColor={colors.backgroundWhite}
        borderRadius={moderateScale(12)}>
        {[1, 2, 3].map((index) => (
          <SkeletonPlaceholder.Item
            key={index}
            backgroundColor={colors.backgroundWhite}
            borderRadius={moderateScale(12)}
            marginBottom={moderateScale(16)}
            overflow="hidden">
            {/* Banner Skeleton - matches bannerContainer */}
            <SkeletonPlaceholder.Item
              height={moderateScale(170)}
              marginHorizontal={moderateScale(10)}
              marginTop={moderateScale(10)}
              borderRadius={moderateScale(10)}
            />
            {/* Story Content Skeleton - matches storyContent */}
            <SkeletonPlaceholder.Item
              padding={moderateScale(16)}>
              {/* Title Skeleton - matches storyTitle */}
              <SkeletonPlaceholder.Item
                width="90%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
                marginBottom={moderateScale(8)}
              />
              {/* Date Row Skeleton - matches dateContainer */}
              <SkeletonPlaceholder.Item
                flexDirection="row"
                alignItems="center">
                <SkeletonPlaceholder.Item
                  width={moderateScale(14)}
                  height={moderateScale(14)}
                  borderRadius={moderateScale(7)}
                  marginRight={moderateScale(6)}
                />
                <SkeletonPlaceholder.Item
                  width="40%"
                  height={moderateScale(12)}
                  borderRadius={moderateScale(2)}
                />
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>
        ))}
      </SkeletonPlaceholder>
    );
  };

  // Render story item
  const renderStoryItem = ({item: story}: {item: any}) => {
    return (
      <TouchableOpacity
        style={dynamicStyles.storyCard}
        activeOpacity={0.7}
        onPress={() => {
          (navigation as any).navigate(SCREEN_NAMES.StoryDetails, {
            storyId: story.id,
            title: story.title,
            date: story.date,
            bannerImage: story.bannerImage,
            images: [story.bannerImage, ImagePath.eventImage, ImagePath.eventImage2],
            fromScreen: 'List',
          });
        }}>
        {/* Banner Section */}
        <View style={dynamicStyles.bannerContainer}>
          <Image
            source={
              typeof story.bannerImage === 'object' && story.bannerImage?.uri
                ? {uri: story.bannerImage.uri}
                : story.bannerImage || ImagePath.storycard
            }
            style={{height: moderateScale(170), width: '100%', resizeMode: 'cover'}}
          />
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
    );
  };

  // List header component
  const ListHeader = () => (
    <Text style={dynamicStyles.title}>Stories</Text>
  );

  // List empty component
  const ListEmptyComponent = () => {
    if (loading || refreshing) {
      return null;
    }
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: moderateScale(100), paddingBottom: moderateScale(50)}}>
        <Image 
          source={ImagePath.noStory} 
          style={{
            width: moderateScale(200),
            height: moderateScale(200),
            resizeMode: 'contain',
            marginBottom: moderateScale(20),
          }}
        />
        <Text style={[Typography.boldXl, {color: colors.textPrimary, fontSize: moderateScale(20)}]}>
          No story found
        </Text>
      </View>
    );
  };

  return (
    <View style={dynamicStyles.container}>
      {loading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.scrollContent}>
          <Text style={dynamicStyles.title}>Stories</Text>
          {renderSkeleton()}
        </ScrollView>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListFooterComponent={refreshing ? renderSkeleton() : null}
        />
      )}
    </View>
  );
}

