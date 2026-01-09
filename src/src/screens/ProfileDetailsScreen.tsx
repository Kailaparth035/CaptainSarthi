import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {getData, postDataWithImage} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {useImagePicker} from '../hooks/useImagePicker';
import {pickAndCropImageFromCamera, pickAndCropImageFromGallery} from '../utils/imageCropUtils';
import ImagePickerModal from '../components/ImagePickerModal';
import Toast, {ToastType} from '../components/Toast';

// Mock data for profile details - matching the image
const getProfileDetails = () => {
  return {
    name: 'Jason statham',
    dealerId: 'DLR0001',
    dealerName: 'Jason statham',
    firmName: 'J.P enterprise',
    email: 'owner@jpenterprise.com',
    mobile: '+91 54852 26478',
    dateOfMarriage: '3 Nov 2015',
    address: {
      houseNumber: '140/C Goodluck society',
      streetName: 'Nr town hall, old high court road',
      landmark: 'R.J tibrewal college',
      village: 'Anand',
      district: 'Ahmedabad',
      state: 'Gujarat',
      pinCode: '380008',
    },
  };
};

// Info Row Component
const InfoRow = ({
  label,
  value,
  moderateScale,
  isShowBorderBottom = true,
}: {
  label: string;
  value: string;
  moderateScale: (size: number, factor?: number) => number;
  isShowBorderBottom?: boolean;
}) => {
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
            flex: 0.45,
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
            flex: 0.55,
            textAlign: 'right',
          },
        ]}>
        {value}
      </Text>
    </View>
  );
};

