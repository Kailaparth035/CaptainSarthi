import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {ImagePath} from '../assets/images';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {getData, postDataWithImage} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {pickAndCropImageFromCamera, pickAndCropImageFromGallery} from '../utils/imageCropUtils';
import ImagePickerModal from '../components/ImagePickerModal';
import Toast, {ToastType} from '../components/Toast';

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

// Info Row Component
const InfoRow = ({
  label,
  value,
  moderateScale,
  isShowBorderBottom = true,
  isColumn = false,
}: {
  label: string;
  value: string;
  moderateScale: (size: number, factor?: number) => number;
  isShowBorderBottom?: boolean;
  isColumn?: boolean;
}) => {
  if (isColumn) {
    return (
      <View
        style={{
          paddingVertical: moderateScale(12),
          borderBottomWidth: isShowBorderBottom ? 1 : 0,
          borderBottomColor: colors.borderLight,
        }}>
        <Text
          style={[
            Typography.regularMd,
            {
              fontSize: moderateScale(14),
              color: colors.textTertiary,
              marginBottom: moderateScale(8),
            },
          ]}>
          {label}:
        </Text>
        <Text
          style={[
            Typography.regularMd,
            {
              fontSize: moderateScale(14),
              color: colors.textPrimary,
              textAlign: 'left',
            },
          ]}>
          {value}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(12),
        borderBottomWidth: isShowBorderBottom ? 1 : 0,
        borderBottomColor: colors.borderLight,
      }}>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textTertiary,
            flex: 0.35,
          },
        ]}>
        {label}:
      </Text>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textPrimary,
            flex: 0.65,
            textAlign: 'right',
          },
        ]}>
        {value}
      </Text>
    </View>
  );
};

