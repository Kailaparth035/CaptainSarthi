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
  Dimensions,
} from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation, useFocusEffect, CommonActions} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {FarmerTabParamList} from '../navigation/FarmerTabNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import VideoPlayer from '../components/VideoPlayer';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useStatusBar} from '../contexts/StatusBarContext';
import {useTTS} from '../contexts/TTSContext';
import {ImagePath} from '../assets/images';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {useLanguage} from '../contexts/LanguageContext';
import {isYouTubeUrl, getYouTubeThumbnailUrl, extractYouTubeVideoId} from '../utils/youtubeUtils';
import YoutubePlayer from 'react-native-youtube-iframe';
import {Modal, Pressable} from 'react-native';
import Button from '../components/Button';

type StoryDetailsRouteParams = {
  storyId: string;
  title?: string;
  date?: string;
  description?: string;
  videoUri?: string;
  images?: string[];
  fromScreen?: 'Home' | 'List';
};

// Mock story data
const getStoryDetails = (storyId: string) => {
  const defaultData = {
    id: storyId,
    title: 'Tractor Horsepower Guide: Find the Best Fit for Your Farm Work',
    date: '10 November 2025',
    description:
      'Choosing the right tractor horsepower is crucial for efficient farming operations. The horsepower of a tractor determines its ability to handle various farming tasks, from plowing and tilling to harvesting and transportation.',
    fullDescription:
      'Choosing the right tractor horsepower is crucial for efficient farming operations. The horsepower of a tractor determines its ability to handle various farming tasks, from plowing and tilling to harvesting and transportation.\n\nCaptain Tractors proudly organized its National Dealer Meet 2025 on the 9th and 10th of September in the royal city of Udaipur, Rajasthan. This grand assembly brought together over 175+ of our valued dealer partners from every corner of India, celebrating the strength, trust, and growth of the Captain Tractors family.\n\nThe first day was a vibrant celebration. Dealers were welcomed with traditional Rajasthani hospitality, creating a festive atmosphere. An unforgettable evening of folk dance, music, and cultural performances perfectly embodied the event\'s theme, \'Chhalaang\', binding the Captain family in a shared spirit of unity and enthusiasm.\n\nWhen selecting a tractor, consider factors such as field size, soil type, and the specific tasks you need to perform. Smaller farms may benefit from 12-20 HP tractors, while larger operations might require 25-35 HP or more for heavy-duty work.',
    videoUri: '', // Removed static video - only show video if API provides it
    thumbnailUri: ImagePath.eventImage,
    images: [
      ImagePath.eventImage,
      ImagePath.eventImage2,
      ImagePath.eventImage,
      ImagePath.eventImage2,
    ],
  };

  return defaultData;
};