export default function ProfileDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const navigation = useNavigation();
  const [profileDetails, setProfileDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const {pickImage, isPicking} = useImagePicker();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [refreshing, setRefreshing] = useState(false);


  // Fetch profile details from API
  const fetchProfileDetails = async (showLoading = true, showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else if (showLoading) {
          setLoading(true);
        }
        const response = await getData(Apis.DEALER_PROFILE, {});
        
        // Handle API response structure: { status: true, data: {...} }
        if (response?.status === true && response?.data) {
          const profileData = response.data;
          
          // Transform API response to match component format
          // Parse address if it's a string, otherwise use as is
          let addressObj = {
            houseNumber: '',
            streetName: '',
            landmark: '',
            village: '',
            district: '',
            state: '',
            pinCode: '',
          };
          
          if (profileData) {
            // if (typeof profileData === 'string') {
            //   // If address is a string, try to parse it or use as is
            //   addressObj.houseNumber = profileData;
            // } else 
              if (typeof profileData === 'object') {
              // If address is an object, map its properties
              console.log('Profile address object:', profileData);
              
              addressObj = {
                houseNumber: profileData.house_number || profileData.houseNumber || profileData.address?.house_number || '',
                streetName: profileData.street_name || profileData.streetName || '',
                landmark: profileData.landmark || '',
                village: profileData.village_data?.name || profileData.village || '',
                district: profileData.district_data?.name || profileData.district || '',
                state: profileData.state_data?.name || profileData.state || '',
                pinCode: profileData.pincode || '',
              };
            }
          }
          
          // Get names from nested data objects (state_data, district_data, village_data)
          const stateName = profileData.state_data?.name || profileData.state_name || `State ${profileData.state || ''}`;
          const districtName = profileData.district_data?.name || profileData.district_name || `District ${profileData.district || ''}`;
          const villageName = profileData.village_data?.name || profileData.village_name || profileData.city_name || `Village ${profileData.village || ''}`;
          
          // Get profile image URL
          const profileImageUrl = profileData.profile_image 
            ? getImageUrl(profileData.profile_image) 
            : null;

          setProfileDetails({
            id: profileData.id?.toString() || '',
            name: profileData.name || '',
            dealerId: profileData.dealer_id || '',
            dealerName: profileData.name || '', // Using name as dealerName
            firmName: profileData.firm_name || profileData.firmName || 'N/A',
            email: profileData.email || '',
            mobile: profileData.phone || '',
            dateOfMarriage: profileData.date_of_marriage || profileData.dateOfMarriage || 'N/A',
            profileImage: profileImageUrl,
            address: {
              houseNumber: addressObj.houseNumber || 'N/A',
              streetName: addressObj.streetName || 'N/A',
              landmark: addressObj.landmark || 'N/A',
              village: villageName,
              district: districtName,
              state: stateName,
              pinCode: addressObj.pinCode || 'N/A',
            },
            // Additional fields from API
            city: profileData.city || '',
            state: profileData.state || '',
            country: profileData.country || '',
          });
        } else {
          console.warn('Unexpected API response format:', response);
          // Fallback to mock data if API fails
          setProfileDetails(getProfileDetails());
        }
      } catch (error) {
        console.error('Error fetching profile details:', error);
        // Fallback to mock data on error
        setProfileDetails(getProfileDetails());
      } finally {
        if (showLoading) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    };

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchProfileDetails(false, true);
  }, []);

  // Fetch data on mount and whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[ProfileDetailsScreen] Screen focused - fetching latest profile details');
      fetchProfileDetails();
    }, [])
  );

  // Show toast message helper
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

      console.log('Uploading profile image:', fileName);
      
      // Upload image
      const response = await postDataWithImage(Apis.DEALER_PROFILE_IMAGE, formData);
      
      if (response?.status === true) {
        // Show success message
        showToastMessage(response?.message || 'Profile image updated successfully', 'success');
        
        // Refresh profile details to get updated image (without showing loading)
        await fetchProfileDetails(false);
      } else {
        showToastMessage(response?.message || 'Failed to upload profile image', 'error');
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      showToastMessage('Failed to upload profile image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Handle camera press
  const handleCameraPress = async () => {
    try {
      console.log('Opening camera with crop...');
      const imageUri = await pickAndCropImageFromCamera({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        freeStyleCropEnabled: false,
      });
      console.log('Camera result:', imageUri);
      if (imageUri) {
        await handleImageUpload(imageUri);
      }
    } catch (error: any) {
      console.error('Error in handleCameraPress:', error);
      // Don't show error if user cancelled
      if (error?.message !== 'User cancelled image selection') {
        showToastMessage('Failed to open camera. Please try again.', 'error');
      }
    }
  };

  // Handle gallery press
  const handleGalleryPress = async () => {
    try {
      console.log('Opening gallery with crop...');
      const imageUri = await pickAndCropImageFromGallery({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        freeStyleCropEnabled: false,
      });
      console.log('Gallery result:', imageUri);
      if (imageUri) {
        await handleImageUpload(imageUri);
      }
    } catch (error: any) {
      console.error('Error in handleGalleryPress:', error);
      // Don't show error if user cancelled
      if (error?.message !== 'User cancelled image selection') {
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
          paddingTop: moderateScale(16),
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
          overflow: 'hidden',
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
        profileId: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
        cardTitle: {
          ...Typography.boldXl,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
          marginBottom: moderateScale(16),
        },
      }),
    [moderateScale, insets.top],
  );

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return 'NA';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
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
        {/* Profile Information Card Skeleton */}
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
          {[1, 2, 3, 4, 5].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              justifyContent="space-between"
              marginBottom={moderateScale(12)}>
              <SkeletonPlaceholder.Item
                width="45%"
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

        {/* Address Card Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          padding={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          {/* Card Title Skeleton */}
          <SkeletonPlaceholder.Item
            width="50%"
            height={moderateScale(18)}
            borderRadius={moderateScale(4)}
            marginBottom={moderateScale(16)}
          />

          {/* Address Info Rows Skeleton */}
          {[1, 2, 3, 4, 5, 6, 7].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              justifyContent="space-between"
              marginBottom={moderateScale(12)}>
              <SkeletonPlaceholder.Item
                width="45%"
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

  if (loading || !profileDetails) {
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
            {/* Profile Information Card */}
        <View style={dynamicStyles.card}>
          {/* Profile Header */}
          <View style={dynamicStyles.profileHeader}>
            <TouchableOpacity
              style={dynamicStyles.profileImageContainer}
              onPress={handleProfileImagePress}
              activeOpacity={0.7}
              disabled={uploading || isPicking}>
              {profileDetails.profileImage ? (
                <Image
                  source={{uri: profileDetails.profileImage}}
                  style={dynamicStyles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={dynamicStyles.profileImage}>
                  <Text style={dynamicStyles.profileImageText}>
                    {getInitials(profileDetails.name)}
                  </Text>
                </View>
              )}
              <View style={dynamicStyles.cameraIconContainer}>
                {uploading || isPicking ? (
                  <ActivityIndicator size="small" color={colors.textWhite} />
                ) : (
                  <Ionicons
                    name="camera"
                    size={moderateScale(14)}
                    color={colors.textWhite}
                  />
                )}
              </View>
            </TouchableOpacity>
            <View style={dynamicStyles.profileInfo}>
              <Text style={dynamicStyles.profileName}>
                {profileDetails.name}
              </Text>
              <Text style={dynamicStyles.profileId}>
                {profileDetails.dealerId}
              </Text>
            </View>
          </View>

          {/* Personal Information */}
          <InfoRow
            label={t('profile.dealerName')}
            value={profileDetails.dealerName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.dealerId')}
            value={profileDetails.dealerId}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.nameOfFirm')}
            value={profileDetails.firmName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.email')}
            value={profileDetails.email}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.mobileNo')}
            value={profileDetails.mobile}
            moderateScale={moderateScale}
            isShowBorderBottom={false}
          />
        </View>

        {/* Address Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.cardTitle}>{t('profile.dealershipAddress')}</Text>
          <InfoRow
            label={t('profile.apartmentBuilding')}
            value={profileDetails.address.houseNumber}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.streetName')}
            value={profileDetails.address.streetName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.landmark')}
            value={profileDetails.address.landmark}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.village')}
            value={profileDetails.address.village}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.district')}
            value={profileDetails.address.district}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.state')}
            value={profileDetails.address.state}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.pinCode')}
            value={profileDetails.address.pinCode}
            moderateScale={moderateScale}
            isShowBorderBottom={false}
          />
        </View>
          </>
        )}
      </ScrollView>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
      />

      {/* Toast Notification */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        duration={10000}
        onClose={hideToast}
      />
    </View>
  );
}