export default function FarmerProfileDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [profileDetails, setProfileDetails] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: '',
    mobile: '',
    dateOfBirth: '',
    dateOfMarriage: '',
    dealershipName: '',
    dealershipAddress: '',
    profileImage: null as string | null,
    tractors: [] as Array<{
      id: string;
      model: string;
      vehicleNo: string;
      ownerName: string;
      chassisNo: string;
      engineNo: string;
      mobile: string;
      dateOfInvoice: string;
      dateOfRegistration: string;
      whoDrives: string;
      tractorImage: string | null;
    }>,
  });

  // Fetch farmer profile data from API
  const fetchFarmerProfile = React.useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('[FarmerProfileDetailsScreen] Fetching farmer profile data');
      const response = await getData(Apis.FARMER_PROFILE, {});
      
      console.log('[FarmerProfileDetailsScreen] Profile API response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        const data = response.data;
        const personalDetails = data.personal_details || {};
        const dealershipDetails = data.dealership_details || {};
        const tractorDetails = data.tractor_details || {};
        
        // Profile photo
        let profileImage: string | null = null;
        if (personalDetails.profile_photo_url) {
          const imageUrl = getImageUrl(personalDetails.profile_photo_url);
          if (imageUrl) {
            profileImage = imageUrl;
          }
        }
        
        // Build full name
        const firstName = personalDetails.first_name || '';
        const middleName = personalDetails.middle_name || '';
        const lastName = personalDetails.last_name || '';
        const fullNameParts = [firstName, middleName, lastName].filter(Boolean);
        const fullName = fullNameParts.join(' ') || '';
        
        // Mobile number
        const mobile = personalDetails.mobile_no ? `+91 ${personalDetails.mobile_no}` : '';
        
        // Date of Birth
        const dateOfBirth = personalDetails.date_of_birth 
          ? formatDate(personalDetails.date_of_birth)
          : '';
        
        // Date of Marriage
        const dateOfMarriage = personalDetails.date_of_marriage 
          ? formatDate(personalDetails.date_of_marriage)
          : '';
        
        // Dealership details
        const dealershipName = dealershipDetails.dealership_name || '';
        const dealershipAddress = dealershipDetails.dealership_address || '';
        
        // Tractor details - map tractor_list to tractors array
        const tractors: Array<{
          id: string;
          model: string;
          vehicleNo: string;
          ownerName: string;
          chassisNo: string;
          engineNo: string;
          mobile: string;
          dateOfInvoice: string;
          dateOfRegistration: string;
          whoDrives: string;
          tractorImage: string | null;
        }> = [];
        if (tractorDetails.tractor_list && Array.isArray(tractorDetails.tractor_list)) {
          tractorDetails.tractor_list.forEach((tractor: any, index: number) => {
            let tractorImage: string | null = null;
            if (tractor.tractor_image_url) {
              const imageUrl = getImageUrl(tractor.tractor_image_url);
              if (imageUrl) {
                tractorImage = imageUrl;
              }
            }
            
            // Use display_invoice_date if available, otherwise use date_of_invoice
            const dateOfInvoice = tractor.display_invoice_date 
              ? formatDate(tractor.display_invoice_date)
              : tractor.date_of_invoice 
              ? formatDate(tractor.date_of_invoice)
              : '';
            
            // Use display_registration_date if available, otherwise use date_of_registration
            const dateOfRegistration = tractor.display_registration_date 
              ? formatDate(tractor.display_registration_date)
              : tractor.date_of_registration 
              ? formatDate(tractor.date_of_registration)
              : '';
            
            tractors.push({
              id: tractor.tractor_id || String(index + 1),
              model: tractor.model_name || '',
              vehicleNo: tractor.vehicle_no || '',
              ownerName: tractor.owner_name || '',
              chassisNo: tractor.chassis_no || '',
              engineNo: tractor.engine_no || '',
              mobile: tractor.mobile_no ? `+91 ${tractor.mobile_no}` : '',
              dateOfInvoice: dateOfInvoice,
              dateOfRegistration: dateOfRegistration,
              whoDrives: tractor.who_drives || '',
              tractorImage: tractorImage,
            });
          });
        }
        
        setProfileDetails({
          firstName,
          middleName,
          lastName,
          fullName,
          mobile,
          dateOfBirth,
          dateOfMarriage,
          dealershipName,
          dealershipAddress,
          profileImage,
          tractors,
        });
      } else {
        console.warn('[FarmerProfileDetailsScreen] Unexpected API response format:', response);
      }
    } catch (error) {
      console.error('[FarmerProfileDetailsScreen] Error fetching farmer profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    fetchFarmerProfile();
  }, [fetchFarmerProfile]);

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchFarmerProfile(true);
  }, [fetchFarmerProfile]);

  // Toast handlers
  const showToastMessage = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  // Validate image format
  const isValidImageFormat = (fileExtension: string): boolean => {
    const validFormats = ['jpg', 'jpeg', 'png'];
    return validFormats.includes(fileExtension.toLowerCase());
  };

  // Handle image upload
  const handleImageUpload = async (imageUri: string | null) => {
    if (!imageUri) return;

    try {
      setUploading(true);
      
      // Extract file extension from URI or default to jpeg
      const uriParts = imageUri.split('.');
      const fileExtension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
      
      // Validate image format
      if (!isValidImageFormat(fileExtension)) {
        showToastMessage('Only upload JPG, PNG, JPEG image formats', 'error');
        setUploading(false);
        return;
      }
      
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      const fileName = `profile-image-${Date.now()}.${fileExtension}`;
      
      // Create FormData
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: mimeType,
        name: fileName,
      } as any);

      console.log('[FarmerProfileDetailsScreen] Uploading profile image:', fileName);
      
      // Upload image
      const response = await postDataWithImage(Apis.FARMER_PROFILE_IMAGE, formData);
      
      if (response?.status === true) {
        // Show success message
        showToastMessage(response?.message || 'Profile image updated successfully', 'success');
        
        // Refresh profile details to get updated image
        await fetchFarmerProfile(false);
      } else {
        showToastMessage(response?.message || 'Failed to upload profile image', 'error');
      }
    } catch (error) {
      console.error('[FarmerProfileDetailsScreen] Error uploading profile image:', error);
      showToastMessage('Failed to upload profile image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Handle camera press
  const handleCameraPress = async () => {
    try {
      console.log('[FarmerProfileDetailsScreen] Opening camera with crop...');
      const imageUri = await pickAndCropImageFromCamera({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        freeStyleCropEnabled: false,
      });
      console.log('[FarmerProfileDetailsScreen] Camera result:', imageUri);
      if (imageUri) {
        await handleImageUpload(imageUri);
      }
    } catch (error: any) {
      console.error('[FarmerProfileDetailsScreen] Error in handleCameraPress:', error);
      // Don't show error if user cancelled
      if (error?.message !== 'User cancelled image selection' && !error?.message?.includes('User cancelled')) {
        showToastMessage('Failed to open camera. Please try again.', 'error');
      }
    }
  };

  // Handle gallery press
  const handleGalleryPress = async () => {
    try {
      console.log('[FarmerProfileDetailsScreen] Opening gallery with crop...');
      const imageUri = await pickAndCropImageFromGallery({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        freeStyleCropEnabled: false,
      });
      console.log('[FarmerProfileDetailsScreen] Gallery result:', imageUri);
      if (imageUri) {
        await handleImageUpload(imageUri);
      }
    } catch (error: any) {
      console.error('[FarmerProfileDetailsScreen] Error in handleGalleryPress:', error);
      // Don't show error if user cancelled
      if (error?.message !== 'User cancelled image selection' && !error?.message?.includes('User cancelled')) {
        showToastMessage('Failed to open gallery. Please try again.', 'error');
      }
    }
  };

  // Handle profile image press
  const handleProfileImagePress = () => {
    setImagePickerVisible(true);
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
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
          marginBottom: moderateScale(7),
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
          borderRadius: moderateScale(30),
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
          borderRadius: moderateScale(11),
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
          alignItems: 'center',
          marginVertical: moderateScale(16),
        },
        tractorMainImage: {
          width: '100%',
          height: moderateScale(200),
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          marginBottom: moderateScale(12),
        },
      }),
    [moderateScale, insets.top],
  );

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
          {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              justifyContent="space-between"
              marginBottom={moderateScale(12)}>
              <SkeletonPlaceholder.Item
                width="35%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
              />
              <SkeletonPlaceholder.Item
                width="55%"
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

          {/* Tractor Info Rows Skeleton */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              justifyContent="space-between"
              marginBottom={moderateScale(12)}>
              <SkeletonPlaceholder.Item
                width="35%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
              />
              <SkeletonPlaceholder.Item
                width="55%"
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
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>{t('profile.title')}</Text>
      </View>

      {/* Scrollable Content */}
      {loading && !refreshing ? (
        renderSkeleton()
      ) : (
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
              {/* User Profile Section */}
        <View style={dynamicStyles.card}>
          {/* Profile Header */}
          <View style={dynamicStyles.profileHeader}>
            <View style={dynamicStyles.profileImageContainer}>
              {uploading ? (
                <View style={dynamicStyles.profileImage}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                </View>
              ) : profileDetails.profileImage ? (
                <Image
                  source={{uri: profileDetails.profileImage}}
                  style={dynamicStyles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={dynamicStyles.profileImage}>
                  <Text style={dynamicStyles.profileImageText}>
                    {getInitials(profileDetails.fullName)}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={dynamicStyles.cameraIconContainer}
                onPress={handleProfileImagePress}
                activeOpacity={0.7}
                disabled={uploading}>
                <Ionicons
                  name="camera"
                  size={moderateScale(14)}
                  color={colors.textWhite}
                />
              </TouchableOpacity>
            </View>
            <View style={dynamicStyles.profileInfo}>
              <Text style={dynamicStyles.profileName}>
                {profileDetails.fullName}
              </Text>
              <Text style={dynamicStyles.profilePhone}>
                {profileDetails.mobile}
              </Text>
            </View>
          </View>

          {/* Personal Details */}
          <InfoRow
            label={t('farmerProfile.firstName')}
            value={profileDetails.firstName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.middleName')}
            value={profileDetails.middleName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.lastName')}
            value={profileDetails.lastName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.mobileNo')}
            value={profileDetails.mobile}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.dateOfBirth')}
            value={profileDetails.dateOfBirth}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.dateOfMarriage')}
            value={profileDetails.dateOfMarriage}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.dealershipName')}
            value={profileDetails.dealershipName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.dealershipAddress')}
            value={profileDetails.dealershipAddress}
            moderateScale={moderateScale}
            isShowBorderBottom={false}
            isColumn={true}
          />
        </View>

        {/* Tractor Details Section */}
        {profileDetails.tractors.map((tractor, index) => (
          <View key={tractor.id} style={dynamicStyles.card}>
            <View style={dynamicStyles.tractorHeader}>
              <Text style={dynamicStyles.tractorTitle}>{t('farmerProfile.tractorDetails')}</Text>
              <Text style={dynamicStyles.tractorCount}>
                {t('farmerProfile.tractorCount')}: {index + 1} of {profileDetails.tractors.length}
              </Text>
            </View>

            {/* Tractor Image */}
            <View style={dynamicStyles.tractorImageContainer}>
              <View style={dynamicStyles.tractorMainImage}>
                {tractor.tractorImage ? (
                  <Image
                    source={{uri: tractor.tractorImage}}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: moderateScale(8),
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={ImagePath.tractor}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: moderateScale(8),
                    }}
                    resizeMode="cover"
                  />
                )}
              </View>
            </View>

            {/* Tractor Specifications */}
            <InfoRow
              label={t('farmerProfile.modelName')}
              value={tractor.model}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.vehicleNo')}
              value={tractor.vehicleNo}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.ownerName')}
              value={tractor.ownerName}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.chassisNo')}
              value={tractor.chassisNo}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.engineNo')}
              value={tractor.engineNo}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.mobileNo')}
              value={tractor.mobile}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.dateOfInvoice')}
              value={tractor.dateOfInvoice}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.dateOfRegistration')}
              value={tractor.dateOfRegistration}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.whoDrives')}
              value={tractor.whoDrives}
              moderateScale={moderateScale}
              isShowBorderBottom={false}
            />
          </View>
        ))}
            </>
          )}
        </ScrollView>
      )}

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
      />

      {/* Toast */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={hideToast}
      />
    </View>
  );
}