export default function StoryDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const route = useRoute();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const params = route.params as StoryDetailsRouteParams;
  const {currentLanguage, t} = useLanguage();
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storyDetails, setStoryDetails] = useState<any>(null);
  const [storyApiData, setStoryApiData] = useState<any>(null); // Store full API data for language re-transformation
  const [storyNotFound, setStoryNotFound] = useState(false); // Track if story is deleted/not found
  const {playTTS, stopTTS, state: ttsState} = useTTS();

  // Fetch story details from API
  const fetchStoryDetails = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const storyId = params?.storyId;
      
      if (!storyId) {
        console.error('[StoryDetailsScreen] No story ID provided');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Call API with storyId - endpoint: /api/farmers/stories/{storyId}
      console.log('[StoryDetailsScreen] Fetching story with ID:', storyId);
      const apiUrl = `${API_BASE_URL}/api/farmers/stories/${storyId}`;
      const response = await getData(apiUrl, {});
      
      console.log('[StoryDetailsScreen] API Response:', JSON.stringify(response, null, 2));
      
      // Check if story is not found (deleted) - API returns status: false or no data
      if (response?.status === false || !response?.data) {
        console.warn('[StoryDetailsScreen] Story not found or deleted');
        setStoryNotFound(true);
        setStoryDetails(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (response?.status === true && response?.data) {
        setStoryNotFound(false); // Reset not found state
        const storyData = response.data;
        console.log('[StoryDetailsScreen] Story Data:', JSON.stringify(storyData, null, 2));
        
        // Store full API data including languages array
        setStoryApiData(storyData);
        
        // Get language-specific content
        // Map language code to language_id (en -> 1, hi -> 2, gu -> 3)
        const languageIdMap: Record<string, number> = {
          'en': 1,
          'hi': 2,
          'gu': 3,
        };
        
        const currentLanguageId = languageIdMap[currentLanguage] || 1;
        const languageSpecificContent = storyData.languages?.find(
          (lang: any) => lang.language_id === currentLanguageId
        );
        
        // Transform API data to match component format
        // Handle video URL from media.cover_video
        let videoUrl = '';
        if (storyData.media?.cover_video?.video_url) {
          videoUrl = storyData.media.cover_video.video_url;
        } else if (storyData.video_url || storyData.videoUrl) {
          videoUrl = storyData.video_url || storyData.videoUrl;
        }
        
        // Handle thumbnail - prioritize YouTube thumbnail if video is YouTube
        let thumbnailUrl = null;
        if (videoUrl && isYouTubeUrl(videoUrl)) {
          // Use YouTube thumbnail for YouTube videos
          const youtubeThumbnail = getYouTubeThumbnailUrl(videoUrl, 'maxresdefault');
          thumbnailUrl = youtubeThumbnail;
        } else if (storyData.media?.cover_video?.thumbnail_url) {
          thumbnailUrl = getImageUrl(storyData.media.cover_video.thumbnail_url);
        } else if (storyData.image_url) {
          thumbnailUrl = getImageUrl(storyData.image_url);
        }
        // Only use default thumbnail if no video URL or if video is not YouTube
        const thumbnailUri = thumbnailUrl ? {uri: thumbnailUrl} : (videoUrl ? undefined : ImagePath.eventImage);
        
        // Handle date - use display_datetime or display_date
        const date = storyData.display_datetime || storyData.display_date || storyData.story_date || storyData.date || '';
        
        // Handle description - use language-specific description if available, otherwise use default
        const defaultDescription = storyData.content?.full_description || storyData.content?.short_description || storyData.description?.text || storyData.description || '';
        const displayDescription = languageSpecificContent?.description || defaultDescription;
        
        // Use language-specific title if available, otherwise use default title
        const displayTitle = languageSpecificContent?.title || storyData.title || params?.title || 'Story';
        
        // Handle gallery images from media.images
        const galleryImages: any[] = [];
        if (storyData.media?.images && Array.isArray(storyData.media.images)) {
          storyData.media.images.forEach((imgObj: any) => {
            const imgUrl = imgObj.image_url ? getImageUrl(imgObj.image_url) : null;
            if (imgUrl) {
              galleryImages.push({uri: imgUrl});
            }
          });
        }
        // If no gallery images, use thumbnail
        if (galleryImages.length === 0 && thumbnailUrl) {
          galleryImages.push({uri: thumbnailUrl});
        }
        // Final fallback
        if (galleryImages.length === 0) {
          galleryImages.push(ImagePath.eventImage);
        }
        
        setStoryDetails({
          id: storyData.story_id || storyData.id || storyId,
          title: displayTitle,
          date: date,
          description: displayDescription,
          fullDescription: displayDescription,
          videoUri: videoUrl,
          thumbnailUri: thumbnailUri,
          images: galleryImages,
        });
      } else {
        console.warn('[StoryDetailsScreen] Unexpected API response format:', response);
        // Story not found
        setStoryNotFound(true);
        setStoryDetails(null);
      }
    } catch (error) {
      console.error('[StoryDetailsScreen] Error fetching story details:', error);
      // Story not found on error
      setStoryNotFound(true);
      setStoryDetails(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params?.storyId, currentLanguage]);

  // Update displayed content when language changes
  useEffect(() => {
    if (storyApiData) {
      // Map language code to language_id (en -> 1, hi -> 2, gu -> 3)
      const languageIdMap: Record<string, number> = {
        'en': 1,
        'hi': 2,
        'gu': 3,
      };
      
      const currentLanguageId = languageIdMap[currentLanguage] || 1;
      const languageSpecificContent = storyApiData.languages?.find(
        (lang: any) => lang.language_id === currentLanguageId
      );
      
      // Update title and description with language-specific content
      const displayTitle = languageSpecificContent?.title || storyApiData.title || params?.title || 'Story';
      const defaultDescription = storyApiData.content?.full_description || storyApiData.content?.short_description || storyApiData.description?.text || storyApiData.description || '';
      const displayDescription = languageSpecificContent?.description || defaultDescription;
      
      setStoryDetails((prev: any) => ({
        ...prev,
        title: displayTitle,
        description: displayDescription,
        fullDescription: displayDescription,
      }));
    }
  }, [currentLanguage, storyApiData, params?.title]);

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchStoryDetails(true);
  }, [fetchStoryDetails]);

  // Fetch story details on mount
  useEffect(() => {
    fetchStoryDetails();
  }, [fetchStoryDetails]);

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
          paddingBottom: moderateScale(12),
          backgroundColor: colors.backgroundLight,
        },
        backButton: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundWhite,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        headerTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
          marginLeft: moderateScale(10),
        },
        scrollContent: {
          padding: moderateScale(16),
          paddingBottom: moderateScale(100),
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(10),
          padding: moderateScale(16),
          marginVertical: moderateScale(16),
        },
        videoContainer: {
          width: '100%',
          aspectRatio: 16 / 9,
          marginBottom: moderateScale(8),
          borderRadius: moderateScale(10),
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        bannerImageContainer: {
          width: '100%',
          height: moderateScale(250),
          marginBottom: moderateScale(8),
          borderRadius: moderateScale(10),
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        thumbnailContainer: {
          flexDirection: 'row',
          gap: moderateScale(8),
          marginTop: moderateScale(8),
          height: moderateScale(128),
        },
        thumbnailLeft: {
          flex: 1.8,
          borderRadius: moderateScale(8),
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        thumbnailRight: {
          flex: 1,
          gap: moderateScale(8),
          justifyContent: 'space-between',
        },
        thumbnail: {
          borderRadius: moderateScale(8),
          backgroundColor: 'transparent',
          overflow: 'hidden',
        },
        thumbnailImage: {
          width: '100%',
          height: moderateScale(60),
          borderRadius: moderateScale(8),
        },
        thumbnailLeftImage: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(8),
        },
        thumbnailMore: {
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        thumbnailMoreText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textWhite,
        },
        storyTitle: {
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
          marginBottom: moderateScale(12),
        },
        dateContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        dateText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
          marginLeft: moderateScale(8),
        },
        descriptionCard: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        textToSpeechButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.light_orange,
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(10),
          borderRadius: moderateScale(20),
          alignSelf: 'flex-start',
          marginBottom: moderateScale(16),
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.primary,
        },
        textToSpeechButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.primary,
          marginLeft: moderateScale(8),
        },
        descriptionText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          lineHeight: moderateScale(22),
        },
        videoModalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        videoModalContainer: {
          width: screenWidth,
          bottom: moderateScale(30),
          justifyContent: 'center',
          alignItems: 'center',
          position:'absolute',
          backgroundColor: 'transparent',
        },
        videoModalCloseButton: {
          position: 'absolute',
          top: insets.top ,
          right: moderateScale(20),
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
      }),
    [moderateScale, insets, screenWidth, screenHeight],
  );

  // Prepare images for preview modal
  const previewImages: ImageItem[] = useMemo(() => {
    if (!storyDetails?.images) return [];
    const images: ImageItem[] = [];
    storyDetails.images.forEach((img: any, index: number) => {
      if (typeof img === 'number') {
        images.push({
          id: `img-${index}`,
          source: img,
          placeholder: `Image ${index + 1}`,
        });
      } else if (img?.uri) {
        images.push({
          id: `img-${index}`,
          uri: img.uri,
          placeholder: `Image ${index + 1}`,
        });
      } else if (typeof img === 'string') {
        images.push({
          id: `img-${index}`,
          uri: img,
          placeholder: `Image ${index + 1}`,
        });
      }
    });
    return images;
  }, [storyDetails?.images]);

  const handleImagePress = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
    setPreviewModalVisible(true);
  };

  const handleCloseModal = () => {
    setPreviewModalVisible(false);
  };

  const handleReplaceImage = (imageId: string) => {
    console.log('Replace image:', imageId);
  };

  const handleTextToSpeech = async () => {
    const descriptionText = params?.description || storyDetails?.fullDescription;
    await playTTS(descriptionText);
  };

  // Stop TTS when navigating away from this screen
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This cleanup function runs when the screen loses focus
        stopTTS();
      };
    }, [stopTTS])
  );

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const {currentConfig} = useStatusBar();

  // Skeleton component matching the exact design
  const renderSkeleton = () => {
    const videoHeight = (screenWidth - moderateScale(32)) * (9 / 16);
    return (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <SkeletonPlaceholder
          backgroundColor={colors.backgroundGray}
          highlightColor={colors.backgroundWhite}
          borderRadius={moderateScale(10)}>
          {/* Video Player Skeleton */}
          <SkeletonPlaceholder.Item
            width="100%"
            height={videoHeight}
            borderRadius={moderateScale(10)}
            marginBottom={moderateScale(8)}
          />

          {/* Thumbnails Grid Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            marginTop={moderateScale(8)}
            marginBottom={moderateScale(16)}>
            {/* Left: Full height skeleton */}
            <SkeletonPlaceholder.Item
              flex={1.8}
              height={moderateScale(128)}
              borderRadius={moderateScale(8)}
              marginRight={moderateScale(8)}
            />
            {/* Right: 2 stacked skeletons */}
            <SkeletonPlaceholder.Item flex={1}>
              <SkeletonPlaceholder.Item
                width="100%"
                height={moderateScale(60)}
                borderRadius={moderateScale(8)}
                marginBottom={moderateScale(8)}
              />
              <SkeletonPlaceholder.Item
                width="100%"
                height={moderateScale(60)}
                borderRadius={moderateScale(8)}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>

          {/* Story Title and Date Card Skeleton */}
          <SkeletonPlaceholder.Item
            backgroundColor={colors.backgroundWhite}
            borderRadius={moderateScale(10)}
            padding={moderateScale(16)}
            marginVertical={moderateScale(16)}>
            {/* Title Skeleton */}
            <SkeletonPlaceholder.Item
              width="95%"
              height={moderateScale(20)}
              borderRadius={moderateScale(4)}
              marginBottom={moderateScale(8)}
            />
            <SkeletonPlaceholder.Item
              width="75%"
              height={moderateScale(20)}
              borderRadius={moderateScale(4)}
              marginBottom={moderateScale(12)}
            />
            {/* Date Row Skeleton */}
            <SkeletonPlaceholder.Item
              flexDirection="row"
              alignItems="center">
              <SkeletonPlaceholder.Item
                width={moderateScale(18)}
                height={moderateScale(18)}
                borderRadius={moderateScale(9)}
                marginRight={moderateScale(8)}
              />
              <SkeletonPlaceholder.Item
                width="50%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>

        {/* Description Card Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          padding={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          {/* TTS Button Skeleton */}
          <SkeletonPlaceholder.Item
            width="40%"
            height={moderateScale(38)}
            borderRadius={moderateScale(20)}
            marginBottom={moderateScale(16)}
          />
          {/* Description Lines Skeleton */}
          <SkeletonPlaceholder.Item
            width="100%"
            height={moderateScale(14)}
            borderRadius={moderateScale(2)}
            marginBottom={moderateScale(8)}
          />
          <SkeletonPlaceholder.Item
            width="100%"
            height={moderateScale(14)}
            borderRadius={moderateScale(2)}
            marginBottom={moderateScale(8)}
          />
          <SkeletonPlaceholder.Item
            width="95%"
            height={moderateScale(14)}
            borderRadius={moderateScale(2)}
            marginBottom={moderateScale(8)}
          />
          <SkeletonPlaceholder.Item
            width="90%"
            height={moderateScale(14)}
            borderRadius={moderateScale(2)}
            marginBottom={moderateScale(8)}
          />
          <SkeletonPlaceholder.Item
            width="85%"
            height={moderateScale(14)}
            borderRadius={moderateScale(2)}
          />
        </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder>
      </ScrollView>
    );
  };

  // Render error state for deleted/not found story
  if (!loading && storyNotFound) {
    return (
      <View style={dynamicStyles.container}>
        {/* Header */}
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={() => {
              if (params?.fromScreen === 'Home') {
                tabNavigation.navigate(SCREEN_NAMES.Home);
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}>
            <Ionicons
              name="arrow-back"
              size={moderateScale(20)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>{t('stories.storyDetail')}</Text>
        </View>
        
        {/* Error State */}
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: moderateScale(32)}}>
          <Text style={[Typography.boldXl, {color: colors.textPrimary, fontSize: moderateScale(20), marginBottom: moderateScale(24), textAlign: 'center'}]}>
            {t('stories.noStoryFound')}
          </Text>
          <Button
            title={t('stories.goToHome')}
            onPress={() => {
              // Navigate to Home tab with nested navigation to reset stack to Home screen
              tabNavigation.navigate(SCREEN_NAMES.Home, {
                screen: SCREEN_NAMES.Home,
              });
            }}
            style={{minWidth: moderateScale(200)}}
          />
        </View>
      </View>
    );
  }

  if (loading || !storyDetails) {
    return (
      <View style={dynamicStyles.container}>
        {/* Header */}
        <View style={dynamicStyles.header}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={() => {
              if (params?.fromScreen === 'Home') {
                tabNavigation.navigate(SCREEN_NAMES.Home);
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}>
            <Ionicons
              name="arrow-back"
              size={moderateScale(20)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>{t('stories.storyDetail')}</Text>
        </View>
        {renderSkeleton()}
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => {
            // If coming from Home, navigate back to Home tab
            // If coming from List, use goBack() to return to list
            if (params?.fromScreen === 'Home') {
              tabNavigation.navigate(SCREEN_NAMES.Home);
            } else {
              navigation.goBack();
            }
          }}
          activeOpacity={0.7}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>{t('stories.storyDetail')}</Text>
      </View>

      {/* Scrollable Content */}
      {refreshing ? (
        renderSkeleton()
      ) : (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }>
        {/* Video Player Section - Only show if video exists */}
        {storyDetails.videoUri && storyDetails.videoUri.trim() !== '' ? (
          <View style={dynamicStyles.videoContainer}>
            {isYouTubeUrl(storyDetails.videoUri) ? (
              // YouTube video - show thumbnail with play button, open modal on tap
              <TouchableOpacity
                style={{width: '100%', height: '100%'}}
                activeOpacity={0.9}
                onPress={() => {
                  const videoId = extractYouTubeVideoId(storyDetails.videoUri);
                  if (videoId) {
                    setSelectedVideoId(videoId);
                    setShowVideoModal(true);
                  }
                }}>
                {typeof storyDetails.thumbnailUri === 'object' && storyDetails.thumbnailUri?.uri ? (
                  <Image
                    source={{uri: storyDetails.thumbnailUri.uri}}
                    style={{width: '100%', height: '100%', borderRadius: moderateScale(10)}}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{width: '100%', height: '100%', backgroundColor: colors.backgroundGray, borderRadius: moderateScale(10), justifyContent: 'center', alignItems: 'center'}}>
                    <Ionicons name="play-circle" size={moderateScale(60)} color={colors.textWhite} />
                  </View>
                )}
                <View style={{position: 'absolute', top: '50%', left: '50%', transform: [{translateX: -moderateScale(30)}, {translateY: -moderateScale(30)}]}}>
                  <Ionicons name="play-circle" size={moderateScale(60)} color={colors.textWhite} style={{opacity: 0.9}} />
                </View>
              </TouchableOpacity>
            ) : (
              // Non-YouTube video - use VideoPlayer component
              <VideoPlayer
                thumbnailUri={
                  typeof storyDetails.thumbnailUri === 'object' && storyDetails.thumbnailUri?.uri
                    ? storyDetails.thumbnailUri.uri
                    : undefined
                }
                thumbnailSource={
                  typeof storyDetails.thumbnailUri === 'number'
                    ? storyDetails.thumbnailUri
                    : undefined
                }
                videoUri={storyDetails.videoUri}
                title={storyDetails.title}
              />
            )}
          </View>
        ) : (
          // Banner Image Section - Show when video is not available
          storyDetails.images && storyDetails.images.length > 0 && (
            <TouchableOpacity
              style={dynamicStyles.bannerImageContainer}
              onPress={() => handleImagePress(0)}
              activeOpacity={0.9}>
              <Image
                source={
                  typeof storyDetails.images[0] === 'object' && storyDetails.images[0]?.uri
                    ? {uri: storyDetails.images[0].uri}
                    : typeof storyDetails.thumbnailUri === 'object' && storyDetails.thumbnailUri?.uri
                    ? {uri: storyDetails.thumbnailUri.uri}
                    : typeof storyDetails.thumbnailUri === 'number'
                    ? storyDetails.thumbnailUri
                    : storyDetails.images[0] || ImagePath.eventImage
                }
                style={{width: '100%', height: '100%', borderRadius: moderateScale(10)}}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )
        )}

          {/* Thumbnails Grid - Left: Full height, Right: 2 stacked - Only show when video exists */}
          {storyDetails.videoUri && storyDetails.videoUri.trim() !== '' && (
            <View style={dynamicStyles.thumbnailContainer}>
            {/* Left: Full height image */}
            {storyDetails.images && storyDetails.images.length > 0 && (
              <TouchableOpacity
                style={dynamicStyles.thumbnailLeft}
                onPress={() => handleImagePress(0)}
                activeOpacity={0.7}>
                <Image
                  source={
                    typeof storyDetails.images[0] === 'object' && storyDetails.images[0]?.uri
                      ? {uri: storyDetails.images[0].uri}
                      : storyDetails.images[0] || ImagePath.eventImage
                  }
                  style={dynamicStyles.thumbnailLeftImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {/* Right: 2 stacked images */}
            <View style={dynamicStyles.thumbnailRight}>
              {storyDetails.images?.slice(1, 3).map((image: any, index: number) => (
                <TouchableOpacity
                  key={index + 1}
                  style={[dynamicStyles.thumbnail]}
                  onPress={() => handleImagePress(index + 1)}
                  activeOpacity={0.7}>
                  <Image
                    source={
                      typeof image === 'object' && image?.uri
                        ? {uri: image.uri}
                        : image || ImagePath.eventImage
                    }
                    style={dynamicStyles.thumbnailImage}
                    resizeMode="cover"
                  />
                  {index === 1 && storyDetails.images && storyDetails.images.length > 3 && (
                    <View style={dynamicStyles.thumbnailMore}>
                      <Text style={dynamicStyles.thumbnailMoreText}>
                        + {storyDetails.images.length - 3} more
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          )}
        {/* </View> */}

        {/* Story Title and Date Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.storyTitle}>
            {storyDetails.title}
          </Text>

          {/* Date */}
          <View style={dynamicStyles.dateContainer}>
            <Ionicons
              name="calendar-outline"
              size={moderateScale(18)}
              color={colors.textSecondary}
            />
            <Text style={dynamicStyles.dateText}>
              {params?.date || storyDetails.date}
            </Text>
          </View>
        </View>

        {/* Description Card */}
        <View style={dynamicStyles.descriptionCard}>
          {!ttsState.isPlaying && (
            <TouchableOpacity
              style={dynamicStyles.textToSpeechButton}
              onPress={handleTextToSpeech}
              activeOpacity={0.7}>
              <Ionicons
                name="headset-outline"
                size={moderateScale(18)}
                color={colors.primary}
              />
              <Text style={dynamicStyles.textToSpeechButtonText}>
                Text to speech
              </Text>
            </TouchableOpacity>
          )}

          <Text style={dynamicStyles.descriptionText}>
            {params?.description || storyDetails.fullDescription}
          </Text>
        </View>
        </ScrollView>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={previewModalVisible}
        images={previewImages}
        initialIndex={selectedImageIndex}
        onClose={handleCloseModal}
        // onReplaceImage={handleReplaceImage}
      />

      {/* YouTube Video Modal */}
      <Modal
        visible={showVideoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowVideoModal(false);
          setSelectedVideoId(null);
          // startAnnouncementAutoSlide();
        }}>
        <View style={dynamicStyles.videoModalOverlay}>
        <TouchableOpacity
                style={dynamicStyles.videoModalCloseButton}
                onPress={() => {
                  setShowVideoModal(false);
                  setSelectedVideoId(null);
                  // startAnnouncementAutoSlide();
                }}
                activeOpacity={0.7}>
                <Ionicons
                  name="close"
                  size={moderateScale(24)}
                  color={colors.textWhite}
                />
              </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              setShowVideoModal(false);
              setSelectedVideoId(null);
              // startAnnouncementAutoSlide();
            }}
          />
          {selectedVideoId && (
            <View style={dynamicStyles.videoModalContainer}>
              
              <View style={{
                width: screenWidth * 0.9,
                height: screenHeight * 0.6,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'transparent',
              }}>
                
                <YoutubePlayer
                  height={screenHeight * 0.6}
                  width={screenWidth * 0.9}
                  play={true}
                  videoId={selectedVideoId}
                />
              </View>
      
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

