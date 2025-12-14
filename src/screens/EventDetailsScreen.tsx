import React, {useMemo, useState, useEffect} from 'react';
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
import ContactUsModal from '../components/ContactUsModal';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useStatusBar} from '../contexts/StatusBarContext';
import {useTTS} from '../contexts/TTSContext';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';

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

// Helper function to format date
const formatEventDate = (eventDate: string, endDate?: string, startTime?: string, endTime?: string): string => {
  if (!eventDate) return '';
  
  try {
    const startDate = new Date(eventDate);
    const day = startDate.getDate();
    const month = startDate.toLocaleString('default', {month: 'short'});
    const year = startDate.getFullYear();
    
    // Format time if available
    let timeStr = '';
    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) >= 12 ? 'pm' : 'am';
      timeStr = `${hour12}:${minutes} ${ampm}`;
    }
    
    // If end date exists and is different, show date range
    if (endDate && endDate !== eventDate.split('T')[0]) {
      const end = new Date(endDate);
      const endDay = end.getDate();
      const endMonth = end.toLocaleString('default', {month: 'short'});
      return `${day} ${month}, ${year} to ${endDay} ${endMonth}, ${year}`;
    }
    
    // Single date with time
    if (timeStr) {
      return `${timeStr}, ${day} ${month} ${year}`;
    }
    
    return `${day} ${month}, ${year}`;
  } catch (error) {
    return eventDate;
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

export default function EventDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const route = useRoute();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const params = route.params as EventDetailsRouteParams;
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const {playTTS, state: ttsState} = useTTS();
  const [eventDetails, setEventDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch event details from API using eventId
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const eventId = params?.eventId;
        
        if (!eventId) {
          console.error('No eventId provided');
          setLoading(false);
          return;
        }

        // Call API with eventId as query parameter
        const response = await getData(Apis.FARMER_EVENTS, { id: eventId });
        
        // Handle API response structure: { status: true, data: {...} }
        if (response?.status === true && response?.data) {
          const eventData = response.data;
          
          // Transform API response to match expected format
          setEventDetails({
            id: eventData.id?.toString() || '',
            title: eventData.title || '',
            location: eventData.location || eventData.event_venue || '',
            date: formatEventDate(
              eventData.event_date,
              eventData.end_date,
              eventData.start_time,
              eventData.end_time
            ),
            description: eventData.description || '',
            fullDescription: eventData.description || '',
            videoUri: eventData.video_url || null,
            thumbnailUri: getImageUrl(eventData.image) ? {uri: getImageUrl(eventData.image)} : null,
            image: getImageUrl(eventData.image),
            images: eventData.image ? [getImageUrl(eventData.image)].filter(Boolean) : [],
            event_date: eventData.event_date,
            end_date: eventData.end_date,
            start_time: eventData.start_time,
            end_time: eventData.end_time,
            event_venue: eventData.event_venue,
            whatsapp_message: eventData.whatsapp_message,
            contact_numbers: eventData.contact_numbers || [],
          });
        } else {
          console.warn('Unexpected API response format:', response);
          setEventDetails(null);
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        setEventDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [params?.eventId]);

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
          width: '98%',
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

  // Prepare images for preview modal from API data
  const previewImages: ImageItem[] = useMemo(() => {
    const images: ImageItem[] = [];
    
    if (!eventDetails) return images;
    
    // Main event image
    if (eventDetails.image) {
      images.push({
        id: 'main',
        uri: eventDetails.image,
      });
    }
    
    // Additional images if available
    if (eventDetails.images && eventDetails.images.length > 0) {
      eventDetails.images.forEach((img: string, index: number) => {
        if (img) {
          images.push({
            id: `img-${index}`,
            uri: img,
          });
        }
      });
    }
    
    return images;
  }, [eventDetails]);

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
    // Use contact number from API or default
    const contactNumber = eventDetails?.contact_numbers?.[0] || '919099433133';
    const phoneNumber = contactNumber.replace(/[^0-9]/g, ''); // Remove + and spaces
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
    const descriptionText = params?.description || eventDetails?.fullDescription || eventDetails?.description || '';
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
      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : eventDetails ? (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={dynamicStyles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Video Player Section */}
          <View style={dynamicStyles.card}>
            <View style={dynamicStyles.videoContainer}>
              <VideoPlayer
                thumbnailUri={eventDetails.image ? eventDetails.image : undefined}
                thumbnailSource={eventDetails.thumbnailUri}
                videoUri={eventDetails.videoUri}
                title={eventDetails.title}
              />
            </View>

            {/* Thumbnails Grid - Left: Full height, Right: 2 stacked */}
            {eventDetails.images && eventDetails.images.length > 0 && (
              <View style={dynamicStyles.thumbnailContainer}>
                {/* Left: Full height image */}
                <TouchableOpacity
                  style={dynamicStyles.thumbnailLeft}
                  onPress={() => handleImagePress(0)}
                  activeOpacity={0.7}>
                  <Image
                    source={{uri: eventDetails.images[0]}}
                    style={[dynamicStyles.thumbnailImage, {height: moderateScale(170)}]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>

                {/* Right: 2 stacked images */}
                <View style={dynamicStyles.thumbnailRight}>
                  {eventDetails.images.slice(1, 3).map((image: string, index: number) => (
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
                      {index === 1 && eventDetails.images && eventDetails.images.length > 3 && (
                        <View style={dynamicStyles.thumbnailMore}>
                          <Text style={dynamicStyles.thumbnailMoreText}>
                            + {eventDetails.images.length - 3} more
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Event Details Card */}
          <View style={dynamicStyles.card}>
            <Text style={dynamicStyles.eventTitle}>
              {params?.title || eventDetails.title}
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
            {params?.description || eventDetails.description || eventDetails.fullDescription || ''}
          </Text>
        </View>
        </ScrollView>
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: moderateScale(20)}}>
          <Text style={[Typography.regularMd, {color: colors.textSecondary}]}>
            No event details found
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

      {/* Contact Us Modal */}
      <ContactUsModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        tollFreeNumber={eventDetails?.contact_numbers?.[0] || "1800 212 2129"}
        whatsappNumber={eventDetails?.whatsapp_message ? eventDetails.contact_numbers?.[0]?.replace(/[^0-9]/g, '') : "919099433133"}
      />
    </View>
  );
}

