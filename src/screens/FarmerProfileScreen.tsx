import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import LogoutModal from '../components/LogoutModal';
import UpdateNumberModal from '../components/UpdateNumberModal';
import ContactUsModal from '../components/ContactUsModal';
import {SCREEN_NAMES} from '../constants/screenNames';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {clearSession, getSession} from '../utils/session';
import {useLanguage} from '../contexts/LanguageContext';
import {getData, postData, postDataWithImage} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import FirebaseService from '../Service/FirebaseService';
import {pickAndCropImageFromCamera, pickAndCropImageFromGallery} from '../utils/imageCropUtils';
import ImagePickerModal from '../components/ImagePickerModal';
import Toast, {ToastType} from '../components/Toast';

export default function FarmerProfileScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t, currentLanguage} = useLanguage();
  const navigation = useNavigation();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [updateNumberModalVisible, setUpdateNumberModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    name: 'Harrison wills',
    phone: '+91 54852 26478',
    initials: 'HW',
  });

  // Fetch farmer profile data from API
  const fetchFarmerProfile = React.useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }
      console.log('[FarmerProfileScreen] Fetching farmer profile data');
      const response = await getData(Apis.FARMER_PROFILE, {});
      
      let hasMobileFromAPI = false;
      
      if (response?.status === true && response?.data) {
        const data = response.data;
        const personalDetails = data.personal_details || {};
        
        // Profile photo
        if (personalDetails.profile_photo_url) {
          const imageUrl = getImageUrl(personalDetails.profile_photo_url);
          if (imageUrl) {
            setProfileImage(imageUrl);
          }
        } else {
          setProfileImage(null);
        }
        
        // Build full name
        const firstName = personalDetails.first_name || '';
        const middleName = personalDetails.middle_name || '';
        const lastName = personalDetails.last_name || '';
        const fullNameParts = [firstName, middleName, lastName].filter(Boolean);
        const fullName = fullNameParts.join(' ') || '';
        
        // Mobile number
        const mobile = personalDetails.mobile_no ? `+91 ${personalDetails.mobile_no}` : '';
        hasMobileFromAPI = !!personalDetails.mobile_no;
        
        // Get initials
        const initials = fullName 
          ? (fullNameParts.length >= 2 
              ? (fullNameParts[0][0] + fullNameParts[fullNameParts.length - 1][0]).toUpperCase()
              : fullName.substring(0, 2).toUpperCase())
          : 'FW';
        
        setUserData({
          name: fullName,
          phone: mobile,
          initials: initials,
        });
      }
      
      // Also load phone from session as fallback if not available from API
      if (!hasMobileFromAPI) {
        try {
          const session = await getSession();
          if (session?.mobileNumber) {
            setUserData(prev => ({
              ...prev,
              phone: session.mobileNumber || prev.phone,
            }));
          }
        } catch (error) {
          console.error('[FarmerProfileScreen] Error loading session data:', error);
        }
      }
    } catch (error) {
      console.error('[FarmerProfileScreen] Error fetching farmer profile:', error);
      // Fallback to session data on error
      try {
        const session = await getSession();
        if (session?.mobileNumber) {
          setUserData(prev => ({
            ...prev,
            phone: session.mobileNumber || prev.phone,
          }));
        }
      } catch (sessionError) {
        console.error('[FarmerProfileScreen] Error loading session data:', sessionError);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Load user data on mount
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

      console.log('[FarmerProfileScreen] Uploading profile image:', fileName);
      
      // Upload image
      const response = await postDataWithImage(Apis.FARMER_PROFILE_IMAGE, formData);
      
      if (response?.status === true) {
        // Show success message
        showToastMessage(response?.message || 'Profile image updated successfully', 'success');
        
        // Refresh profile data to get updated image
        await fetchFarmerProfile(false);
      } else {
        showToastMessage(response?.message || 'Failed to upload profile image', 'error');
      }
    } catch (error) {
      console.error('[FarmerProfileScreen] Error uploading profile image:', error);
      showToastMessage('Failed to upload profile image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Handle camera press
  const handleCameraPress = async () => {
    try {
      console.log('[FarmerProfileScreen] Opening camera with crop...');
      const imageUri = await pickAndCropImageFromCamera({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        freeStyleCropEnabled: false,
      });
      console.log('[FarmerProfileScreen] Camera result:', imageUri);
      if (imageUri) {
        await handleImageUpload(imageUri);
      }
    } catch (error: any) {
      console.error('[FarmerProfileScreen] Error in handleCameraPress:', error);
      // Don't show error if user cancelled
      if (error?.message !== 'User cancelled image selection' && !error?.message?.includes('User cancelled')) {
        showToastMessage('Failed to open camera. Please try again.', 'error');
      }
    }
  };

  // Handle gallery press
  const handleGalleryPress = async () => {
    try {
      console.log('[FarmerProfileScreen] Opening gallery with crop...');
      const imageUri = await pickAndCropImageFromGallery({
        width: 400,
        height: 400,
        cropping: true,
        cropperCircleOverlay: true,
        compressImageQuality: 0.8,
        freeStyleCropEnabled: false,
      });
      console.log('[FarmerProfileScreen] Gallery result:', imageUri);
      if (imageUri) {
        await handleImageUpload(imageUri);
      }
    } catch (error: any) {
      console.error('[FarmerProfileScreen] Error in handleGalleryPress:', error);
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

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: moderateScale(12),
        },
        optionLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        optionIcon: {
          marginRight: moderateScale(12),
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        optionContent: {
          flex: 1,
        },
        optionLabel: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginBottom: moderateScale(2),
        },
        optionText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
        },
        divider: {
          height: 1,
          backgroundColor: colors.borderDefault,
          marginVertical: moderateScale(4),
        },
        logoutRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        logoutLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        logoutIcon: {
          marginRight: moderateScale(12),
        },
        logoutText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.statusError,
        },
      }),
    [moderateScale, insets.top],
  );

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    try {
      // Unregister FCM token before logout
      try {
        const deviceToken = await FirebaseService.getToken();
        
        if (deviceToken) {
          // Prepare request body
          const bodyData = {
            device_token: deviceToken,
          };
          
          // Call FCM unregister API
          const response = await postData(Apis.FARMER_FCM_UNREGISTER, bodyData);
          
          if (response) {
            console.log('[FarmerProfileScreen] FCM token unregistered successfully:', response);
          } else {
            console.log('[FarmerProfileScreen] FCM token unregistration failed or no response');
          }
        } else {
          console.log('[FarmerProfileScreen] FCM token not available for unregistration');
        }
      } catch (fcmError) {
        console.error('[FarmerProfileScreen] Error unregistering FCM token:', fcmError);
        // Continue with logout even if FCM unregistration fails
      }
      
      // Clear session and navigate to login
      await clearSession();
      setLogoutModalVisible(false);
      (navigation as any).reset({
        index: 0,
        routes: [{name: SCREEN_NAMES.Login}],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      setLogoutModalVisible(false);
      (navigation as any).reset({
        index: 0,
        routes: [{name: SCREEN_NAMES.Login}],
      });
    }
  };

  const handleViewProfile = () => {
    navigation.navigate(SCREEN_NAMES.FarmerProfileDetails as never);
  };

  const handleUpdateNumber = () => {
    console.log('[FarmerProfileScreen] Update number button clicked');
    console.log('[FarmerProfileScreen] Current modal state:', updateNumberModalVisible);
    setUpdateNumberModalVisible(true);
    console.log('[FarmerProfileScreen] Modal state set to true');
  };

  const handleSendRequest = (newNumber: string) => {
    // Handle send request logic here
    console.log('Sending request to update number to:', newNumber);
    // You can add API call here to send the request
  };

  const handleUpdateNumberComplete = (message: string, type: ToastType) => {
    console.log('[FarmerProfileScreen] Update number complete:', {message, type});
    // Show toast message on main screen
    showToastMessage(message, type);
  };

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Get Contact Us text based on language
  const getContactUsText = useMemo(() => {
    switch (currentLanguage) {
      case 'gu':
        return {
          title: 'અમારો સંપર્ક કરો',
          description: 'સંપર્કમાં રહો',
        };
      case 'hi':
        return {
          title: 'हमसे संपर्क करें',
          description: 'हमारे साथ जुड़े',
        };
      case 'en':
      default:
        return {
          title: 'Contact Us',
          description: 'Get in touch with us',
        };
    }
  }, [currentLanguage]);

  return (
    <View style={dynamicStyles.container}>
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
        {/* Profile Information Card */}
        <View style={dynamicStyles.card}>
          {/* Profile Header */}
          <View style={dynamicStyles.profileHeader}>
            <View style={dynamicStyles.profileImageContainer}>
              {uploading ? (
                <View style={dynamicStyles.profileImage}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                </View>
              ) : profileImage ? (
                <Image
                  source={{uri: profileImage}}
                  style={dynamicStyles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={dynamicStyles.profileImage}>
                  <Text style={dynamicStyles.profileImageText}>
                    {getInitials(userData.name)}
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
              <Text style={dynamicStyles.profileName}>{userData.name}</Text>
              <Text style={dynamicStyles.profilePhone}>{userData.phone}</Text>
            </View>
          </View>

          {/* Profile Option */}
          <TouchableOpacity
            style={dynamicStyles.optionRow}
            onPress={handleViewProfile}
            activeOpacity={0.7}>
            <View style={dynamicStyles.optionLeft}>
              <View style={dynamicStyles.optionIcon}>
                <Ionicons
                  name="person-outline"
                  size={moderateScale(20)}
                  color={colors.textPrimary}
                />
              </View>
              <View style={dynamicStyles.optionContent}>
                <Text style={dynamicStyles.optionLabel}>{t('profile.title')}</Text>
                <Text style={dynamicStyles.optionText}>{t('profile.viewProfile')}</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Divider */}
          <View style={dynamicStyles.divider} />

          {/* Update Number Option */}
          <TouchableOpacity
            style={dynamicStyles.optionRow}
            onPress={handleUpdateNumber}
            activeOpacity={0.7}>
            <View style={dynamicStyles.optionLeft}>
              <View style={dynamicStyles.optionIcon}>
                <Ionicons
                  name="call-outline"
                  size={moderateScale(20)}
                  color={colors.textPrimary}
                />
              </View>
              <View style={dynamicStyles.optionContent}>
                <Text style={dynamicStyles.optionLabel}>{t('farmerProfile.updateNumber')}</Text>
                <Text style={dynamicStyles.optionText}>
                  {t('farmerProfile.updateNumberDescription')}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Divider */}
          <View style={dynamicStyles.divider} />

          {/* Language Option */}
          <TouchableOpacity
            style={dynamicStyles.optionRow}
            onPress={() => navigation.navigate(SCREEN_NAMES.Language as never)}
            activeOpacity={0.7}>
            <View style={dynamicStyles.optionLeft}>
              <View style={dynamicStyles.optionIcon}>
                <Ionicons
                  name="language-outline"
                  size={moderateScale(20)}
                  color={colors.textPrimary}
                />
              </View>
              <View style={dynamicStyles.optionContent}>
                <Text style={dynamicStyles.optionLabel}>{t('language.title')}</Text>
                <Text style={dynamicStyles.optionText}>
                {t('language.selectLanguage')}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Divider */}
          <View style={dynamicStyles.divider} />

          {/* Contact Us Option */}
          <TouchableOpacity
            style={dynamicStyles.optionRow}
            onPress={() => setContactModalVisible(true)}
            activeOpacity={0.7}>
            <View style={dynamicStyles.optionLeft}>
              <View style={dynamicStyles.optionIcon}>
                <Ionicons
                  name="call-outline"
                  size={moderateScale(20)}
                  color={colors.textPrimary}
                />
              </View>
              <View style={dynamicStyles.optionContent}>
                <Text style={dynamicStyles.optionLabel}>{getContactUsText.title}</Text>
                <Text style={dynamicStyles.optionText}>
                  {getContactUsText.description}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Log Out Card */}
        <View style={dynamicStyles.card}>
          <TouchableOpacity
            style={dynamicStyles.logoutRow}
            onPress={handleLogout}
            activeOpacity={0.7}>
            <View style={dynamicStyles.logoutLeft}>
              <View style={dynamicStyles.logoutIcon}>
                <Ionicons
                  name="log-out-outline"
                  size={moderateScale(24)}
                  color={colors.statusError}
                />
              </View>
              <Text style={dynamicStyles.logoutText}>{t('profile.logOut')}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Contact Us Modal */}
      <ContactUsModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        tollFreeNumber="1800 212 2129"
        whatsappNumber="9714148897"
        whatsappMessage=""
      />

      {/* Update Number Modal */}
      <UpdateNumberModal
        visible={updateNumberModalVisible}
        onClose={() => {
          console.log('[FarmerProfileScreen] Closing update number modal');
          setUpdateNumberModalVisible(false);
        }}
        existingNumber={userData.phone || ''}
        onSendRequest={handleSendRequest}
        onComplete={handleUpdateNumberComplete}
      />

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
