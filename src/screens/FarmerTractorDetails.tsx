import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {TabParamList} from '../navigation/TabNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography, FontFamily} from '../utils/typography';
import VideoPlayer from '../components/VideoPlayer';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useStatusBar} from '../contexts/StatusBarContext';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';

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

export default function FarmerTractorDetails() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
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
        console.error('[FarmerTractorDetails] No tractor ID provided');
        setLoading(false);
        return;
      }

      // Call API with tractorId as query parameter
      // API endpoint: GET /api/dealers/tractors?tractorId=11
      console.log('[FarmerTractorDetails] Fetching tractor with ID:', tractorId);
      const response = await getData(Apis.DEALER_TRACTOR_BY_ID, { tractorId: tractorId });
      
      console.log('[FarmerTractorDetails] API Response:', JSON.stringify(response, null, 2));
      
      // Handle API response structure: { status: true, data: { tractorId, title, series, description, mainImage, galleryImages, videoUrl, specifications } }
      let tractorData = null;
      
      if (response?.status === true && response?.data) {
        // Response data is an object with tractor details
        tractorData = response.data;
        console.log('[FarmerTractorDetails] Tractor Data:', JSON.stringify(tractorData, null, 2));
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
          thumbnailUri: mainImage || undefined,
          specifications: transformedSpecs,
          thumbnails: thumbnails.length > 0 ? thumbnails : [
            {id: '1', type: 'image', uri: mainImage || null},
          ],
          gallery_images: galleryImages,
          main_image: mainImage,
        });
      } else {
        console.warn('[FarmerTractorDetails] Unexpected API response format:', response);
        // Set empty state if API fails
        setTractorDetails(null);
      }
    } catch (error) {
      console.error('[FarmerTractorDetails] Error fetching tractor details:', error);
      // Set empty state on error
      setTractorDetails(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchTractorDetails(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTractorDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.tractorId]);

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
          marginBottom: moderateScale(8),
        },
        thumbnailRow: {
          flexDirection: 'row',
          gap: moderateScale(8),
          marginTop: moderateScale(4),
        },
        thumbnail: {
          flex: 1,
          aspectRatio: 16 / 9,
          borderRadius: moderateScale(8),
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
          backgroundColor: colors.textSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        thumbnailMoreText: {
          ...Typography.regularMd,
          fontSize: moderateScale(12),
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
    [moderateScale, insets],
  );

  const currentSpecs = tractorDetails
    ? (tractorDetails.specifications?.[selectedTab] || 
       (Object.keys(tractorDetails.specifications || {}).length > 0 
         ? tractorDetails.specifications[Object.keys(tractorDetails.specifications)[0]]
         : []))
    : [];

  // Prepare images for preview modal - convert thumbnails to ImageItem format
  const previewImages: ImageItem[] = useMemo(() => {
    if (!tractorDetails) return [];
    const images: ImageItem[] = [];
    (tractorDetails.thumbnails || []).forEach((thumb: any, index: number) => {
      if (thumb.type === 'image') {
        images.push({
          id: thumb.id,
          uri: thumb.uri || undefined,
          placeholder: `Image ${index + 1}`,
        });
      }
    });
    return images;
  }, [tractorDetails?.thumbnails]);

  const handleImagePress = (imageIndexInPreview: number) => {
    setSelectedImageIndex(imageIndexInPreview);
    setPreviewModalVisible(true);
  };

  const handleCloseModal = () => {
    setPreviewModalVisible(false);
  };

  const handleReplaceImage = (imageId: string) => {
    // Handle replace image action
    console.log('Replace image:', imageId);
    // You can add your replace image logic here
  };

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const {currentConfig} = useStatusBar();

  return (
      <View style={[dynamicStyles.container]}>
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
        </View>

      {/* Scrollable Content */}
      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tractorDetails ? (
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
        {/* Video Player / Image Section */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.videoContainer}>
            {tractorDetails.videoUri ? (
              <VideoPlayer
                thumbnailUri={tractorDetails.thumbnailUri}
                videoUri={tractorDetails.videoUri}
                title={tractorDetails.model}
              />
            ) : tractorDetails.main_image || tractorDetails.thumbnailUri ? (
              <TouchableOpacity
                style={{flex: 1, borderRadius: moderateScale(8), overflow: 'hidden'}}
                onPress={() => handleImagePress(0)} // Open preview for the main image
                activeOpacity={0.7}>
                <Image
                  source={{uri: tractorDetails.main_image || tractorDetails.thumbnailUri}}
                  style={{width: '100%', height: '100%'}}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : (
              <View style={{flex: 1, backgroundColor: colors.backgroundGray, borderRadius: moderateScale(8), alignItems: 'center', justifyContent: 'center'}}>
                <Ionicons name="image-outline" size={moderateScale(50)} color={colors.textTertiary} />
              </View>
            )}
          </View>

          {/* Thumbnails Row */}
          <View style={dynamicStyles.thumbnailRow}>
            {tractorDetails.thumbnails.map((thumb: any, index: number) => {
              // Calculate image index in previewImages array for click handler
              let imageIndexInPreview = 0;
              if (thumb.type === 'image') {
                let count = 0;
                for (let i = 0; i < index; i++) {
                  if (tractorDetails.thumbnails[i].type === 'image') {
                    count++;
                  }
                }
                imageIndexInPreview = count;
              }

              return (
                <TouchableOpacity
                  key={thumb.id}
                  style={dynamicStyles.thumbnail}
                  onPress={() => thumb.type === 'image' && handleImagePress(imageIndexInPreview)}
                  activeOpacity={thumb.type === 'image' ? 0.7 : 1}
                  disabled={thumb.type === 'more'}>
                  {thumb.type === 'more' ? (
                    <View style={dynamicStyles.thumbnailMore}>
                      <Text style={dynamicStyles.thumbnailMoreText}>
                        + {thumb.count} more
                      </Text>
                    </View>
                  ) : thumb.uri ? (
                    <Image
                      source={{uri: thumb.uri}}
                      style={dynamicStyles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={dynamicStyles.thumbnailImage}>
                      <View
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: colors.backgroundGray,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
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
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Product Information Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.productTitle}>
            {params?.tractorModel || tractorDetails.model}
          </Text>
          <Text style={dynamicStyles.productSeries}>
            {tractorDetails.series}
          </Text>
          <Text 
            style={dynamicStyles.productDescription}
            numberOfLines={showFullDescription ? undefined : 3}
            ellipsizeMode="tail">
            {tractorDetails.fullDescription || tractorDetails.description}
          </Text>
          {tractorDetails.description && tractorDetails.description.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowFullDescription(!showFullDescription)}
              activeOpacity={0.7}>
              <Text style={dynamicStyles.readMoreLink}>
                {showFullDescription ? 'Read less' : 'Read more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Specifications Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.specificationsTitle}>{t('tractors.specifications')}</Text>

          {/* Tabs */}
          {tractorDetails.specifications && Object.keys(tractorDetails.specifications).length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={dynamicStyles.tabScrollView}
              contentContainerStyle={[dynamicStyles.tabContainer, dynamicStyles.tabScrollContent]}>
              {Object.keys(tractorDetails.specifications).map((tab) => {
                const isSelected = selectedTab === tab;
                const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
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
                      {tabLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Specifications List */}
          {currentSpecs.map((spec: any, index: number) => (
            <SpecRow
              key={index}
              name={spec.name || spec.label || ''}
              value={spec.value || ''}
              moderateScale={moderateScale}
            />
          ))}
        </View>
      </ScrollView>
      ) : (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: moderateScale(32)}}>
          <Text style={[Typography.regularMd, {fontSize: moderateScale(16), color: colors.textTertiary, textAlign: 'center'}]}>
            {t('tractors.noDetailsAvailable')}
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

