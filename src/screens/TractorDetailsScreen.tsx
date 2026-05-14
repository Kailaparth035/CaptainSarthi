import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {TabParamList} from '../navigation/TabNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography, FontFamily} from '../utils/typography';
import VideoPlayer from '../components/VideoPlayer';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {useStatusBar} from '../contexts/StatusBarContext';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {isYouTubeUrl, getYouTubeThumbnailUrl, extractYouTubeVideoId} from '../utils/youtubeUtils';
import YoutubePlayer from 'react-native-youtube-iframe';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

type TractorDetailsRouteParams = {
  tractorId: string;
  tractorModel: string;
  tractorOwner: string;
  tractorColor: string;
  fromScreen?: 'Home' | 'List';
};

type SpecificationTab = string; // Dynamic based on API response

// Specification Row Component
const SpecRow = ({
  name,
  value,
  moderateScale,
}: {
  name: string;
  value: string;
  moderateScale: (size: number, factor?: number) => number;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textTertiary,
            flex: 1,
          },
        ]}>
        {name}
      </Text>
      <Text
        style={[
          Typography.mediumMd,
          {
            fontSize: moderateScale(14),
            color: colors.textPrimary,
            flex: 1,
            textAlign: 'right',
          },
        ]}>
        {value}
      </Text>
    </View>
  );
};


