import React, {useMemo, useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Pressable,
  Linking,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation, useFocusEffect, CommonActions, StackActions} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {FarmerTabParamList} from '../navigation/FarmerTabNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import VideoPlayer from '../components/VideoPlayer';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';
import ContactUsModal from '../components/ContactUsModal';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useStatusBar} from '../contexts/StatusBarContext';
import {useTTS} from '../contexts/TTSContext';
import {ImagePath} from '../assets/images';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {isYouTubeUrl, getYouTubeThumbnailUrl, extractYouTubeVideoId} from '../utils/youtubeUtils';
import YoutubePlayer from 'react-native-youtube-iframe';
import Button from '../components/Button';

type EventDetailsRouteParams = {
  eventId: string;
  title?: string;
  location?: string;
  date?: string;
  description?: string;
  videoUri?: string;
  images?: string[];
  fromScreen?: 'Home' | 'List';
};

// Mock event data
const getEventDetails = (eventId: string) => {
  const defaultData = {
    id: eventId,
    title: 'Captain Tractor National Dealer Meet 2025',
    location: 'Dy patil stadium, Mumbai',
    date: '10:30 am, 15 Sept 2025',
    description:
      'Captain Tractors proudly organized its National Dealer Meet 2025 on the 9th and 10th of September in the royal city of Udaipur, Rajasthan. This grand assembly brought together over 175+ of our valued dealer partners from every corner of India, celebrating the strength, trust, and growth of the Captain Tractors family.',
    fullDescription:
      'Captain Tractors proudly organized its National Dealer Meet 2025 on the 9th and 10th of September in the royal city of Udaipur, Rajasthan. This grand assembly brought together over 175+ of our valued dealer partners from every corner of India, celebrating the strength, trust, and growth of the Captain Tractors family.\n\nThe first day was a vibrant celebration. Dealers were welcomed with traditional Rajasthani hospitality, creating a festive atmosphere. An unforgettable evening of folk dance, music, and cultural performances perfectly embodied the event\'s theme, \'Chhalaang\', binding the Captain family in a shared spirit of unity and enthusiasm.',
    videoUri: '', // Removed static video - only show video if API provides it
    thumbnailUri: ImagePath.no_image,
    images: [
      ImagePath.no_image,
    ],
  };

  return defaultData;
};

