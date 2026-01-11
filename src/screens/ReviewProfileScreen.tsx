import React, {useState, useMemo, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography, FontFamily} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useImagePicker} from '../hooks/useImagePicker';
import {pickAndCropImageFromCamera, pickAndCropImageFromGallery} from '../utils/imageCropUtils';
import {RootStackParamList} from '../navigation/RootNavigator';
import SimpleBoxInput from '../components/FloatingInput';
import ImagePickerModal from '../components/ImagePickerModal';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';
import Button from '../components/Button';
import {SCREEN_NAMES} from '../constants/screenNames';
import {saveProfileReviewed, getUserRole, saveProfileCompleted, getPendingNavigation, clearPendingNavigation} from '../utils/session';
import { ImagePath } from '../assets/images';
import {useLanguage} from '../contexts/LanguageContext';
import Toast, {ToastType} from '../components/Toast';
import {getData, putData, postDataWithImage, postData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ReviewProfileScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const {pickImage} = useImagePicker();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImages, setPreviewImages] = useState<ImageItem[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFarmer, setIsFarmer] = useState(true); // Default to true since ReviewProfile is for farmers

  // Profile photo
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Personal details
  const [dealershipName, setDealershipName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dobDD, setDobDD] = useState('');
  const [dobMM, setDobMM] = useState('');
  const [dobYYYY, setDobYYYY] = useState('');
  const [domDD, setDomDD] = useState('');
  const [domMM, setDomMM] = useState('');
  const [domYYYY, setDomYYYY] = useState('');

  // Tractor details - store array of tractors
  const [tractorCount, setTractorCount] = useState(1);
  const [tractors, setTractors] = useState<Array<{
    tractorId: string;
    tractorImages: string[];
    rcFrontImage: string | null;
    rcBackImage: string | null;
    modelName: string;
    vehicleNo: string;
    ownerName: string;
    chassisNo: string;
    engineNo: string;
    tractorMobileNo: string;
    dateOfInvoice: string;
    dateOfRegistration: string;
    whoDrives: string;
  }>>([]);
  
  // Keep old state variables for backward compatibility (will use first tractor for single display)
  const [tractorImages, setTractorImages] = useState<string[]>([]);
  const [rcFrontImage, setRcFrontImage] = useState<string | null>(null);
  const [rcBackImage, setRcBackImage] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [chassisNo, setChassisNo] = useState('');
  const [engineNo, setEngineNo] = useState('');
  const [tractorMobileNo, setTractorMobileNo] = useState('');
  const [dateOfInvoice, setDateOfInvoice] = useState('');
  const [dateOfRegistration, setDateOfRegistration] = useState('');
  const [whoDrives, setWhoDrives] = useState('');

  useDynamicStatusBar({
    backgroundColor: colors.backgroundWhite,
    bottomBarColor: colors.backgroundWhite,
  });

  // Check if user is a farmer
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const role = await getUserRole();
        setIsFarmer(role === 'farmer');
      } catch (error) {
        console.error('Error checking user role:', error);
        // Default to farmer since ReviewProfile is typically for farmers
        setIsFarmer(true);
      }
    };
    checkUserRole();
  }, []);

  // Fetch farmer profile data from API
  useEffect(() => {
    const fetchFarmerProfile = async () => {
      try {
        console.log('[ReviewProfileScreen] Fetching farmer profile data');
        const response = await getData(Apis.FARMER_PROFILE, {});
        
        console.log('[ReviewProfileScreen] Profile API response:', JSON.stringify(response, null, 2));
        
        if (response?.status === true && response?.data) {
          const data = response.data;
          const personalDetails = data.personal_details || {};
          const dealershipDetails = data.dealership_details || {};
          const tractorDetails = data.tractor_details || {};
          
          // Profile photo
          if (personalDetails.profile_photo_url) {
            const imageUrl = getImageUrl(personalDetails.profile_photo_url);
            if (imageUrl) {
              setProfilePhoto(imageUrl);
              setOriginalProfilePhoto(imageUrl);
            }
          }
          
          // Personal details
          if (dealershipDetails.dealership_name) {
            setDealershipName(dealershipDetails.dealership_name);
          }
          if (personalDetails.first_name) {
            setFirstName(personalDetails.first_name);
          }
          if (personalDetails.middle_name) {
            setMiddleName(personalDetails.middle_name);
          }
          if (personalDetails.last_name) {
            setLastName(personalDetails.last_name);
          }
          
          // Phone number - default to +91 for India
          setCountryCode('+91');
          if (personalDetails.mobile_no) {
            setPhoneNumber(personalDetails.mobile_no);
          }
          
          // Date of Birth
          if (personalDetails.date_of_birth) {
            const dob = personalDetails.date_of_birth;
            if (typeof dob === 'string') {
              const dobDate = new Date(dob);
              if (!isNaN(dobDate.getTime())) {
                setDobDD(String(dobDate.getDate()).padStart(2, '0'));
                setDobMM(String(dobDate.getMonth() + 1).padStart(2, '0'));
                setDobYYYY(String(dobDate.getFullYear()));
              }
            }
          }
          
          // Date of Marriage
          if (personalDetails.date_of_marriage) {
            const dom = personalDetails.date_of_marriage;
            if (typeof dom === 'string') {
              const domDate = new Date(dom);
              if (!isNaN(domDate.getTime())) {
                setDomDD(String(domDate.getDate()).padStart(2, '0'));
                setDomMM(String(domDate.getMonth() + 1).padStart(2, '0'));
                setDomYYYY(String(domDate.getFullYear()));
              }
            }
          }
          
          // Tractor details - process all tractors from tractor_list
          if (tractorDetails.tractor_list && Array.isArray(tractorDetails.tractor_list) && tractorDetails.tractor_list.length > 0) {
            const tractorCountValue = tractorDetails.tractor_count || tractorDetails.tractor_list.length;
            setTractorCount(tractorCountValue);
            
            // Process all tractors from the API response
            const processedTractors = tractorDetails.tractor_list.map((tractor: any, index: number) => {
              console.log(`[ReviewProfileScreen] Processing tractor ${index + 1}:`, {
                tractor_id: tractor.tractor_id,
                rcbook_front: tractor.rcbook_front,
                rcbook_back: tractor.rcbook_back,
                vehicle_no: tractor.vehicle_no,
              });
              
              // Tractor images from tractor_images_url array
              const tractorImagesArray: string[] = [];
              if (tractor.tractor_images_url && Array.isArray(tractor.tractor_images_url)) {
                tractor.tractor_images_url.forEach((imageUrl: string) => {
                  const fullImageUrl = getImageUrl(imageUrl);
                  if (fullImageUrl) {
                    tractorImagesArray.push(fullImageUrl);
                  }
                });
              } else if (tractor.tractor_image_url) {
                // Fallback to single tractor_image_url if tractor_images_url is not available
                const tractorImageUrl = getImageUrl(tractor.tractor_image_url);
                if (tractorImageUrl) {
                  tractorImagesArray.push(tractorImageUrl);
                }
              }
              
              // RC book images - process each tractor's RC images separately
              let rcFrontUrl: string | null = null;
              let rcBackUrl: string | null = null;
              
              // Get RC front image for this specific tractor
              if (tractor.rcbook_front) {
                const url = getImageUrl(tractor.rcbook_front);
                if (url) {
                  rcFrontUrl = url;
                  console.log(`[ReviewProfileScreen] Tractor ${index + 1} RC Front URL:`, url);
                }
              }
              
              // Get RC back image for this specific tractor
              if (tractor.rcbook_back) {
                const url = getImageUrl(tractor.rcbook_back);
                if (url) {
                  rcBackUrl = url;
                  console.log(`[ReviewProfileScreen] Tractor ${index + 1} RC Back URL:`, url);
                }
              }
              
              // Use display_invoice_date if available (already formatted), otherwise use date_of_invoice
              let invoiceDate = '';
              if (tractor.display_invoice_date) {
                invoiceDate = tractor.display_invoice_date;
              } else if (tractor.date_of_invoice) {
                invoiceDate = tractor.date_of_invoice;
              }
              
              // Use display_registration_date if available (already formatted), otherwise use date_of_registration
              let registrationDate = '';
              if (tractor.display_registration_date) {
                registrationDate = tractor.display_registration_date;
              } else if (tractor.date_of_registration) {
                registrationDate = tractor.date_of_registration;
              }
              
              const processedTractor = {
                tractorId: tractor.tractor_id || `tractor-${index}`,
                tractorImages: tractorImagesArray,
                rcFrontImage: rcFrontUrl,
                rcBackImage: rcBackUrl,
                modelName: tractor.model_name || '',
                vehicleNo: tractor.vehicle_no || '',
                ownerName: tractor.owner_name || '',
                chassisNo: tractor.chassis_no || '',
                engineNo: tractor.engine_no || '',
                tractorMobileNo: tractor.mobile_no || '',
                dateOfInvoice: invoiceDate,
                dateOfRegistration: registrationDate,
                whoDrives: tractor.who_drives || '',
              };
              
              console.log(`[ReviewProfileScreen] Processed tractor ${index + 1}:`, {
                tractorId: processedTractor.tractorId,
                vehicleNo: processedTractor.vehicleNo,
                rcFrontImage: processedTractor.rcFrontImage?.substring(0, 50) + '...',
                rcBackImage: processedTractor.rcBackImage?.substring(0, 50) + '...',
              });
              
              return processedTractor;
            });
            
            console.log('[ReviewProfileScreen] All processed tractors:', processedTractors.map(t => ({
              id: t.tractorId,
              vehicleNo: t.vehicleNo,
              hasRcFront: !!t.rcFrontImage,
              hasRcBack: !!t.rcBackImage,
            })));
            
            // Store all tractors
            setTractors(processedTractors);
            
            // Set first tractor data for backward compatibility (used in single display)
            if (processedTractors.length > 0) {
              const firstTractor = processedTractors[0];
              setTractorImages(firstTractor.tractorImages);
              setRcFrontImage(firstTractor.rcFrontImage);
              setRcBackImage(firstTractor.rcBackImage);
              setModelName(firstTractor.modelName);
              setVehicleNo(firstTractor.vehicleNo);
              setOwnerName(firstTractor.ownerName);
              setChassisNo(firstTractor.chassisNo);
              setEngineNo(firstTractor.engineNo);
              setTractorMobileNo(firstTractor.tractorMobileNo);
              setDateOfInvoice(firstTractor.dateOfInvoice);
              setDateOfRegistration(firstTractor.dateOfRegistration);
              setWhoDrives(firstTractor.whoDrives);
            }
          }
        } else {
          console.warn('[ReviewProfileScreen] Unexpected API response format:', response);
        }
      } catch (error) {
        console.error('[ReviewProfileScreen] Error fetching farmer profile:', error);
      }
    };
    
    fetchFarmerProfile();
  }, []);

  const [currentImageType, setCurrentImageType] = useState<'profile' | 'tractor'>('profile');
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalProfilePhoto, setOriginalProfilePhoto] = useState<string | null>(null);
  
  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('error');

  // Helper function to show toast messages
  const showToastMessage = (message: string, type: ToastType = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  // Handle image press to open preview modal
  const handleImagePress = (images: string[], index: number) => {
    const imageItems: ImageItem[] = images.map((uri, idx) => ({
      id: `img-${idx}`,
      uri: uri,
      placeholder: `Image ${idx + 1}`,
    }));
    setPreviewImages(imageItems);
    setSelectedImageIndex(index);
    setPreviewModalVisible(true);
  };

  const handleClosePreviewModal = () => {
    setPreviewModalVisible(false);
  };

  const handleImagePicker = (type: 'profile' | 'tractor') => {
    setCurrentImageType(type);
    setImagePickerVisible(true);
  };

  const handleCameraPress = async () => {
    try {
      let imageUri: string | null = null;
      
      // Use cropping for profile images
      if (currentImageType === 'profile') {
        imageUri = await pickAndCropImageFromCamera({
          width: 400,
          height: 400,
          cropping: true,
          cropperCircleOverlay: true,
          compressImageQuality: 0.8,
          freeStyleCropEnabled: false,
        });
      } else {
        // Use regular picker for tractor images
        imageUri = await pickImage('camera', {
          onError: (message) => showToastMessage(message),
        });
      }
      
      if (imageUri) {
        // Only handle profile images in ReviewProfileScreen
        // Tractor images are read-only from API
        if (currentImageType === 'profile') {
          setProfilePhoto(imageUri);
        }
      }
      setImagePickerVisible(false);
    } catch (error: any) {
      console.error('Error picking image from camera:', error);
      // Don't show error if user cancelled
      if (error?.message !== 'User cancelled image selection') {
        showToastMessage('Failed to open camera. Please try again.');
      }
      setImagePickerVisible(false);
    }
  };

  const handleGalleryPress = async () => {
    try {
      let imageUri: string | null = null;
      
      // Use cropping for profile images
      if (currentImageType === 'profile') {
        imageUri = await pickAndCropImageFromGallery({
          width: 400,
          height: 400,
          cropping: true,
          cropperCircleOverlay: true,
          compressImageQuality: 0.8,
          freeStyleCropEnabled: false,
        });
      }
      
      if (imageUri) {
        // Only handle profile images in ReviewProfileScreen
        // Tractor images are read-only from API
        if (currentImageType === 'profile') {
          setProfilePhoto(imageUri);
        }
      }
      setImagePickerVisible(false);
    } catch (error: any) {
      console.error('Error picking image from gallery:', error);
      // Don't show error if user cancelled
      if (error?.message !== 'User cancelled image selection') {
        showToastMessage('Failed to open gallery. Please try again.');
      }
      setImagePickerVisible(false);
    }
  };

  // Helper function to format date from DD/MM/YYYY to YYYY-MM-DD
  const formatDateForAPI = (day: string, month: string, year: string): string | null => {
    if (!day || !month || !year) return null;
    
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return null;
    
    // Validate date
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return null;
    }
    
    return `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
  };

  // Helper function to upload profile image
  const uploadProfileImage = async (imageUri: string): Promise<boolean> => {
    try {
      // Check if image is a local file (starts with file://) or remote URL
      if (!imageUri || imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
        // Already uploaded or remote URL, skip upload
        return true;
      }

      // Extract file extension
      const uriParts = imageUri.split('.');
      const fileExtension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
      const validFormats = ['jpg', 'jpeg', 'png'];
      
      if (!validFormats.includes(fileExtension)) {
        showToastMessage('Only upload JPG, PNG, JPEG image formats', 'error');
        return false;
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

      console.log('[ReviewProfileScreen] Uploading profile image:', fileName);
      
      // Upload image
      const response = await postDataWithImage(Apis.FARMER_PROFILE_IMAGE, formData);
      
      if (response?.status === true) {
        console.log('[ReviewProfileScreen] Profile image uploaded successfully');
        return true;
      } else {
        showToastMessage(response?.message || 'Failed to upload profile image', 'error');
        return false;
      }
    } catch (error) {
      console.error('[ReviewProfileScreen] Error uploading profile image:', error);
      showToastMessage('Failed to upload profile image. Please try again.', 'error');
      return false;
    }
  };

  const handleContinue = async () => {
    try {
      setIsSubmitting(true);

      // Upload profile image if it's a new local image (file:// URI) or different from original
      if (profilePhoto) {
        const isLocalImage = profilePhoto.startsWith('file://') || profilePhoto.startsWith('content://');
        const isDifferentImage = profilePhoto !== originalProfilePhoto;
        
        if (isLocalImage || (isDifferentImage && !profilePhoto.startsWith('http'))) {
          const imageUploaded = await uploadProfileImage(profilePhoto);
          if (!imageUploaded) {
            setIsSubmitting(false);
            return; // Stop if image upload fails
          }
        }
      }

      // Format dates for API
      const dateOfBirth = formatDateForAPI(dobDD, dobMM, dobYYYY);
      const dateOfMarriage = formatDateForAPI(domDD, domMM, domYYYY);

      // Prepare request body
      const updateData: any = {
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        dealership_name: dealershipName.trim(),
      };

      // Add dates only if they are valid
      if (dateOfBirth) {
        updateData.date_of_birth = dateOfBirth;
      }
      if (dateOfMarriage) {
        updateData.date_of_marriage = dateOfMarriage;
      }

      console.log('[ReviewProfileScreen] Updating farmer profile:', updateData);

      // Call PUT API to update farmer profile
      const response = await postData(Apis.FARMER_PROFILE_UPDATE, updateData);

      if (response?.status === true) {
        console.log('[ReviewProfileScreen] Profile updated successfully:', response);
        
        // Show success message
        showToastMessage(response?.message || 'Profile updated successfully', 'success');
        
        // Mark profile as reviewed
        await saveProfileReviewed();
        
        // Mark profile as completed
        await saveProfileCompleted(true);
        
        // Check for pending navigation (e.g., from notification click)
        const pendingNav = await getPendingNavigation();
        const hasPendingNotificationNav = pendingNav?.action === 'OPEN_NOTIFICATION_DETAIL';
        const hasPendingEventNav = pendingNav?.action === 'OPEN_EVENT_DETAIL';
        const hasPendingStoryNav = pendingNav?.action === 'OPEN_STORY_DETAIL';
        
        // Navigate to FarmerTabs after a short delay to show success message
        setTimeout(() => {
          navigation.replace(SCREEN_NAMES.FarmerTabs);
          
          // If there's a pending notification navigation, navigate to Notifications screen
          if (hasPendingNotificationNav) {
            console.log('[ReviewProfileScreen] Pending notification navigation detected - will navigate to Notifications');
            setTimeout(() => {
              (navigation as any).navigate(SCREEN_NAMES.FarmerTabs, {
                screen: SCREEN_NAMES.Home,
                params: {
                  screen: SCREEN_NAMES.Notifications,
                },
              });
              // Clear pending navigation
              clearPendingNavigation();
            }, 500);
          } else if (hasPendingEventNav && pendingNav?.params?.eventId) {
            // If there's a pending event navigation, navigate to EventDetails screen
            console.log('[ReviewProfileScreen] Pending event navigation detected - will navigate to EventDetails with eventId:', pendingNav.params.eventId);
            setTimeout(() => {
              (navigation as any).navigate(SCREEN_NAMES.FarmerTabs, {
                screen: SCREEN_NAMES.Events,
                params: {
                  screen: SCREEN_NAMES.EventDetails,
                  params: {
                    eventId: pendingNav.params.eventId,
                  },
                },
              });
              // Clear pending navigation
              clearPendingNavigation();
            }, 500);
          } else if (hasPendingStoryNav && pendingNav?.params?.storyId) {
            // If there's a pending story navigation, navigate to StoryDetails screen
            console.log('[ReviewProfileScreen] Pending story navigation detected - will navigate to StoryDetails with storyId:', pendingNav.params.storyId);
            setTimeout(() => {
              (navigation as any).navigate(SCREEN_NAMES.FarmerTabs, {
                screen: SCREEN_NAMES.Stories,
                params: {
                  screen: SCREEN_NAMES.StoryDetails,
                  params: {
                    storyId: pendingNav.params.storyId,
                    fromScreen: 'Notifications',
                  },
                },
              });
              // Clear pending navigation
              clearPendingNavigation();
            }, 500);
          }
        }, 1000);
      } else {
        // Show error message
        showToastMessage(response?.message || 'Failed to update profile. Please try again.', 'error');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('[ReviewProfileScreen] Error updating profile:', error);
      showToastMessage('Failed to update profile. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
          marginVertical:moderateScale(60)
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingTop: moderateScale(10) ,
          paddingBottom: moderateScale(20),
          
        },
        title: {
          ...Typography.boldXxl,
          fontSize: moderateScale(24),
          color: colors.textPrimary,
          marginBottom: moderateScale(24),
        },
        card: {
          backgroundColor: colors.white,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        sectionTitle: {
          ...Typography.semiBoldLg,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
          marginBottom: moderateScale(8),
        },
        sectionDescription: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
          marginBottom: moderateScale(16),
        },
        profilePhotoContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(20),
        },
        profilePhotoWrapper: {
          marginRight: moderateScale(16),
        },
        profilePhoto: {
          width: moderateScale(70),
          height: moderateScale(70),
          borderRadius: moderateScale(50),
        },
        profilePhotoPlaceholder: {
          width: moderateScale(70),
          height: moderateScale(70),
          borderRadius: moderateScale(50),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        profilePhotoTextContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        changePhotoText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          textDecorationLine: 'underline',
        },
        uploadHint: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
          marginTop: moderateScale(8),
        },
        row: {
          flexDirection: 'row',
          gap: moderateScale(12),
        },
        dateInputContainer: {
          flex: 1,
        },
        dateLabel: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
          marginBottom: moderateScale(4),
        },
        tractorHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        tractorCount: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
        },
        tractorImage: {
          width: '100%',
          height: moderateScale(200),
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          marginBottom: moderateScale(16),
        },
        tractorImageRow: {
          flexDirection: 'row',
          gap: moderateScale(12),
          // marginBottom: moderateScale(16),
          width: '100%',
        },
        tractorImageSingle: {
          width: '100%',
          height: moderateScale(180),
          borderRadius: moderateScale(8),
          // backgroundColor: colors.backgroundGray,
          overflow: 'hidden',
          // marginBottom: moderateScale(16),
        },
        tractorImageHalf: {
          flex: 1,
          height: moderateScale(180),
          borderRadius: moderateScale(8),
          // backgroundColor: colors.backgroundGray,
          overflow: 'hidden',
        },
        imageTouchable: {
          width: '100%',
          height: '100%',
        },
        rcImageRow: {
          flexDirection: 'row',
          gap: moderateScale(12),
          // marginBottom: moderateScale(16),
          width: '100%',
        },
        rcImageSingle: {
          width: '100%',
          height: moderateScale(180),
          borderRadius: moderateScale(8),
          // backgroundColor: colors.backgroundGray,
          overflow: 'hidden',
          marginBottom: moderateScale(16),
        },
        rcImageHalf: {
          flex: 1,
          height: moderateScale(180),
          borderRadius: moderateScale(8),
          // backgroundColor: colors.backgroundGray,
          overflow: 'hidden',
        },
        detailRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: moderateScale(12),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        detailLabel: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
          flex: 0.4,
        },
        detailValue: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          flex: 0.6,
          textAlign: 'right',
          fontFamily: FontFamily.Medium,
        },
        continueButton: {
          marginTop: moderateScale(24),
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}>
        <Text style={dynamicStyles.title}>{t('profile.reviewProfile')}</Text>

        {/* Personal Details Section */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.sectionTitle}>{t('reviewProfile.personalDetails')}</Text>
          <Text style={dynamicStyles.sectionDescription}>
            {t('reviewProfile.personalDetailsDescription')}
          </Text>

          {/* Profile Photo */}
          <View style={dynamicStyles.profilePhotoContainer}>
            <TouchableOpacity
              onPress={() => handleImagePicker('profile')}
              activeOpacity={0.7}
              style={dynamicStyles.profilePhotoWrapper}>
              {profilePhoto ? (
                <Image
                  source={{uri: profilePhoto}}
                  style={dynamicStyles.profilePhoto}
                />
              ) : (
                <View style={dynamicStyles.profilePhotoPlaceholder}>
                  <Ionicons
                    name="person"
                    size={moderateScale(40)}
                    color={colors.textTertiary}
                  />
                </View>
              )}
            </TouchableOpacity>
            <View style={dynamicStyles.profilePhotoTextContainer}>
              <TouchableOpacity
                onPress={() => handleImagePicker('profile')}
                activeOpacity={0.7}>
                <Text style={dynamicStyles.changePhotoText}>
                  {t('reviewProfile.changeProfilePhoto')}
                </Text>
              </TouchableOpacity>
              <Text style={dynamicStyles.uploadHint}>
                {t('reviewProfile.uploadHint')}
              </Text>
            </View>
          </View>

          {/* Dealership Name */}
          <SimpleBoxInput
            label={t('farmerProfile.dealershipName')}
            value={dealershipName}
            onChangeText={setDealershipName}
            editable={!isFarmer}
          />

          {/* First Name */}
          <SimpleBoxInput
            label={t('farmerProfile.firstName')}
            value={firstName}
            onChangeText={setFirstName}
          />

          {/* Middle Name */}
          <SimpleBoxInput
            label={t('farmerProfile.middleName')}
            value={middleName}
            onChangeText={setMiddleName}
          />

          {/* Last Name */}
          <SimpleBoxInput
            label={t('farmerProfile.lastName')}
            value={lastName}
            onChangeText={setLastName}
          />

          {/* Phone Number */}
          <View style={dynamicStyles.row}>
            <View style={[dynamicStyles.dateInputContainer, {flex: 0.3}]}>
              <SimpleBoxInput
                label={t('reviewProfile.code')}
                value={countryCode}
                onChangeText={setCountryCode}
                editable={!isFarmer}
              />
            </View>
            <View style={[dynamicStyles.dateInputContainer, {flex: 0.7}]}>
              <SimpleBoxInput
                label={t('reviewProfile.number')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!isFarmer}
              />
            </View>
          </View>

          {/* Date of Birth */}
          <Text style={dynamicStyles.dateLabel}>{t('farmerProfile.dateOfBirth')}</Text>
          <View style={dynamicStyles.row}>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput
                label={t('reviewProfile.date')}
                value={dobDD}
                onChangeText={setDobDD}
              />
            </View>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput label={t('reviewProfile.of')} value={dobMM} onChangeText={setDobMM} />
            </View>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput
                label={t('reviewProfile.birth')}
                value={dobYYYY}
                onChangeText={setDobYYYY}
              />
            </View>
          </View>

          {/* Date of Marriage */}
          <Text style={[dynamicStyles.dateLabel, {marginTop: moderateScale(12)}]}>
            {t('farmerProfile.dateOfMarriage')}
          </Text>
          <View style={dynamicStyles.row}>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput
                label={t('reviewProfile.date')}
                value={domDD}
                onChangeText={setDomDD}
              />
            </View>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput label={t('reviewProfile.of')} value={domMM} onChangeText={setDomMM} />
            </View>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput
                label={t('reviewProfile.marriage')}
                value={domYYYY}
                onChangeText={setDomYYYY}
              />
            </View>
          </View>
        </View>

        {/* Tractor Details Section - Show all tractors */}
        {tractors.map((tractor, tractorIndex) => {
          console.log(`[ReviewProfileScreen] Rendering tractor ${tractorIndex + 1}:`, {
            tractorId: tractor.tractorId,
            vehicleNo: tractor.vehicleNo,
            rcFrontImage: tractor.rcFrontImage?.substring(0, 50) + '...',
            rcBackImage: tractor.rcBackImage?.substring(0, 50) + '...',
          });
          
          return (
          <View key={`tractor-${tractor.tractorId}-${tractorIndex}`} style={dynamicStyles.card}>
            <View style={dynamicStyles.tractorHeader}>
              <Text style={dynamicStyles.sectionTitle}>
                {t('farmerProfile.tractorDetails')} {tractors.length > 1 ? `(${tractorIndex + 1})` : ''}
              </Text>
              {tractorIndex === 0 && (
                <Text style={dynamicStyles.tractorCount}>
                  {t('farmerProfile.tractorCount')}: {tractorCount}
                </Text>
              )}
            </View>

            {/* Tractor Images */}
            {tractor.tractorImages.length > 0 ? (
              tractor.tractorImages.length === 1 ? (
                <TouchableOpacity
                  style={dynamicStyles.tractorImageSingle}
                  onPress={() => handleImagePress(tractor.tractorImages, 0)}
                  activeOpacity={0.9}>
                  <Image
                    source={{uri: tractor.tractorImages[0]}}
                    style={{
                      width: '100%',
                      height: moderateScale(200),
                    }}
                    resizeMode="contain"
                    onError={(error) => {
                      console.error('[ReviewProfileScreen] Error loading tractor image:', error);
                    }}
                  />
                </TouchableOpacity>
              ) : (
                <View style={dynamicStyles.tractorImageRow}>
                  {tractor.tractorImages.slice(0, 2).map((imageUri, index) => (
                    <TouchableOpacity
                      key={index}
                      style={dynamicStyles.tractorImageHalf}
                      onPress={() => handleImagePress(tractor.tractorImages, index)}
                      activeOpacity={0.9}>
                      <Image
                        source={{uri: imageUri}}
                        style={{
                          width: '100%',
                          height: moderateScale(200),
                        }}
                        resizeMode="contain"
                        onError={(error) => {
                          console.error('[ReviewProfileScreen] Error loading tractor image:', error);
                        }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )
            ) : (
              <View style={dynamicStyles.tractorImageSingle}>
                <Image
                  source={ImagePath.farmerTractor}
                  style={{
                    width: '100%',
                    height: moderateScale(200),
                  }}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* RC Book Images */}
            {(tractor.rcFrontImage || tractor.rcBackImage) && (
              <>
                {tractor.rcFrontImage && tractor.rcBackImage ? (
                  <View style={dynamicStyles.rcImageRow}>
                    <TouchableOpacity
                      key={`rc-front-${tractor.tractorId}-${tractorIndex}`}
                      style={dynamicStyles.rcImageHalf}
                      onPress={() => {
                        const rcImages = [tractor.rcFrontImage, tractor.rcBackImage].filter(Boolean) as string[];
                        handleImagePress(rcImages, 0);
                      }}
                      activeOpacity={0.9}>
                      <Image
                        key={`rc-front-img-${tractor.tractorId}-${tractorIndex}`}
                        source={{uri: tractor.rcFrontImage}}
                        style={{
                          width: '100%',
                          height: moderateScale(200),
                        }}
                        resizeMode="contain"
                        onError={(error) => {
                          console.error(`[ReviewProfileScreen] Error loading RC front image for tractor ${tractorIndex + 1} (${tractor.vehicleNo}):`, error);
                        }}
                        onLoad={() => {
                          console.log(`[ReviewProfileScreen] Successfully loaded RC front image for tractor ${tractorIndex + 1} (${tractor.vehicleNo})`);
                        }}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      key={`rc-back-${tractor.tractorId}-${tractorIndex}`}
                      style={dynamicStyles.rcImageHalf}
                      onPress={() => {
                        const rcImages = [tractor.rcFrontImage, tractor.rcBackImage].filter(Boolean) as string[];
                        handleImagePress(rcImages, 1);
                      }}
                      activeOpacity={0.9}>
                      <Image
                        key={`rc-back-img-${tractor.tractorId}-${tractorIndex}`}
                        source={{uri: tractor.rcBackImage}}
                        style={{
                          width: '100%',
                          height: moderateScale(200),
                        }}
                        resizeMode="contain"
                        onError={(error) => {
                          console.error(`[ReviewProfileScreen] Error loading RC back image for tractor ${tractorIndex + 1}:`, error);
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    key={`rc-single-${tractor.tractorId}-${tractorIndex}`}
                    style={dynamicStyles.rcImageSingle}
                    onPress={() => {
                      const rcImages = [tractor.rcFrontImage, tractor.rcBackImage].filter(Boolean) as string[];
                      handleImagePress(rcImages, 0);
                    }}
                    activeOpacity={0.9}>
                    {tractor.rcFrontImage ? (
                      <Image
                        key={`rc-front-single-img-${tractor.tractorId}-${tractorIndex}`}
                        source={{uri: tractor.rcFrontImage}}
                        style={{
                          width: '100%',
                          height: moderateScale(200),
                        }}
                        resizeMode="contain"
                        onError={(error) => {
                          console.error(`[ReviewProfileScreen] Error loading RC front image for tractor ${tractorIndex + 1} (${tractor.vehicleNo}):`, error);
                        }}
                        onLoad={() => {
                          console.log(`[ReviewProfileScreen] Successfully loaded RC front image for tractor ${tractorIndex + 1} (${tractor.vehicleNo})`);
                        }}
                      />
                    ) : tractor.rcBackImage ? (
                      <Image
                        key={`rc-back-single-img-${tractor.tractorId}-${tractorIndex}`}
                        source={{uri: tractor.rcBackImage}}
                        style={{
                          width: '100%',
                          height: moderateScale(200),
                        }}
                        resizeMode="contain"
                        onError={(error) => {
                          console.error(`[ReviewProfileScreen] Error loading RC back image for tractor ${tractorIndex + 1}:`, error);
                        }}
                      />
                    ) : null}
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Tractor Details */}
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>{t('farmerProfile.modelName')}:</Text>
              <Text style={dynamicStyles.detailValue}>{tractor.modelName}</Text>
            </View>
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>{t('farmerProfile.vehicleNo')}:</Text>
              <Text style={dynamicStyles.detailValue}>{tractor.vehicleNo}</Text>
            </View>
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>{t('farmerProfile.ownerName')}:</Text>
              <Text style={dynamicStyles.detailValue}>{tractor.ownerName}</Text>
            </View>
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>{t('farmerProfile.chassisNo')}</Text>
              <Text style={dynamicStyles.detailValue}>{tractor.chassisNo}</Text>
            </View>
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>{t('farmerProfile.engineNo')}</Text>
              <Text style={dynamicStyles.detailValue}>{tractor.engineNo}</Text>
            </View>
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>{t('farmerProfile.mobileNo')}</Text>
              <Text style={dynamicStyles.detailValue}>{tractor.tractorMobileNo}</Text>
            </View>
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>{t('farmerProfile.dateOfInvoice')}</Text>
              <Text style={dynamicStyles.detailValue}>{tractor.dateOfInvoice}</Text>
            </View>
            <View style={dynamicStyles.detailRow}>
              <Text style={dynamicStyles.detailLabel}>{t('farmerProfile.dateOfRegistration')}</Text>
              <Text style={dynamicStyles.detailValue}>{tractor.dateOfRegistration}</Text>
            </View>
            <View style={[dynamicStyles.detailRow, {borderBottomWidth: 0}]}>
              <Text style={dynamicStyles.detailLabel}>{t('farmerProfile.whoDrives')}</Text>
              <Text style={dynamicStyles.detailValue}>{tractor.whoDrives}</Text>
            </View>
          </View>
          );
        })}

        {/* Continue Button */}
        <Button
          title={t('reviewProfile.continue')}
          onPress={handleContinue}
          style={dynamicStyles.continueButton}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </ScrollView>

      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
      />

      {/* Image Preview Modal - without Replace button */}
      <ImagePreviewModal
        visible={previewModalVisible}
        images={previewImages}
        initialIndex={selectedImageIndex}
        onClose={handleClosePreviewModal}
        // Don't pass onReplaceImage to hide the Replace button
      />

      {/* Toast Notification */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        duration={3000}
        onClose={hideToast}
      />
    </KeyboardAvoidingView>
  );
}

