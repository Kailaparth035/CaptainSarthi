import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
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
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';

type StoryDetailsRouteParams = {
  storyId: string;
  title?: string;
  date?: string;
  description?: string;
  videoUri?: string;
  images?: string[];
  image?: string;
  video_url?: string;
  fromScreen?: 'Home' | 'List';
};

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
const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // If relative path, prepend base URL
  return `${API_BASE_URL}${imagePath}`;
};

export default function StoryDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const route = useRoute();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const params = route.params as StoryDetailsRouteParams;
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const {playTTS, state: ttsState} = useTTS();
  const [storyDetails, setStoryDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch story details from API using storyId
  useEffect(() => {
    const fetchStoryDetails = async () => {
      try {
        setLoading(true);
        const storyId = params?.storyId;
        
        if (!storyId) {
          console.error('No storyId provided');
          setLoading(false);
          return;
        }

        // Call API with storyId as query parameter (api/farmers/stories/{id}?id={id})
        const response = await getData(Apis.FARMER_STORIES, { id: storyId });
        
        // Handle API response structure: { status: true, data: {...} }
        if (response?.status === true && response?.data) {
          const storyData = response.data;
          
          // Transform API response to match expected format
          setStoryDetails({
            id: storyData.id?.toString() || '',
            title: storyData.title || '',
            date: formatDate(storyData.createdAt),
            description: storyData.description || '',
            fullDescription: storyData.description || '',
            videoUri: storyData.video_url || null,
            thumbnailUri: getImageUrl(storyData.image) ? {uri: getImageUrl(storyData.image)} : null,
            image: getImageUrl(storyData.image),
            images: storyData.image ? [getImageUrl(storyData.image)].filter(Boolean) : [],
          });
        } else {
          console.warn('Unexpected API response format:', response);
          setStoryDetails(null);
        }
      } catch (error) {
        console.error('Error fetching story details:', error);
        setStoryDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryDetails();
  }, [params?.storyId]);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        statusBarBackground: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? insets.top : 0,
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
        },
        scrollContent: {
          padding: moderateScale(16),
          paddingBottom: moderateScale(100),
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(10),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        videoContainer: {
          width: '100%',
          aspectRatio: 16 / 9,
          marginBottom: moderateScale(8),
          borderRadius: moderateScale(10),
          overflow: 'hidden',
        },
        thumbnailContainer: {
          aspectRatio: 16 / 8.5,
          flexDirection: 'row',
          gap: moderateScale(5),
          marginTop: moderateScale(8),
        },
        thumbnailLeft: {
          flex: 1.4,
        },
        thumbnailRight: {
          flex: 1,
          gap: moderateScale(8),
        },
        thumbnail: {
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          overflow: 'hidden',
        },
        thumbnailImage: {
          width: '100%',
          height: moderateScale(80),
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
      }),
    [moderateScale, insets],
  );

  // Prepare images for preview modal from API data
  const previewImages: ImageItem[] = useMemo(() => {
    const images: ImageItem[] = [];
    
    if (!storyDetails) return images;
    
    // Main story image
    if (storyDetails.image) {
      images.push({
        id: 'main',
        uri: storyDetails.image,
      });
    }
    
    // Additional images if available
    if (storyDetails.images && storyDetails.images.length > 0) {
      storyDetails.images.forEach((img: string, index: number) => {
        if (img) {
          images.push({
            id: `img-${index}`,
            uri: img,
          });
        }
      });
    }
    
    return images;
  }, [storyDetails]);

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
    const descriptionText = params?.description || storyDetails?.fullDescription || storyDetails?.description || '';
    if (descriptionText) {
      await playTTS(descriptionText);
    }
  };

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const {currentConfig} = useStatusBar();

  return (
    <View style={dynamicStyles.container}>
      {Platform.OS === 'ios' && (
        <View
          style={[
            dynamicStyles.statusBarBackground,
            {backgroundColor: currentConfig.backgroundColor},
          ]}
        />
      )}

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
        <Text style={dynamicStyles.headerTitle}>Story detail</Text>
      </View>

      {/* Scrollable Content */}
      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : storyDetails ? (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Video Player Section */}
          <View style={dynamicStyles.card}>
            <View style={dynamicStyles.videoContainer}>
              <VideoPlayer
                thumbnailUri={storyDetails.image ? storyDetails.image : undefined}
                thumbnailSource={storyDetails.thumbnailUri}
                videoUri={storyDetails.videoUri}
                title={storyDetails.title}
              />
            </View>

            {/* Thumbnails Grid - Left: Full height, Right: 2 stacked */}
            {storyDetails.images && storyDetails.images.length > 0 && (
              <View style={dynamicStyles.thumbnailContainer}>
                {/* Left: Full height image */}
                <TouchableOpacity
                  style={dynamicStyles.thumbnailLeft}
                  onPress={() => handleImagePress(0)}
                  activeOpacity={0.7}>
                  <Image
                    source={{uri: storyDetails.images[0]}}
                    style={[dynamicStyles.thumbnailImage, {height: moderateScale(170)}]}
                    resizeMode="contain"
                  />
                </TouchableOpacity>

                {/* Right: 2 stacked images */}
                <View style={dynamicStyles.thumbnailRight}>
                  {storyDetails.images.slice(1, 3).map((image: string, index: number) => (
                    <TouchableOpacity
                      key={index + 1}
                      style={[dynamicStyles.thumbnail]}
                      onPress={() => handleImagePress(index + 1)}
                      activeOpacity={0.7}>
                      <Image
                        source={{uri: image}}
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
          </View>

          {/* Story Title and Date Card */}
          <View style={dynamicStyles.card}>
            <Text style={dynamicStyles.storyTitle}>
              {params?.title || storyDetails.title}
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
              {params?.description || storyDetails.description || storyDetails.fullDescription || ''}
            </Text>
          </View>
        </ScrollView>
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: moderateScale(20)}}>
          <Text style={[Typography.regularMd, {color: colors.textSecondary}]}>
            No story details found
          </Text>
        </View>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={previewModalVisible}
        images={previewImages}
        initialIndex={selectedImageIndex}
        onClose={handleCloseModal}
        onReplaceImage={handleReplaceImage}
      />
    </View>
  );
}

