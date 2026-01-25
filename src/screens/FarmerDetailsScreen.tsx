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
import {useRoute, useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {TabParamList} from '../navigation/TabNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';

type FarmerDetailsRouteParams = {
  farmerId: string;
  farmer_id?: string;
  farmerName: string;
  farmerPhone: string;
  farmerInitials: string;
  fromScreen?: 'Home' | 'List';
};


// Info Row Component
const InfoRow = ({
  label,
  value,
  moderateScale,
  valueUnderlined = false,
  isShowBorderBottom = true
}: {
  label: string;
  value: string;
  moderateScale: (size: number, factor?: number) => number;
  valueUnderlined?: boolean;
  isShowBorderBottom?: boolean;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(12),
        borderBottomWidth: isShowBorderBottom ?  1 : 0, 
        borderBottomColor: colors.borderLight,
      }}>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textTertiary,
            flex: 0.4,
            marginRight: moderateScale(8),
          },
        ]}>
        {label}
      </Text>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textPrimary,
            flex: 0.6,
            textAlign: 'right',
            textDecorationLine: valueUnderlined ? 'underline' : 'none',
            flexShrink: 1,
          },
        ]}
        numberOfLines={1}
        ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  );
};

export default function FarmerDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const route = useRoute();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const params = route.params as FarmerDetailsRouteParams;
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedTractorIndex, setSelectedTractorIndex] = useState(0);
  const [farmerDetails, setFarmerDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dealershipName, setDealershipName] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined): string => {
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


  // Fetch dealer profile to get username for dealership name
  const fetchDealerProfile = async () => {
    try {
      const profileResponse = await getData(Apis.DEALER_PROFILE, {});
      if (profileResponse?.status === true && profileResponse?.data) {
        const profileData = profileResponse.data;
        // Use name field as dealership name (username)
        const dealerName = profileData.name || '';
        setDealershipName(dealerName);
        console.log('[FarmerDetailsScreen] Dealer profile fetched, name:', dealerName);
      }
    } catch (error) {
      console.error('[FarmerDetailsScreen] Error fetching dealer profile:', error);
      // Keep empty string if fetch fails
      setDealershipName('');
    }
  };

  // Fetch farmer details from API using clientId
  const fetchFarmerDetails = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const clientId = params?.farmerId || params?.farmer_id;
      
      if (!clientId) {
        console.error('No farmer_id provided');
        setLoading(false);
        return;
      }

      console.log('[FarmerDetailsScreen] Screen focused - fetching latest farmer details for:', clientId);
      
      // Fetch dealer profile and farmer details in parallel
      const [, response] = await Promise.all([
        fetchDealerProfile(),
        getData(Apis.DEALER_FARMERS, { clientId })
      ]);
      
      // Handle API response structure: { status: true, data: {...} }
      if (response?.status === true && response?.data) {
        const farmerData = response.data;
        console.log("farmerData ::",farmerData);
        
        
        // Combine firstName, middleName, lastName
        const nameParts = [
          farmerData.firstName,
          farmerData.middleName,
          farmerData.lastName,
        ].filter(Boolean);
        const fullName = nameParts.join(' ').trim();
        
        // Transform tractors array
        const transformedTractors = (farmerData.tractors || []).map((tractor: any) => {
          // Process tractorImages array - convert all URLs to full image URLs
          const tractorImagesArray = (tractor.tractorImages || []).map((imgUrl: string) => 
            getImageUrl(imgUrl)
          ).filter(Boolean) as string[];
          
          // If tractorImage exists but not in tractorImages array, add it
          const mainImageUrl = getImageUrl(tractor.tractorImage);
          if (mainImageUrl && !tractorImagesArray.includes(mainImageUrl)) {
            tractorImagesArray.unshift(mainImageUrl);
          }
          console.log("tractorImagesArray ::",tractor);
          
          return {
            id: tractor.tractorId?.toString() || '',
            tractorId: tractor.tractorId,
            model: tractor.model || '',
            chassisNo: tractor.chassisNo || '',
            vehicleNo: tractor.vehicleNo || '',
            engineNo: tractor.engineNo || '',
            mobile: tractor.ownerMobile || '',
            dateOfInvoice: formatDate(tractor.dateOfInvoice) || '',
            whoDrives: tractor.whoDrives || '',
            tractorImage: mainImageUrl, // Keep for backward compatibility
            tractorImages: tractorImagesArray, // Array of all tractor images
            rcImagesFront: getImageUrl(tractor.rcImagesFront),
            rcImagesBack: getImageUrl(tractor.rcImagesBack),
            ownername: tractor.ownername || '',
            // Keep rcImages for backward compatibility if needed
            rcImages: [
              tractor.rcImagesFront ? getImageUrl(tractor.rcImagesFront) : null,
              tractor.rcImagesBack ? getImageUrl(tractor.rcImagesBack) : null,
            ].filter(Boolean) as string[],
          };
        });
        
        // Transform API response to match expected format
        setFarmerDetails({
          id: farmerData.farmerId || params?.farmerId || "",
          farmer_id: farmerData.farmerId || "",
          firstName: farmerData.firstName || "",
          middleName: farmerData.middleName || "",
          lastName: farmerData.lastName || "",
          fullName: fullName,
          verificationStatus:farmerData?.verificationStatus,
          mobile: `+91 ${farmerData.mobile}` || "",
          dateOfBirth: formatDate(farmerData.dateOfBirth) || "",
          dateOfMarriage: formatDate(farmerData.dateOfMarriage) || "",
          dealershipName: farmerData.dealershipName || "",
          profileImage: getImageUrl(farmerData.profileImage),
          tractors: transformedTractors,
          addressData:
            farmerData?.house_number + " " +
            farmerData?.street_name + " " +
            farmerData?.landmark + " " +
            farmerData?.landmark + " " +
            farmerData?.pincode,
        });
      } else {
        // API didn't return expected structure
        console.warn('Unexpected API response format:', response);
        setFarmerDetails(null);
      }
    } catch (error) {
      console.error('Error fetching farmer details:', error);
      setFarmerDetails(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchFarmerDetails(true);
  }, []);

  // Fetch data on mount and whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchFarmerDetails();
    }, [params?.farmer_id, params?.farmerId])
  );

  // Prepare images for preview modal from API data based on selected tractor
  const previewImages: ImageItem[] = useMemo(() => {
    const images: ImageItem[] = [];
    
    if (!farmerDetails || !farmerDetails.tractors || farmerDetails.tractors.length === 0) {
      return images;
    }
    
    // Get images from the selected tractor
    const tractor = farmerDetails.tractors[selectedTractorIndex];
    if (!tractor) return images;
    
    // Add all tractor images from tractorImages array
    if (tractor.tractorImages && Array.isArray(tractor.tractorImages)) {
      tractor.tractorImages.forEach((imageUri: string, index: number) => {
        if (imageUri) {
          images.push({
            id: `tractor-image-${index}`,
            uri: imageUri,
          });
        }
      });
    } else if (tractor.tractorImage) {
      // Fallback to single tractorImage if tractorImages array is not available
      images.push({
        id: 'tractor-main',
        uri: tractor.tractorImage,
      });
    }
    
    // RC book images are not included in preview modal
    
    return images;
  }, [farmerDetails, selectedTractorIndex]);

  const handleImagePress = (docIndex: number) => {
    setSelectedImageIndex(docIndex);
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
          justifyContent: 'space-between',
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
          marginBottom:moderateScale(7),
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
          marginRight: moderateScale(12),
        },
        headerTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
          marginLeft: moderateScale(10),
        },
        editButton: {
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(8),
          borderRadius: moderateScale(20),
          backgroundColor: colors.primary,
        },
        editButtonText: {
          ...Typography.semiBoldMd,
          color: colors.textWhite,
          fontSize: moderateScale(14),
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        profileHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(20),
        },
        profileImageContainer: {
          position: 'relative',
          marginRight: moderateScale(16),
        },
        profileImage: {
          width: moderateScale(60),
          height: moderateScale(60),
          borderRadius: moderateScale(40),
          backgroundColor: colors.light_dark_yellow,
          alignItems: 'center',
          justifyContent: 'center',
        },
        profileImageText: {
          ...Typography.boldXl,
          fontSize: moderateScale(22),
          color: colors.textSecondary,
        },
        cameraIconContainer: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: moderateScale(22),
          height: moderateScale(22),
          borderRadius: moderateScale(14),
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.backgroundWhite,
        },
        profileInfo: {
          flex: 1,
        },
        profileName: {
          ...Typography.boldXl,
          fontSize: moderateScale(18), 
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
          textTransform: 'capitalize',
        },
        profilePhone: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
        tractorHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        tractorTitle: {
          ...Typography.boldXl,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
        },
        tractorCount: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
        tractorImageContainer: {
          width: '100%',
          marginVertical: moderateScale(16),
        },
        tractorMainImage: {
          width: '100%',
          height: moderateScale(200),
          borderRadius: moderateScale(8),
          // backgroundColor: colors.backgroundGray,
          marginBottom: moderateScale(12),
          overflow: 'hidden',
        },
        tractorImagesRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: '100%',
          marginBottom: moderateScale(12),
        },
        tractorImageHalf: {
          width: '48%',
          height: moderateScale(150),
          borderRadius: moderateScale(8),
          // backgroundColor: colors.backgroundGray,
          overflow: 'hidden',
        },
        documentImagesContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: moderateScale(8),
          gap: moderateScale(12),
        },
        documentImage: {
          flex: 1,
          height: moderateScale(150),
          borderRadius: moderateScale(8),
          alignItems: 'center',
          justifyContent: 'center',
        },
        tractorImagesContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginTop: moderateScale(12),
          gap: moderateScale(8),
        },
        tractorImageThumbnail: {
          width: moderateScale(100),
          height: moderateScale(100),
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          marginBottom: moderateScale(8),
        },
        placeholderImage: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        placeholderText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
          textAlign: 'center',
        },
      }),
    [moderateScale, insets.top],
  );

  // Skeleton content component
  const renderSkeletonContent = () => {
    return (
      <SkeletonPlaceholder
        backgroundColor={colors.backgroundGray}
        highlightColor={colors.backgroundWhite}
        borderRadius={moderateScale(10)}>
        {/* Profile Card Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          padding={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          {/* Profile Header Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            alignItems="center"
            marginBottom={moderateScale(20)}>
            {/* Profile Image Skeleton */}
            <SkeletonPlaceholder.Item
              width={moderateScale(60)}
              height={moderateScale(60)}
              borderRadius={moderateScale(30)}
              marginRight={moderateScale(16)}
            />
            {/* Profile Info Skeleton */}
            <SkeletonPlaceholder.Item flex={1}>
              <SkeletonPlaceholder.Item
                width="70%"
                height={moderateScale(18)}
                borderRadius={moderateScale(4)}
                marginBottom={moderateScale(8)}
              />
              <SkeletonPlaceholder.Item
                width="50%"
                height={moderateScale(14)}
                borderRadius={moderateScale(4)}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>

          {/* Info Rows Skeleton */}
          {[1, 2, 3, 4, 5, 6, 7].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              justifyContent="space-between"
              marginBottom={moderateScale(12)}>
              <SkeletonPlaceholder.Item
                width="40%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
              />
              <SkeletonPlaceholder.Item
                width="50%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
              />
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder.Item>

        {/* Tractor Card Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          padding={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          {/* Tractor Header Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            justifyContent="space-between"
            marginBottom={moderateScale(16)}>
            <SkeletonPlaceholder.Item
              width="40%"
              height={moderateScale(18)}
              borderRadius={moderateScale(4)}
            />
            <SkeletonPlaceholder.Item
              width="30%"
              height={moderateScale(14)}
              borderRadius={moderateScale(4)}
            />
          </SkeletonPlaceholder.Item>

          {/* Tractor Image Skeleton */}
          <SkeletonPlaceholder.Item
            width="100%"
            height={moderateScale(200)}
            borderRadius={moderateScale(8)}
            marginBottom={moderateScale(16)}
          />

          {/* RC Images Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            justifyContent="space-around"
            marginBottom={moderateScale(16)}>
            <SkeletonPlaceholder.Item
              width={moderateScale(140)}
              height={moderateScale(70)}
              borderRadius={moderateScale(8)}
            />
            <SkeletonPlaceholder.Item
              width={moderateScale(140)}
              height={moderateScale(70)}
              borderRadius={moderateScale(8)}
            />
          </SkeletonPlaceholder.Item>

          {/* Tractor Info Rows Skeleton */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              justifyContent="space-between"
              marginBottom={moderateScale(12)}>
              <SkeletonPlaceholder.Item
                width="40%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
              />
              <SkeletonPlaceholder.Item
                width="50%"
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
              if (params?.fromScreen === "Home") {
                tabNavigation.navigate(SCREEN_NAMES.Home);
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={moderateScale(20)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>{t("farmer.details")}</Text>
        </View>
        {farmerDetails?.verificationStatus == 1 && (
          <TouchableOpacity
            style={dynamicStyles.editButton}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to AddFarmerScreen in edit mode
              const farmerId =params?.farmerId || params?.farmer_id ;
              if (farmerId) {
                navigation.navigate(
                  SCREEN_NAMES.AddFarmer as never,
                  {
                    farmerId: farmerId,
                    editMode: true,
                  } as never
                );
              }
            }}
          >
            <Text style={dynamicStyles.editButtonText}>{t('common.edit')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Scrollable Content */}
      {loading && !refreshing ? (
        renderSkeleton()
      ) : farmerDetails ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {refreshing ? (
            renderSkeletonContent()
          ) : (
            <>
              {/* User Details Card */}
              <View style={dynamicStyles.card}>
                <View style={dynamicStyles.profileHeader}>
                  <View style={dynamicStyles.profileImageContainer}>
                    {farmerDetails.profileImage ? (
                      <Image
                        source={{ uri: farmerDetails.profileImage }}
                        style={dynamicStyles.profileImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={dynamicStyles.profileImage}>
                        <Text style={dynamicStyles.profileImageText}>
                          {params?.farmerInitials ||
                            (farmerDetails.firstName?.[0] || "") +
                              (farmerDetails.lastName?.[0] || "") ||
                            "DW"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={dynamicStyles.profileInfo}>
                    <Text style={dynamicStyles.profileName}>
                      {params?.farmerName || farmerDetails.fullName || ""}
                    </Text>
                    <Text style={dynamicStyles.profilePhone}>
                      {farmerDetails.mobile || ""}
                    </Text>
                  </View>
                </View>

                <InfoRow
                  label={t("farmerProfile.firstName")}
                  value={farmerDetails.firstName}
                  moderateScale={moderateScale}
                />
                <InfoRow
                  label={t("farmerProfile.middleName")}
                  value={farmerDetails.middleName}
                  moderateScale={moderateScale}
                />
                <InfoRow
                  label={t("farmerProfile.lastName")}
                  value={farmerDetails.lastName}
                  moderateScale={moderateScale}
                />
                {/* <InfoRow
                  label={t("farmerProfile.mobileNo")}
                  value={farmerDetails.mobile}
                  moderateScale={moderateScale}
                /> */}
                <InfoRow
                  label={t("farmerProfile.dateOfBirth")}
                  value={farmerDetails.dateOfBirth}
                  moderateScale={moderateScale}
                />
                <InfoRow
                  label={t("farmerProfile.dateOfMarriage")}
                  value={farmerDetails.dateOfMarriage}
                  moderateScale={moderateScale}
                />
                {/* Address Section - Display below title */}
                <View
                  style={{
                    paddingVertical: moderateScale(12),
                    borderBottomWidth: 0,
                  }}
                >
                  <Text
                    style={[
                      Typography.regularMd,
                      {
                        fontSize: moderateScale(14),
                        color: colors.textTertiary,
                        marginBottom: moderateScale(8),
                      },
                    ]}
                  >
                    {t("farmerProfile.farmerAddress")}
                  </Text>
                  <Text
                    style={[
                      Typography.regularMd,
                      {
                        fontSize: moderateScale(14),
                        color: colors.textPrimary,
                        lineHeight: moderateScale(20),
                      },
                    ]}
                    numberOfLines={0}
                  >
                    {farmerDetails?.addressData || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Tractor Details Card */}
              <View style={dynamicStyles.card}>
                <View style={dynamicStyles.tractorHeader}>
                  <Text style={dynamicStyles.tractorTitle}>
                    {t("farmerProfile.tractorDetails")}
                  </Text>
                  <Text style={dynamicStyles.tractorCount}>
                    {t("farmerProfile.tractorCount")}:{" "}
                    {farmerDetails.tractors.length}
                  </Text>
                </View>

                {farmerDetails.tractors.map((tractor: any, index: number) => {
                  // Get RC images using rcImagesFront and rcImagesBack
                  const rcImageFront = tractor.rcImagesFront || null;
                  const rcImageBack = tractor.rcImagesBack || null;

                  // Get tractor images array (multiple images)
                  const tractorImages = tractor.tractorImages || [];
                  const hasTractorImages = tractorImages.length > 0;

                  // Calculate image index for preview modal
                  const getImageIndex = (
                    imageType:
                      | "tractor"
                      | "tractorImage"
                      | "rcFront"
                      | "rcBack",
                    imageIndex?: number
                  ) => {
                    let imgIndex = 0;

                    if (
                      imageType === "tractor" ||
                      imageType === "tractorImage"
                    ) {
                      // First images are tractor images
                      if (imageIndex !== undefined) {
                        imgIndex = imageIndex;
                      } else {
                        imgIndex = 0; // Default to first tractor image
                      }
                    } else if (imageType === "rcFront" && rcImageFront) {
                      // RC front comes after all tractor images
                      imgIndex = tractorImages.length;
                    } else if (imageType === "rcBack" && rcImageBack) {
                      // RC back comes after tractor images and RC front
                      imgIndex = tractorImages.length + (rcImageFront ? 1 : 0);
                    }
                    return imgIndex;
                  };

                  return (
                    <View key={tractor.id || tractor.tractorId || index}>
                      {/* Tractor Images - Show in row if 2 images, full width if 1, thumbnails if more than 2 */}
                      <View style={dynamicStyles.tractorImageContainer}>
                        {hasTractorImages ? (
                          // Multiple images from tractorImages array
                          tractorImages.length === 1 ? (
                            // Single image - full width
                            <TouchableOpacity
                              style={dynamicStyles.tractorMainImage}
                              onPress={() => {
                                setSelectedTractorIndex(index);
                                setSelectedImageIndex(
                                  getImageIndex("tractorImage", 0)
                                );
                                setPreviewModalVisible(true);
                              }}
                              activeOpacity={0.7}
                            >
                              <Image
                                source={{ uri: tractorImages[0] }}
                                style={dynamicStyles.tractorMainImage}
                                resizeMode="contain"
                              />
                            </TouchableOpacity>
                          ) : tractorImages.length === 2 ? (
                            // Two images - show side by side in a row
                            <View style={dynamicStyles.tractorImagesRow}>
                              <TouchableOpacity
                                style={dynamicStyles.tractorImageHalf}
                                onPress={() => {
                                  setSelectedTractorIndex(index);
                                  setSelectedImageIndex(
                                    getImageIndex("tractorImage", 0)
                                  );
                                  setPreviewModalVisible(true);
                                }}
                                activeOpacity={0.7}
                              >
                                <Image
                                  source={{ uri: tractorImages[0] }}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: moderateScale(8),
                                  }}
                                  resizeMode="contain"
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={dynamicStyles.tractorImageHalf}
                                onPress={() => {
                                  setSelectedTractorIndex(index);
                                  setSelectedImageIndex(
                                    getImageIndex("tractorImage", 1)
                                  );
                                  setPreviewModalVisible(true);
                                }}
                                activeOpacity={0.7}
                              >
                                <Image
                                  source={{ uri: tractorImages[1] }}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: moderateScale(8),
                                  }}
                                  resizeMode="contain"
                                />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            // More than 2 images - first full width, then thumbnails
                            <>
                              <TouchableOpacity
                                style={dynamicStyles.tractorMainImage}
                                onPress={() => {
                                  setSelectedTractorIndex(index);
                                  setSelectedImageIndex(
                                    getImageIndex("tractorImage", 0)
                                  );
                                  setPreviewModalVisible(true);
                                }}
                                activeOpacity={0.7}
                              >
                                <Image
                                  source={{ uri: tractorImages[0] }}
                                  style={dynamicStyles.tractorMainImage}
                                  resizeMode="contain"
                                />
                              </TouchableOpacity>
                              <View
                                style={dynamicStyles.tractorImagesContainer}
                              >
                                {tractorImages
                                  .slice(1)
                                  .map((imageUri: string, imgIndex: number) => (
                                    <TouchableOpacity
                                      key={`tractor-thumb-${imgIndex + 1}`}
                                      style={
                                        dynamicStyles.tractorImageThumbnail
                                      }
                                      onPress={() => {
                                        setSelectedTractorIndex(index);
                                        setSelectedImageIndex(
                                          getImageIndex(
                                            "tractorImage",
                                            imgIndex + 1
                                          )
                                        );
                                        setPreviewModalVisible(true);
                                      }}
                                      activeOpacity={0.7}
                                    >
                                      <Image
                                        source={{ uri: imageUri }}
                                        style={
                                          dynamicStyles.tractorImageThumbnail
                                        }
                                        resizeMode="contain"
                                      />
                                    </TouchableOpacity>
                                  ))}
                              </View>
                            </>
                          )
                        ) : tractor.tractorImage ? (
                          // Fallback to single tractorImage
                          <TouchableOpacity
                            style={dynamicStyles.tractorMainImage}
                            onPress={() => {
                              setSelectedTractorIndex(index);
                              setSelectedImageIndex(
                                getImageIndex("tractorImage", 0)
                              );
                              setPreviewModalVisible(true);
                            }}
                            activeOpacity={0.7}
                          >
                            <Image
                              source={{ uri: tractor.tractorImage }}
                              style={dynamicStyles.tractorMainImage}
                              resizeMode="contain"
                            />
                          </TouchableOpacity>
                        ) : (
                          // No image found
                          <View style={dynamicStyles.tractorMainImage}>
                            <View style={dynamicStyles.placeholderImage}>
                              <Text style={dynamicStyles.placeholderText}>
                                {t("farmerProfile.noImageFound")}
                              </Text>
                            </View>
                          </View>
                        )}

                        {/* RC Book Images */}
                        {/* <View style={dynamicStyles.documentImagesContainer}>
                          <TouchableOpacity
                            style={dynamicStyles.documentImage}
                            onPress={() => {
                              if (rcImageFront) {
                                setSelectedTractorIndex(index);
                                setSelectedImageIndex(
                                  getImageIndex("rcFront", undefined)
                                );
                                setPreviewModalVisible(true);
                              }
                            }}
                            activeOpacity={rcImageFront ? 0.7 : 1}
                          >
                            {rcImageFront ? (
                              <Image
                                source={{ uri: rcImageFront }}
                                style={{
                                  width: "100%",
                                  height: moderateScale(150),
                                  borderRadius: moderateScale(8),
                                }}
                                resizeMode="contain"
                              />
                            ) : (
                              <View style={dynamicStyles.placeholderImage}>
                                <Text
                                  style={[
                                    dynamicStyles.placeholderText,
                                    { fontSize: moderateScale(10) },
                                  ]}
                                >
                                  {t("farmerProfile.noImageFound")}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={dynamicStyles.documentImage}
                            onPress={() => {
                              if (rcImageBack) {
                                setSelectedTractorIndex(index);
                                setSelectedImageIndex(
                                  getImageIndex("rcBack", undefined)
                                );
                                setPreviewModalVisible(true);
                              }
                            }}
                            activeOpacity={rcImageBack ? 0.7 : 1}
                          >
                            {rcImageBack ? (
                              <Image
                                source={{ uri: rcImageBack }}
                                style={{
                                  width: "100%",
                                  height: moderateScale(150),
                                  borderRadius: moderateScale(8),
                                }}
                                resizeMode="contain"
                              />
                            ) : (
                              <View style={dynamicStyles.placeholderImage}>
                                <Text
                                  style={[
                                    dynamicStyles.placeholderText,
                                    { fontSize: moderateScale(10) },
                                  ]}
                                >
                                  {t("farmerProfile.noImageFound")}
                                </Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View> */}
                      </View>

                      {/* Tractor Specifications */}
                      <InfoRow
                        label={t("farmerProfile.modelName")}
                        value={tractor.model}
                        moderateScale={moderateScale}
                      />
                      <InfoRow
                        label={t("farmerProfile.vehicleNo")}
                        value={tractor.vehicleNo}
                        moderateScale={moderateScale}
                      />
                      <InfoRow
                        label={t("farmerProfile.ownerName")}
                        value={tractor.ownername}
                        moderateScale={moderateScale}
                      />
                       <InfoRow
                        label={t("farmerProfile.chassisNo")}
                        value={tractor.chassisNo}
                        moderateScale={moderateScale}
                      />
                      <InfoRow
                        label={t("farmerProfile.engineNo")}
                        value={tractor.engineNo}
                        moderateScale={moderateScale}
                      />
                      {/* <InfoRow
                        label={t("farmerProfile.mobileNo")}
                        value={
                          tractor.mobile ? tractor.mobile : farmerDetails.mobile
                        }
                        moderateScale={moderateScale}
                      /> */}
                      <InfoRow
                        label={t("farmerProfile.dateOfRegistration")}
                        value={tractor.dateOfInvoice}
                        moderateScale={moderateScale}
                      />
                      <InfoRow
                        label={t("farmerProfile.whoDrives")}
                        value={tractor.whoDrives}
                        moderateScale={moderateScale}
                        isShowBorderBottom={
                          index !== farmerDetails.tractors.length - 1
                        }
                      />
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: moderateScale(20),
          }}
        >
          <Text style={[Typography.regularMd, { color: colors.textSecondary }]}>
            {t("farmer.noDetailsFound")}
          </Text>
        </View>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={previewModalVisible}
        images={previewImages}
        initialIndex={selectedImageIndex}
        onClose={handleCloseModal}
      />
    </View>
  );
}