export default function EventDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t, currentLanguage} = useLanguage();
  const route = useRoute();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const params = route.params as EventDetailsRouteParams;
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [eventApiData, setEventApiData] = useState<any>(null); // Store full API response
  const [eventNotFound, setEventNotFound] = useState(false); // Track if event is deleted/not found
  const {playTTS, stopTTS, state: ttsState} = useTTS();

  // Fetch event details from API
  const fetchEventDetails = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const eventId = params?.eventId;
      
      if (!eventId) {
        console.error('[EventDetailsScreen] No event ID provided');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Call API with eventId - endpoint: /api/farmers/events/{eventId}
      console.log('[EventDetailsScreen] Fetching event with ID:', eventId);
      const apiUrl = `${API_BASE_URL}/api/farmers/events/${eventId}`;
      const response = await getData(apiUrl, {});
      
      console.log('[EventDetailsScreen] API Response:', JSON.stringify(response, null, 2));
      
      // Check if event is not found (deleted) - API returns status: false or no data
      if (response?.status === false || !response?.data) {
        console.warn('[EventDetailsScreen] Event not found or deleted');
        setEventNotFound(true);
        setEventDetails(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (response?.status === true && response?.data) {
        setEventNotFound(false); // Reset not found state
        const eventData = response.data;
        console.log('[EventDetailsScreen] Event Data:', JSON.stringify(eventData, null, 2));
        
        // Handle video URL from media.cover_video
        let videoUrl = '';
        if (eventData.media?.cover_video?.video_url) {
          videoUrl = eventData.media.cover_video.video_url;
        } else if (eventData.video_url || eventData.videoUrl) {
          videoUrl = eventData.video_url || eventData.videoUrl;
        }
        
        // Handle thumbnail - prioritize YouTube thumbnail if video is YouTube
        let thumbnailUrl = null;
        if (videoUrl && isYouTubeUrl(videoUrl)) {
          // Use YouTube thumbnail for YouTube videos
          const youtubeThumbnail = getYouTubeThumbnailUrl(videoUrl, 'maxresdefault');
          thumbnailUrl = youtubeThumbnail;
        } else if (eventData.media?.cover_video?.thumbnail_url) {
          thumbnailUrl = getImageUrl(eventData.media.cover_video.thumbnail_url);
        } else if (eventData.media?.image) {
          // Handle media.image JSON string format (current API) or array format (future API)
          let imageUrls: string[] = [];
          if (typeof eventData.media.image === 'string' && eventData.media.image.trim().startsWith('[')) {
            // Parse JSON string to array
            try {
              const parsedUrls = JSON.parse(eventData.media.image);
              if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
                imageUrls = parsedUrls;
              } else {
                imageUrls = [eventData.media.image];
              }
            } catch (e) {
              console.warn('[EventDetailsScreen] Failed to parse media.image JSON:', e);
              imageUrls = [eventData.media.image];
            }
          } else if (Array.isArray(eventData.media.image)) {
            // Future API format: already an array
            imageUrls = eventData.media.image;
          } else {
            // Single string URL
            imageUrls = [eventData.media.image];
          }
          // Use first image from the array
          if (imageUrls.length > 0) {
            thumbnailUrl = getImageUrl(imageUrls[0]);
          }
        } else if (eventData.image_url) {
          // Handle JSON string format (current API) or array format (future API)
          let imageUrls: string[] = [];
          if (typeof eventData.image_url === 'string' && eventData.image_url.trim().startsWith('[')) {
            // Parse JSON string to array
            try {
              const parsedUrls = JSON.parse(eventData.image_url);
              if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
                imageUrls = parsedUrls;
              } else {
                imageUrls = [eventData.image_url];
              }
            } catch (e) {
              console.warn('[EventDetailsScreen] Failed to parse image_url JSON:', e);
              imageUrls = [eventData.image_url];
            }
          } else if (Array.isArray(eventData.image_url)) {
            // Future API format: already an array
            imageUrls = eventData.image_url;
          } else {
            // Single string URL
            imageUrls = [eventData.image_url];
          }
          // Use first image from the array
          if (imageUrls.length > 0) {
            thumbnailUrl = getImageUrl(imageUrls[0]);
          }
        }
        // Only use default thumbnail if no video URL or if video is not YouTube
        const thumbnailUri = thumbnailUrl ? {uri: thumbnailUrl} : (videoUrl ? undefined : ImagePath.no_image);
        
        // Handle location
        let location = 'Location not specified';
        if (eventData.location?.full_address) {
          location = eventData.location.full_address;
        } else if (eventData.location?.city && eventData.location?.state) {
          location = `${eventData.location.city}, ${eventData.location.state}`;
        } else if (eventData.event_venue) {
          location = eventData.event_venue;
        }
        
        // Handle date - use display_datetime or display_date
        const date = eventData.display_datetime || eventData.display_date || eventData.event_date || eventData.date || '';
        
        // Handle description - use description.text
        const defaultDescription = eventData.description?.text || eventData.description || '';
        
        // Handle contacts from API response
        const contacts = eventData.contacts || [];
        // First contact is typically toll-free number, second is WhatsApp
        const tollFreeNumber = contacts[0];
        // Extract WhatsApp number (remove +91 prefix and spaces)
        let whatsappNumber = contacts[1];
        if (whatsappNumber && whatsappNumber.startsWith('+91')) {
          whatsappNumber = whatsappNumber.replace('+91', '').trim();
        } else if (whatsappNumber && whatsappNumber.startsWith('91')) {
          whatsappNumber = whatsappNumber.replace('91', '').trim();
        }
        // Remove any spaces or special characters
        if (whatsappNumber) {
          whatsappNumber = whatsappNumber.replace(/\s/g, '').replace(/[^\d]/g, '');
        }
        
        // Get WhatsApp message from API
        const whatsappMessage = eventData.whatsapp_message || '';

        // Store full API data including languages array
        setEventApiData(eventData);
        
        // Get language-specific content (using currentLanguage from context via closure)
        // Map language code to language_id (en -> 1, hi -> 2, gu -> 3)
        const languageIdMap: Record<string, number> = {
          'en': 1,
          'hi': 2,
          'gu': 3,
        };
        
        const currentLanguageId = languageIdMap[currentLanguage] || 1;
        const languageSpecificContent = eventData.languages?.find(
          (lang: any) => lang.language_id === currentLanguageId
        );
        
        // Use language-specific title and description if available, otherwise use default
        const displayTitle = languageSpecificContent?.title || eventData.title || params?.title || 'Event';
        const displayDescription = languageSpecificContent?.description || defaultDescription;
        
        // Handle gallery images from media.gallery_images or media.images
        const galleryImages: any[] = [];
        
        // First, check for media.gallery_images (new API format - array of strings)
        if (eventData.media?.gallery_images && Array.isArray(eventData.media.gallery_images)) {
          eventData.media.gallery_images.forEach((url: string) => {
            const imgUrl = getImageUrl(url);
            if (imgUrl) {
              galleryImages.push({uri: imgUrl});
            }
          });
        }
        
        // Also check for media.images (old API format - array of objects)
        if (eventData.media?.images && Array.isArray(eventData.media.images)) {
          eventData.media.images.forEach((imgObj: any) => {
            let imageUrls: string[] = [];
            
            // Check if image_url is a JSON string (current API format)
            if (imgObj.image_url) {
              if (typeof imgObj.image_url === 'string' && imgObj.image_url.trim().startsWith('[')) {
                // Parse JSON string to array
                try {
                  const parsedUrls = JSON.parse(imgObj.image_url);
                  if (Array.isArray(parsedUrls)) {
                    imageUrls = parsedUrls;
                  } else {
                    // If it's a single string, add it to array
                    imageUrls = [imgObj.image_url];
                  }
                } catch (e) {
                  // If parsing fails, treat as single string
                  console.warn('[EventDetailsScreen] Failed to parse image_url JSON:', e);
                  imageUrls = [imgObj.image_url];
                }
              } else if (Array.isArray(imgObj.image_url)) {
                // Future API format: already an array
                imageUrls = imgObj.image_url;
              } else {
                // Single string URL
                imageUrls = [imgObj.image_url];
              }
            }
            
            // Process all image URLs
            imageUrls.forEach((url: string) => {
              const imgUrl = getImageUrl(url);
              if (imgUrl) {
                galleryImages.push({uri: imgUrl});
              }
            });
          });
        }
        console.log('[EventDetailsScreen] Gallery images count:', galleryImages.length);
        // If thumbnail exists and is not already in gallery images, add it at the beginning
        if (thumbnailUrl) {
          const thumbnailExists = galleryImages.some((img: any) => img.uri === thumbnailUrl);
          if (!thumbnailExists) {
            galleryImages.unshift({uri: thumbnailUrl});
          }
        }
        // If no images at all, use fallback
        if (galleryImages.length === 0) {
          galleryImages.push(ImagePath.no_image);
        }
        console.log('[EventDetailsScreen] Final images count:', galleryImages.length);
        
        setEventDetails({
          id: eventData.event_id || eventData.id || eventId,
          title: displayTitle,
          location: location,
          date: date,
          description: displayDescription,
          fullDescription: displayDescription,
          videoUri: videoUrl,
          thumbnailUri: thumbnailUri,
          images: galleryImages,
          tollFreeNumber: tollFreeNumber,
          whatsappNumber: whatsappNumber,
          whatsappMessage: whatsappMessage,
        });
      } else {
        console.warn('[EventDetailsScreen] Unexpected API response format:', response);
        // Event not found
        setEventNotFound(true);
        setEventDetails(null);
      }
    } catch (error) {
      console.error('[EventDetailsScreen] Error fetching event details:', error);
      // Event not found on error
      setEventNotFound(true);
      setEventDetails(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [params?.eventId]);

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchEventDetails(true);
  }, [fetchEventDetails]);

  // Update displayed content when language changes
  useEffect(() => {
    if (eventApiData) {
      // Map language code to language_id (en -> 1, hi -> 2, gu -> 3)
      const languageIdMap: Record<string, number> = {
        'en': 1,
        'hi': 2,
        'gu': 3,
      };
      
      const currentLanguageId = languageIdMap[currentLanguage] || 1;
      const languageSpecificContent = eventApiData.languages?.find(
        (lang: any) => lang.language_id === currentLanguageId
      );
      
      // Update title and description based on selected language
      // Use language-specific title if available, otherwise fallback to English, then default
      let displayTitle = languageSpecificContent?.title;
      if (!displayTitle) {
        // Fallback to English if no title found for selected language
        const englishContent = eventApiData.languages?.find(
          (lang: any) => lang.language_id === 1
        );
        displayTitle = englishContent?.title || eventApiData.title || params?.title || 'Event';
      }
      const defaultDescription = eventApiData.description?.text || eventApiData.description || '';
      const displayDescription = languageSpecificContent?.description || defaultDescription;
      
      setEventDetails((prev: any) => ({
        ...prev,
        title: displayTitle,
        description: displayDescription,
        fullDescription: displayDescription,
      }));
    }
  }, [currentLanguage, eventApiData, params?.title]);

  // Fetch event details on mount
  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

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
          paddingBottom: moderateScale(12),
          backgroundColor: colors.backgroundLight,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
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
        contactButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(10),
          borderRadius: moderateScale(20),
        },
        contactButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textWhite,
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
        bannerImageContainer: {
          width: '100%',
          height: moderateScale(250),
          marginBottom: moderateScale(8),
          borderRadius: moderateScale(10),
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        videoModalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        videoModalContainer: {
          width: screenWidth,
          bottom:moderateScale(30),          
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
        eventTitle: {
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
          marginBottom: moderateScale(16),
        },
        eventInfoRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(12),
        },
        eventInfoText: {
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
          backgroundColor: colors.light_orange, // Light orange background
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(10),
          borderRadius: moderateScale(20),
          alignSelf: 'flex-start',
          marginBottom: moderateScale(16),
          borderWidth: 1,
          borderStyle: 'dashed', // Dotted border
          borderColor: colors.primary,
        },
        textToSpeechButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.primary, // Orange text instead of white
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

  // Prepare images for preview modal
  const previewImages: ImageItem[] = useMemo(() => {
    if (!eventDetails?.images) return [];
    const images: ImageItem[] = [];
    eventDetails.images.forEach((img: any, index: number) => {
      // Check if img is a require() result (number) or an object with uri
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
  }, [eventDetails?.images]);

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

  const handleContactUs = () => {
    setContactModalVisible(true);
  };

  const handleCloseContactModal = () => {
    setContactModalVisible(false);
  };

  const handleCall = async () => {
    const phoneNumber = '18002122129';
    const phoneUrl = `tel:${phoneNumber}`;
    
    try {
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        console.log('Cannot make phone call');
      }
    } catch (error) {
      console.log('Error opening phone dialer:', error);
    }
  };

  const handleWhatsApp = async () => {
    const phoneNumber = '919099433133'; // Remove + and spaces
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback: try WhatsApp app directly
        const whatsappAppUrl = Platform.OS === 'ios' 
          ? `whatsapp://send?phone=${phoneNumber}`
          : `whatsapp://send?phone=${phoneNumber}`;
        await Linking.openURL(whatsappAppUrl);
      }
    } catch (error) {
      console.log('Error opening WhatsApp:', error);
    }
  };

  const handleTextToSpeech = async () => {
    const descriptionText = params?.description || eventDetails.fullDescription;
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
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

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

          {/* Event Details Card Skeleton */}
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
              width="70%"
              height={moderateScale(20)}
              borderRadius={moderateScale(4)}
              marginBottom={moderateScale(16)}
            />
            {/* Date Row Skeleton */}
            <SkeletonPlaceholder.Item
              flexDirection="row"
              alignItems="center"
              marginBottom={moderateScale(12)}>
              <SkeletonPlaceholder.Item
                width={moderateScale(18)}
                height={moderateScale(18)}
                borderRadius={moderateScale(9)}
                marginRight={moderateScale(8)}
              />
              <SkeletonPlaceholder.Item
                width="60%"
                height={moderateScale(14)}
                borderRadius={moderateScale(2)}
              />
            </SkeletonPlaceholder.Item>
            {/* Location Row Skeleton */}
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
                width="65%"
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

  // Render error state for deleted/not found event
  if (!loading && eventNotFound) {
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
          </View>
        </View>
        
        {/* Error State */}
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: moderateScale(32)}}>
          <Text style={[Typography.boldXl, {color: colors.textPrimary, fontSize: moderateScale(20), marginBottom: moderateScale(24), textAlign: 'center'}]}>
            {t('events.noEventFound')}
          </Text>
          <Button
            title={t('events.goToHome')}
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

  if (loading || !eventDetails) {
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
          </View>
          <TouchableOpacity
            style={dynamicStyles.contactButton}
            onPress={handleContactUs}
            activeOpacity={0.7}>
            <Text style={dynamicStyles.contactButtonText}>Contact us</Text>
          </TouchableOpacity>
        </View>
        {renderSkeleton()}
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
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
        </View>
        <TouchableOpacity
          style={dynamicStyles.contactButton}
          onPress={handleContactUs}
          activeOpacity={0.7}>
          <Text style={dynamicStyles.contactButtonText}>Contact us</Text>
        </TouchableOpacity>
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
        {eventDetails.videoUri && eventDetails.videoUri.trim() !== '' ? (
          <View style={dynamicStyles.videoContainer}>
            {isYouTubeUrl(eventDetails.videoUri) ? (
              // YouTube video - show thumbnail with play button, open modal on tap
              <TouchableOpacity
                style={dynamicStyles.mainImageContainer}
                activeOpacity={0.9}
                onPress={() => {
                  const videoId = extractYouTubeVideoId(eventDetails.videoUri);
                  if (videoId) {
                    setSelectedVideoId(videoId);
                    setShowVideoModal(true);
                  }
                }}>
                {typeof eventDetails.thumbnailUri === 'object' && eventDetails.thumbnailUri?.uri && typeof eventDetails.thumbnailUri.uri === 'string' ? (
                  <FastImage
                    source={{
                      uri: eventDetails.thumbnailUri.uri,
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={{width: '100%', height: '100%'}}
                    resizeMode={FastImage.resizeMode.cover}
                    defaultSource={ImagePath.no_image}
                  />
                ) : (
                  <FastImage
                    source={{
                      uri: getYouTubeThumbnailUrl(eventDetails.videoUri) || '',
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={{width: '100%', height: '100%'}}
                    resizeMode={FastImage.resizeMode.cover}
                    defaultSource={ImagePath.no_image}
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
                thumbnailUri={
                  typeof eventDetails.thumbnailUri === 'object' && eventDetails.thumbnailUri?.uri
                    ? eventDetails.thumbnailUri.uri
                    : undefined
                }
                thumbnailSource={
                  typeof eventDetails.thumbnailUri === 'number'
                    ? eventDetails.thumbnailUri
                    : undefined
                }
                videoUri={eventDetails.videoUri}
                title={eventDetails.title}
              />
            )}
          </View>
        ) : (
          // Banner Image Section - Show when video is not available
          eventDetails.images && eventDetails.images.length > 0 && (
            <View style={dynamicStyles.videoContainer}>
              <TouchableOpacity
                style={dynamicStyles.mainImageContainer}
                onPress={() => handleImagePress(0)}
                activeOpacity={0.7}>
                {typeof eventDetails.images[0] === 'object' && eventDetails.images[0]?.uri && typeof eventDetails.images[0].uri === 'string' ? (
                  <FastImage
                    source={{
                      uri: eventDetails.images[0].uri,
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={{width: '100%', height: '100%'}}
                    resizeMode={FastImage.resizeMode.cover}
                    defaultSource={ImagePath.no_image}
                  />
                ) : typeof eventDetails.thumbnailUri === 'object' && eventDetails.thumbnailUri?.uri && typeof eventDetails.thumbnailUri.uri === 'string' ? (
                  <FastImage
                    source={{
                      uri: eventDetails.thumbnailUri.uri,
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={{width: '100%', height: '100%'}}
                    resizeMode={FastImage.resizeMode.cover}
                    defaultSource={ImagePath.no_image}
                  />
                ) : (
                  <Image
                    source={
                      typeof eventDetails.thumbnailUri === 'number'
                        ? eventDetails.thumbnailUri
                        : eventDetails.images[0] || ImagePath.no_image
                    }
                    style={{width: '100%', height: '100%'}}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            </View>
          )
        )}

          {/* Thumbnails Row - Show only first 3, with "+ X more" if more exist */}
          {/* Show thumbnails: if video exists show when 1+ images, if no video show when 2+ images */}
          {((eventDetails.videoUri && eventDetails.videoUri.trim() !== '' && previewImages.length > 0) || 
            ((!eventDetails.videoUri || eventDetails.videoUri.trim() === '') && previewImages.length > 1)) && (
            <View style={dynamicStyles.thumbnailRow}>
              {previewImages.slice(0, 3).map((img: ImageItem, index: number) => {
                const remainingCount = previewImages.length - 3;
                const showMoreOverlay = index === 2 && remainingCount > 0;
                // When there's a video and only 1 image, use same size as multiple images
                const hasVideoAndSingleImage = eventDetails.videoUri && eventDetails.videoUri.trim() !== '' && previewImages.length === 1;
                const thumbnailWidth = hasVideoAndSingleImage 
                  ? ((screenWidth - moderateScale(32)) - (moderateScale(8) * 2)) / 3 
                  : undefined;
                const thumbnailStyle = hasVideoAndSingleImage
                  ? [dynamicStyles.thumbnail, {flex: undefined, width: thumbnailWidth}]
                  : dynamicStyles.thumbnail;

                return (
                  <TouchableOpacity
                    key={img.id || index}
                    style={thumbnailStyle}
                    onPress={() => handleImagePress(index)}
                    activeOpacity={0.7}>
                    {img.uri && typeof img.uri === 'string' ? (
                      <>
                        <FastImage
                          source={{
                            uri: img.uri,
                            priority: FastImage.priority.normal,
                            cache: FastImage.cacheControl.immutable,
                          }}
                          style={dynamicStyles.thumbnailImage}
                          resizeMode={FastImage.resizeMode.cover}
                          defaultSource={ImagePath.no_image}
                        />
                        {showMoreOverlay && (
                          <View style={dynamicStyles.thumbnailMore}>
                            <Text style={dynamicStyles.thumbnailMoreText}>
                              + {remainingCount} more
                            </Text>
                          </View>
                        )}
                      </>
                    ) : img.source ? (
                      <>
                        <Image
                          source={img.source}
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
        {/* </View> */}

        {/* Event Details Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.eventTitle}>
            {eventDetails.title || params?.title || 'Event'}
          </Text>

          {/* Date/Time */}
          <View style={dynamicStyles.eventInfoRow}>
            <Ionicons
              name="calendar-outline"
              size={moderateScale(18)}
              color={colors.textSecondary}
            />
            <Text style={dynamicStyles.eventInfoText}>
              {params?.date || eventDetails.date}
            </Text>
          </View>

          {/* Location */}
          <View style={dynamicStyles.eventInfoRow}>
            <Ionicons
              name="location-outline"
              size={moderateScale(18)}
              color={colors.textSecondary}
            />
            <Text style={dynamicStyles.eventInfoText}>
              {params?.location || eventDetails.location}
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
                {t('events.textToSpeech')}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={dynamicStyles.descriptionText}>
            {params?.description || eventDetails.fullDescription}
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

      {/* Contact Us Modal */}
      <ContactUsModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        tollFreeNumber={eventDetails?.tollFreeNumber || '1800 212 2129'}
        whatsappNumber={eventDetails?.whatsappNumber || '919099433133'}
        whatsappMessage={eventDetails?.whatsappMessage || ''}
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