export default function TractorDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t, currentLanguageId} = useLanguage();
  const route = useRoute();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const params = route.params as TractorDetailsRouteParams;
  const [tractorDetails, setTractorDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<SpecificationTab>('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  // Fetch tractor details from API
  const fetchTractorDetails = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
        const tractorId = params?.tractorId;
        
        if (!tractorId) {
          console.error('No tractor ID provided');
          setLoading(false);
          return;
        }

        const selectedLanguageId = currentLanguageId || 1;
        console.log('[TractorDetailsScreen] Fetching tractor with ID:', tractorId);
        const response = await getData(Apis.DEALER_TRACTOR_BY_ID, {
          tractorId,
          language_id: String(selectedLanguageId),
        });
        
        console.log('[TractorDetailsScreen] API Response:', JSON.stringify(response, null, 2));
        
        // Handle API response structure: { status: true, data: { [tractorId]: { ... } } }
        let tractorData = null;
        
        if (response?.status === true && response?.data) {
          const rawData = response.data;
          if (rawData.tractorId != null || rawData.id != null || rawData.title) {
            tractorData = rawData;
          } else if (rawData[tractorId]) {
            tractorData = rawData[tractorId];
          } else {
            const entries = Object.values(rawData).filter(
              (item): item is Record<string, unknown> =>
                !!item && typeof item === 'object',
            );
            if (entries.length === 1) {
              tractorData = entries[0];
            }
          }
          console.log('[TractorDetailsScreen] Tractor Data:', JSON.stringify(tractorData, null, 2));
        }
        
        if (tractorData) {
          
          // Transform specifications from API format to component format
          const transformedSpecs: Record<string, Array<{name: string; value: string}>> = {};
          const availableTabs: string[] = [];
          
          if (tractorData.specifications) {
            // API has specifications as object with keys like "Engine", "Tyre", etc.
            Object.keys(tractorData.specifications).forEach((key) => {
              const specKey = key.toLowerCase(); // Convert "Engine" to "engine"
              if (Array.isArray(tractorData.specifications[key])) {
                transformedSpecs[specKey] = tractorData.specifications[key];
                availableTabs.push(specKey);
              }
            });
          }
          
          // Set first available tab as selected
          if (availableTabs.length > 0) {
            setSelectedTab(availableTabs[0]);
          }
          
          // Transform gallery images - use camelCase keys (galleryImages, mainImage, videoUrl)
          const galleryImages = (tractorData.galleryImages || tractorData.gallery_images || []).map((img: string) => getImageUrl(img)).filter(Boolean);
          const mainImage = getImageUrl(tractorData.mainImage || tractorData.main_image);
          // Video URL - only format if it's a relative path, otherwise use as-is
          let videoUrl = tractorData.videoUrl || tractorData.video_url || '';
          if (videoUrl && !videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
            videoUrl = getImageUrl(videoUrl) || '';
          }
          
          // Handle thumbnail - prioritize YouTube thumbnail if video is YouTube
          let thumbnailUrl = null;
          if (videoUrl && isYouTubeUrl(videoUrl)) {
            // Use YouTube thumbnail for YouTube videos
            thumbnailUrl = getYouTubeThumbnailUrl(videoUrl, 'maxresdefault');
          } else if (mainImage) {
            thumbnailUrl = mainImage;
          }
          
          // Transform thumbnails for display - include all gallery images
          const thumbnails = [];
          if (mainImage) {
            thumbnails.push({id: 'main', type: 'image', uri: mainImage});
          }
          // Add all gallery images
          galleryImages.forEach((img: string, index: number) => {
            thumbnails.push({id: `gallery-${index}`, type: 'image', uri: img});
          });
          // Add video if available
          if (videoUrl) {
            thumbnails.push({id: 'video', type: 'video', uri: videoUrl});
          }
          
          setTractorDetails({
            id: tractorData.tractorId?.toString() || tractorData.id?.toString() || tractorId,
            model: tractorData.title || params?.tractorModel || 'Unknown Model',
            series: tractorData.series || '',
            description: tractorData.description || '',
            fullDescription: tractorData.description || '',
            videoUri: videoUrl,
            thumbnailUri: thumbnailUrl || mainImage || undefined,
            specifications: transformedSpecs,
            thumbnails: thumbnails.length > 0 ? thumbnails : [
              {id: '1', type: 'image', uri: mainImage || null},
            ],
            gallery_images: galleryImages,
            main_image: mainImage,
          });
        } else {
          console.warn('Unexpected API response format:', response);
          setTractorDetails(null);
        }
      } catch (error) {
        console.error('Error fetching tractor details:', error);
        setTractorDetails(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchTractorDetails(true);
  }, [currentLanguageId, params?.tractorId]);

  useEffect(() => {
    fetchTractorDetails();
  }, [params?.tractorId, currentLanguageId]);

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
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        backButton: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundWhite,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
          marginLeft: moderateScale(10),
        },
        scrollContent: {
          padding: moderateScale(16),
          paddingBottom: moderateScale(8),
        },
        bottomTabBarContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        videoContainer: {
          width: '100%',
          aspectRatio: 16 / 9,
          marginBottom: moderateScale(12),
          borderRadius: moderateScale(12),
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        mainImageContainer: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(12),
          overflow: 'hidden',
          position: 'relative',
        },
        playButtonOverlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        playButton: {
          width: moderateScale(60),
          height: moderateScale(60),
          borderRadius: moderateScale(30),
          backgroundColor: '#FFD700',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        },
        playIcon: {
          marginLeft: moderateScale(3),
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
          position: 'absolute',
          backgroundColor: 'transparent',
        },
        videoModalCloseButton: {
          position: 'absolute',
          top: insets.top,
          right: moderateScale(20),
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
        thumbnailRow: {
          flexDirection: 'row',
          gap: moderateScale(8),
          marginTop: moderateScale(0),
        },
        thumbnail: {
          flex: 1,
          aspectRatio: 1,
          borderRadius: moderateScale(12),
          backgroundColor: colors.backgroundGray,
          overflow: 'hidden',
        },
        thumbnailImage: {
          width: '100%',
          height: '100%',
          backgroundColor: colors.backgroundGray,
        },
        thumbnailMore: {
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
        productTitle: {
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        productSeries: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.primary,
          marginBottom: moderateScale(12),
        },
        productDescription: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          lineHeight: moderateScale(20),
          marginBottom: moderateScale(8),
        },
        readMoreLink: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.primary,
        },
        specificationsTitle: {
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
          marginBottom: moderateScale(16),
        },
        tabContainer: {
          flexDirection: 'row',
          gap: moderateScale(8),
          marginBottom: moderateScale(16),
        },
        tabScrollView: {
          marginBottom: moderateScale(16),
        },
        tabScrollContent: {
          paddingRight: moderateScale(16),
        },
        tab: {
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(8),
          borderRadius: moderateScale(20),
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.backgroundWhite,
        },
        tabSelected: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          borderWidth: 1.5,
        },
        tabText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(12),
          color: colors.primary,
        },
        tabTextSelected: {
          color: colors.textWhite,
          ...Typography.semiBoldMd,
        },
      }),
    [moderateScale, insets, screenWidth, screenHeight],
  );

  // Get available specification tabs dynamically
  const availableTabs = useMemo(() => {
    if (!tractorDetails?.specifications) return [];
    return Object.keys(tractorDetails.specifications).map(key => key.toLowerCase());
  }, [tractorDetails]);

  // Get current specifications for selected tab
  const currentSpecs = useMemo(() => {
    if (!tractorDetails?.specifications || !selectedTab) return [];
    return tractorDetails.specifications[selectedTab] || [];
  }, [tractorDetails, selectedTab]);

  // Prepare images for preview modal - convert thumbnails to ImageItem format
  const previewImages: ImageItem[] = useMemo(() => {
    if (!tractorDetails?.thumbnails) return [];
    const images: ImageItem[] = [];
    tractorDetails.thumbnails.forEach((thumb: any, index: number) => {
      if (thumb.type === 'image' && thumb.uri) {
        images.push({
          id: thumb.id,
          uri: thumb.uri,
          placeholder: `Image ${index + 1}`,
        });
      }
    });
    // Note: gallery_images are already included in thumbnails, so no need to add separately
    return images;
  }, [tractorDetails?.thumbnails]);

  const handleImagePress = (imageIndexInPreview: number) => {
    setSelectedImageIndex(imageIndexInPreview);
    setPreviewModalVisible(true);
  };

  const handleCloseModal = () => {
    setPreviewModalVisible(false);
  };


  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const {currentConfig} = useStatusBar();

  // Skeleton content component
  const renderSkeletonContent = () => {
    const videoHeight = (screenWidth - moderateScale(32)) * (9 / 16);
    return (
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

        {/* Product Information Card Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(10)}
          padding={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          {/* Title Skeleton */}
          <SkeletonPlaceholder.Item
            width="95%"
            height={moderateScale(20)}
            borderRadius={moderateScale(4)}
            marginBottom={moderateScale(8)}
          />
          <SkeletonPlaceholder.Item
            width="70%"
            height={moderateScale(16)}
            borderRadius={moderateScale(4)}
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
            width="60%"
            height={moderateScale(14)}
            borderRadius={moderateScale(2)}
            marginBottom={moderateScale(12)}
          />
          {/* Read More Skeleton */}
          <SkeletonPlaceholder.Item
            width="25%"
            height={moderateScale(14)}
            borderRadius={moderateScale(2)}
          />
        </SkeletonPlaceholder.Item>

        {/* Specifications Card Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          padding={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          {/* Title Skeleton */}
          <SkeletonPlaceholder.Item
            width="50%"
            height={moderateScale(20)}
            borderRadius={moderateScale(4)}
            marginBottom={moderateScale(16)}
          />

          {/* Tabs Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            marginBottom={moderateScale(16)}>
            <SkeletonPlaceholder.Item
              width={moderateScale(80)}
              height={moderateScale(32)}
              borderRadius={moderateScale(20)}
              marginRight={moderateScale(8)}
            />
            <SkeletonPlaceholder.Item
              width={moderateScale(80)}
              height={moderateScale(32)}
              borderRadius={moderateScale(20)}
              marginRight={moderateScale(8)}
            />
            <SkeletonPlaceholder.Item
              width={moderateScale(100)}
              height={moderateScale(32)}
              borderRadius={moderateScale(20)}
            />
          </SkeletonPlaceholder.Item>

          {/* Specifications Rows Skeleton */}
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              justifyContent="space-between"
              marginBottom={moderateScale(12)}>
              <SkeletonPlaceholder.Item
                width="50%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
              />
              <SkeletonPlaceholder.Item
                width="40%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
              />
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    );
  };

  // Skeleton component matching the exact design
  const renderSkeleton = () => {
    return (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {renderSkeletonContent()}
      </ScrollView>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={dynamicStyles.container}>
        {/* Header */}
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.headerLeft}>
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
            <Text style={dynamicStyles.headerTitle}>{t("farmerProfile.tractorDetails")}</Text>
          </View>
        </View>
        {renderSkeleton()}
      </View>
    );
  }

  if (!tractorDetails) {
    return (
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.headerLeft}>
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
            <Text style={dynamicStyles.headerTitle}>{t("farmerProfile.tractorDetails")}</Text>
          </View>
        </View>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: moderateScale(32)}}>
          <Text style={[Typography.regularMd, {fontSize: moderateScale(16), color: colors.textTertiary, textAlign: 'center'}]}>
            {t('tractors.noDetailsAvailable')}
          </Text>
        </View>
      </View>
    );
  }

  // Helper function to format tab label
  const getTabLabel = (tab: string): string => {
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  return (
      <View style={[dynamicStyles.container]}>
        {/* Header */}
        <View style={dynamicStyles.header}>
          <View style={dynamicStyles.headerLeft}>
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
            <Text style={dynamicStyles.headerTitle}>{t("farmerProfile.tractorDetails")}</Text>
          </View>
        </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {refreshing ? (
          renderSkeletonContent()
        ) : (
          <>
            {/* Video Player / Image Section */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.videoContainer}>
            {tractorDetails.videoUri ? (
              isYouTubeUrl(tractorDetails.videoUri) ? (
                // YouTube video - show thumbnail with play button, open modal on tap
                <TouchableOpacity
                  style={dynamicStyles.mainImageContainer}
                  activeOpacity={0.9}
                  onPress={() => {
                    const videoId = extractYouTubeVideoId(tractorDetails.videoUri);
                    if (videoId) {
                      setSelectedVideoId(videoId);
                      setShowVideoModal(true);
                    }
                  }}>
                  {tractorDetails.thumbnailUri ? (
                    <Image
                      source={{uri: tractorDetails.thumbnailUri}}
                      style={{width: '100%', height: '100%'}}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={{uri: getYouTubeThumbnailUrl(tractorDetails.videoUri) || ''}}
                      style={{width: '100%', height: '100%'}}
                      resizeMode="cover"
                    />
                  )}
                  <View style={dynamicStyles.playButtonOverlay}>
                    <View style={dynamicStyles.playButton}>
                      <Ionicons
                        name="play"
                        size={moderateScale(30)}
                        color={colors.textWhite}
                        style={dynamicStyles.playIcon}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ) : (
                // Non-YouTube video - use VideoPlayer component
                <VideoPlayer
                  thumbnailUri={tractorDetails.thumbnailUri}
                  videoUri={tractorDetails.videoUri}
                  title={tractorDetails.model}
                />
              )
            ) : (
              <TouchableOpacity
                style={dynamicStyles.mainImageContainer}
                onPress={() => {
                  // Open image preview modal with first image (main image)
                  if (previewImages.length > 0) {
                    setSelectedImageIndex(0);
                    setPreviewModalVisible(true);
                  }
                }}
                activeOpacity={0.7}>
                {tractorDetails.thumbnailUri || tractorDetails.main_image ? (
                  <Image
                    source={{uri: tractorDetails.thumbnailUri || tractorDetails.main_image}}
                    style={{width: '100%', height: '100%'}}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: colors.backgroundGray,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Ionicons
                      name="image-outline"
                      size={moderateScale(48)}
                      color={colors.textTertiary}
                    />
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Thumbnails Row - Show only first 3, with "+ X more" if more exist */}
          {previewImages.length > 0 && (
            <View style={dynamicStyles.thumbnailRow}>
              {previewImages.slice(0, 3).map((img: ImageItem, index: number) => {
                const remainingCount = previewImages.length - 3;
                const showMoreOverlay = index === 2 && remainingCount > 0;
                // If there's a video and only 1 image, reduce thumbnail height by 10
                const hasVideoAndSingleImage = tractorDetails.videoUri && previewImages.length === 1;
                const thumbnailStyle = hasVideoAndSingleImage
                  ? [dynamicStyles.thumbnail, {aspectRatio: undefined, height: ((screenWidth - moderateScale(32)) - moderateScale(10))}]
                  : dynamicStyles.thumbnail;

                return (
                  <TouchableOpacity
                    key={img.id || index}
                    style={thumbnailStyle}
                    onPress={() => handleImagePress(index)}
                    activeOpacity={0.7}>
                    {img.uri ? (
                      <>
                        <Image
                          source={{uri: img.uri}}
                          style={dynamicStyles.thumbnailImage}
                          resizeMode="cover"
                        />
                        {showMoreOverlay && (
                          <View style={dynamicStyles.thumbnailMore}>
                            <Text style={dynamicStyles.thumbnailMoreText}>
                              + {remainingCount} more
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={[dynamicStyles.thumbnailImage, {backgroundColor: colors.backgroundGray, alignItems: 'center', justifyContent: 'center'}]}>
                        <Text
                          style={[
                            Typography.regularSm,
                            {
                              fontSize: moderateScale(10),
                              color: colors.textTertiary,
                            },
                          ]}>
                          Image {index + 1}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Product Information Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.productTitle}>
            {params?.tractorModel || tractorDetails.model}
          </Text>
          <Text style={dynamicStyles.productSeries}>
            {tractorDetails.series}
          </Text>
          <Text style={dynamicStyles.productDescription}>
            {showFullDescription
              ? tractorDetails.fullDescription || tractorDetails.description
              : (tractorDetails.description && tractorDetails.description.length > 150
                  ? tractorDetails.description.substring(0, 150) + '...'
                  : tractorDetails.description)}
          </Text>
          <TouchableOpacity
            onPress={() => setShowFullDescription(!showFullDescription)}
            activeOpacity={0.7}>
            <Text style={dynamicStyles.readMoreLink}>
              {showFullDescription ? t('common.readLess') : t('common.readMore')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Specifications Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.specificationsTitle}>Specifications</Text>

          {/* Tabs - Dynamic based on API response */}
          {availableTabs.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={dynamicStyles.tabScrollView}
              contentContainerStyle={[dynamicStyles.tabContainer, dynamicStyles.tabScrollContent]}>
              {availableTabs.map(tab => {
                const isSelected = selectedTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      dynamicStyles.tab,
                      isSelected && dynamicStyles.tabSelected,
                    ]}
                    onPress={() => setSelectedTab(tab)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        dynamicStyles.tabText,
                        isSelected && dynamicStyles.tabTextSelected,
                      ]}>
                      {getTabLabel(tab)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Specifications List */}
          {currentSpecs.length > 0 ? (
            currentSpecs.map((spec: any, index: number) => (
              <SpecRow
                key={index}
                name={spec.name || spec.label || ''}
                value={spec.value || ''}
                moderateScale={moderateScale}
              />
            ))
          ) : (
            <View style={{padding: moderateScale(20), alignItems: 'center'}}>
              <Text style={[Typography.regularMd, {color: colors.textTertiary}]}>
                No specifications available
              </Text>
            </View>
          )}
        </View>
          </>
        )}
      </ScrollView>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={previewModalVisible}
        images={previewImages}
        initialIndex={selectedImageIndex}
        onClose={handleCloseModal}
      />

      {/* YouTube Video Modal */}
      <Modal
        visible={showVideoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowVideoModal(false);
          setSelectedVideoId(null);
        }}>
        <View style={dynamicStyles.videoModalOverlay}>
          <TouchableOpacity
            style={dynamicStyles.videoModalCloseButton}
            onPress={() => {
              setShowVideoModal(false);
              setSelectedVideoId(null);
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

