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
  BackHandler,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {ImagePath} from '../assets/images';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {FarmerTabParamList} from '../navigation/FarmerTabNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {getFarmerProfileData} from '../utils/session';
import {useLanguage} from '../contexts/LanguageContext';
import {isYouTubeUrl, getYouTubeThumbnailUrl} from '../utils/youtubeUtils';

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
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const {currentLanguage, t} = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);
  const [rawStories, setRawStories] = useState<any[]>([]); // Store raw stories for language re-transformation

  // Helper function to transform stories with language-specific titles
  const transformStoriesWithLanguage = useCallback((storiesArray: any[], language: string) => {
    // Transform API stories to match UI structure
    return storiesArray.map((story: any) => {
      // Check for video URL - prioritize YouTube thumbnail if video is YouTube
      let videoUrl = '';
      if (story.media?.cover_video?.video_url) {
        videoUrl = story.media.cover_video.video_url;
      } else if (story.video_url || story.videoUrl) {
        videoUrl = story.video_url || story.videoUrl;
      }
      
      // Priority: multiple images[0] > cover_image_url > YouTube thumbnail > image_url > default
      let imageUrl = null;
      
      // First check for multiple images in media.images - use first image
      if (story.media?.images && Array.isArray(story.media.images) && story.media.images.length > 0) {
        const firstImageObj = story.media.images[0];
        if (firstImageObj?.image_url) {
          // Handle JSON string format (current API) or array format (future API)
          let imageUrls: string[] = [];
          if (typeof firstImageObj.image_url === 'string' && firstImageObj.image_url.trim().startsWith('[')) {
            // Parse JSON string to array
            try {
              const parsedUrls = JSON.parse(firstImageObj.image_url);
              if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
                imageUrls = parsedUrls;
              } else {
                imageUrls = [firstImageObj.image_url];
              }
            } catch (e) {
              imageUrls = [firstImageObj.image_url];
            }
          } else if (Array.isArray(firstImageObj.image_url)) {
            // Future API format: already an array
            imageUrls = firstImageObj.image_url;
          } else {
            // Single string URL
            imageUrls = [firstImageObj.image_url];
          }
          
          // Use first image from the array
          if (imageUrls.length > 0) {
            imageUrl = getImageUrl(imageUrls[0]);
          }
        }
      }
      
      // If no multiple images, check for cover_image_url
      if (!imageUrl) {
        let coverImageUrl = story.cover_image_url || story.media?.cover_image_url;
        if (coverImageUrl) {
          // Handle JSON string format (multiple images) or single string
          if (typeof coverImageUrl === 'string' && coverImageUrl.trim().startsWith('[')) {
            // Parse JSON string to array
            try {
              const parsedUrls = JSON.parse(coverImageUrl);
              if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
                // Use first image from the array
                imageUrl = getImageUrl(parsedUrls[0]);
              } else {
                imageUrl = getImageUrl(coverImageUrl);
              }
            } catch (e) {
              // If parsing fails, treat as single string
              imageUrl = getImageUrl(coverImageUrl);
            }
          } else if (Array.isArray(coverImageUrl)) {
            // Future API format: already an array
            if (coverImageUrl.length > 0) {
              imageUrl = getImageUrl(coverImageUrl[0]);
            }
          } else {
            // Single string URL
            imageUrl = getImageUrl(coverImageUrl);
          }
        }
      }
      
      // If no cover_image_url, check for YouTube thumbnail
      if (!imageUrl && videoUrl && isYouTubeUrl(videoUrl)) {
        const youtubeThumbnail = getYouTubeThumbnailUrl(videoUrl, 'maxresdefault');
        imageUrl = youtubeThumbnail;
      }
      
      // If no YouTube thumbnail, check for image_url
      if (!imageUrl && story.image_url) {
        // Handle JSON string format (current API) or array format (future API)
        let imageUrls: string[] = [];
        if (typeof story.image_url === 'string' && story.image_url.trim().startsWith('[')) {
          // Parse JSON string to array
          try {
            const parsedUrls = JSON.parse(story.image_url);
            if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
              imageUrls = parsedUrls;
            } else {
              imageUrls = [story.image_url];
            }
          } catch (e) {
            console.warn('[StoriesScreen] Failed to parse image_url JSON:', e);
            imageUrls = [story.image_url];
          }
        } else if (Array.isArray(story.image_url)) {
          // Future API format: already an array
          imageUrls = story.image_url;
        } else {
          // Single string URL
          imageUrls = [story.image_url];
        }
        // Use first image from the array
        if (imageUrls.length > 0) {
          imageUrl = getImageUrl(imageUrls[0]);
        }
      }
      
      // Only use image URL if available, otherwise undefined
      const bannerImage = imageUrl ? {uri: imageUrl} : undefined;
      
      // Handle language-specific title
      // Map language code to language_id (en -> 1, hi -> 2, gu -> 3)
      const languageIdMap: Record<string, number> = {
        'en': 1,
        'hi': 2,
        'gu': 3,
      };
      const currentLanguageId = languageIdMap[language] || 1;
      
      // Check if languages array exists and find matching language
      let displayTitle = story.title || 'Story';
      if (story.languages && Array.isArray(story.languages) && story.languages.length > 0) {
        const languageSpecificContent = story.languages.find(
          (lang: any) => lang.language_id === currentLanguageId
        );
        // Use language-specific title if found, otherwise use default title
        if (languageSpecificContent?.title) {
          displayTitle = languageSpecificContent.title;
        } else if (!story.title) {
          // Fallback to English if no title found for selected language
          const englishContent = story.languages.find(
            (lang: any) => lang.language_id === 1
          );
          if (englishContent?.title) {
            displayTitle = englishContent.title;
          }
        }
      }
      
      // Create short title (truncate if needed)
      const shortTitle = displayTitle.length > 40 ? displayTitle.substring(0, 37) + '...' : displayTitle;
      
      return {
        id: story.story_id || story.id || String(Math.random()),
        title: displayTitle,
        shortTitle: shortTitle,
        date: formatDate(story.publish_date || story.story_date || story.date || ''),
        bannerImage: bannerImage,
        logo: ImagePath.captainEnglishLogo,
        overlayText: story.overlay_text || story.overlayText || '',
      };
    });
  }, []);

  // Fetch stories from API
  const fetchStories = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get stored farmer profile data to extract location details
      const profileData = await getFarmerProfileData();
      const locationDetails = profileData?.location_details || {};
      
      console.log('[StoriesScreen] Profile data:', profileData);
      console.log('[StoriesScreen] Location details:', locationDetails);
      
      // Build query parameters in correct order: state, district, village, category
    let urlParams;

      
      // Add state parameter (first)
      if (locationDetails.state_id) {
        // queryParams.state = String(locationDetails.state_id);
        urlParams =`?state=${locationDetails.state_id}`
      }
      
      // Add district parameter (second)
      if (locationDetails.district_id) {
        // queryParams.district = String(locationDetails.district_id);
        urlParams= urlParams + `&district=${locationDetails.district_id}`
      }
      
      // Add village parameter (third)
      if (locationDetails.village_id) {
        // queryParams.village = String(locationDetails.village_id);
        urlParams=urlParams + `&village=${locationDetails.village_id}`
      }
      
      // Add category parameter (fourth)
      if (locationDetails.category_id) {
        // queryParams.category = String(locationDetails.category_id);
        urlParams=urlParams +`&category=${locationDetails.category_id}`
      }
      
      console.log('[EventsScreen] Query parameters (ordered):', urlParams);
      
      // Always use stories by location API when we have profile data
      // Use location API if we have any location parameters, otherwise use regular API
      const apiEndpoint = Apis.FARMER_STORIES_BY_LOCATION + urlParams
      
      // Build URL string to verify order: state=1&district=2&village=3&category=1
      // const urlParams = new URLSearchParams();
      // if (queryParams.state) urlParams.append('state', queryParams.state);
      // if (queryParams.district) urlParams.append('district', queryParams.district);
      // if (queryParams.village) urlParams.append('village', queryParams.village);
      // if (queryParams.category) urlParams.append('category', queryParams.category);
      
      console.log('[StoriesScreen] API Endpoint:', apiEndpoint);
      // console.log('[StoriesScreen] Full URL:', `${apiEndpoint}?${urlParams.toString()}`);
      
      const response = await getData(apiEndpoint);
      
      console.log('[StoriesScreen] Stories API Response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        // Check if data has stories array (new structure) or is directly an array
        const storiesArray = response.data.stories || 
                           response.data.list ||
                           (Array.isArray(response.data) ? response.data : []);
        
        console.log('[StoriesScreen] Stories array extracted:', storiesArray?.length || 0, 'stories');
        
        if (Array.isArray(storiesArray) && storiesArray.length > 0) {
          // Store raw stories for language re-transformation
          setRawStories(storiesArray);
          
          // Transform stories with current language
          const transformedStories = transformStoriesWithLanguage(storiesArray, currentLanguage);
          
          setStories(transformedStories);
        } else {
          console.warn('[StoriesScreen] No stories found in response');
          setStories([]);
          setRawStories([]);
        }
      } else {
        console.warn('[StoriesScreen] Unexpected API response format:', response);
        setStories([]);
        setRawStories([]);
      }
    } catch (error) {
      console.error('[StoriesScreen] Error fetching stories:', error);
      setStories([]);
      setRawStories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transformStoriesWithLanguage, currentLanguage]);

  // Re-transform stories when language changes (if stories are already loaded)
  useEffect(() => {
    if (rawStories.length > 0) {
      const transformedStories = transformStoriesWithLanguage(rawStories, currentLanguage);
      setStories(transformedStories);
    }
  }, [currentLanguage, rawStories, transformStoriesWithLanguage]);

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchStories(true);
  }, [fetchStories]);

  // Fetch stories on mount
  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  // Handle back button - navigate to Home tab
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        tabNavigation.navigate(SCREEN_NAMES.Home);
        return true;
      });

      return () => backHandler.remove();
    }, [tabNavigation])
  );

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
            images: [story.bannerImage],
            fromScreen: 'List',
          });
        }}>
        {/* Banner Section */}
        <View style={dynamicStyles.bannerContainer}>
          {story.bannerImage ? (
            typeof story.bannerImage === 'object' && story.bannerImage?.uri && typeof story.bannerImage.uri === 'string' ? (
              <FastImage
                source={{
                  uri: story.bannerImage.uri,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={{height: moderateScale(170), width: '100%'}}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : typeof story.bannerImage === 'string' ? (
              <FastImage
                source={{
                  uri: story.bannerImage,
                  priority: FastImage.priority.normal,
                  cache: FastImage.cacheControl.immutable,
                }}
                style={{height: moderateScale(170), width: '100%'}}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <Image
                source={story.bannerImage}
                style={{height: moderateScale(170), width: '100%', resizeMode: 'cover'}}
                resizeMode="cover"
              />
            )
          ) : null}
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
    <Text style={dynamicStyles.title}>{t('stories.title')}</Text>
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
          {t('stories.noStoriesFound')}
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
          <Text style={dynamicStyles.title}>{t('stories.title')}</Text>
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

