import React, {useMemo, useState} from 'react';
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
import {ImagePath} from '../assets/images';
import {useLanguage} from '../contexts/LanguageContext';

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
    videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUri: ImagePath.eventImage,
    images: [
      ImagePath.eventImage,
      ImagePath.eventImage2,
      ImagePath.eventImage,
      ImagePath.eventImage2,
    ],
  };

  return defaultData;
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

  const eventDetails = useMemo(
    () => getEventDetails(params?.eventId || '1'),
    [params?.eventId],
  );

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

  // Prepare images for preview modal
  const previewImages: ImageItem[] = useMemo(() => {
    const images: ImageItem[] = [];
    eventDetails.images?.forEach((img, index) => {
      // Check if img is a require() result (number) or a string URI
      if (typeof img === 'number') {
        images.push({
          id: `img-${index}`,
          source: img,
          placeholder: `Image ${index + 1}`,
        });
      } else {
        images.push({
          id: `img-${index}`,
          uri: img,
          placeholder: `Image ${index + 1}`,
        });
      }
    });
    return images;
  }, [eventDetails.images]);

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
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Video Player Section */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.videoContainer}>
            <VideoPlayer
              thumbnailUri={undefined}
              thumbnailSource={eventDetails.thumbnailUri}
              videoUri={eventDetails.videoUri}
              title={eventDetails.title}
            />
          </View>

          {/* Thumbnails Grid - Left: Full height, Right: 2 stacked */}
          <View style={dynamicStyles.thumbnailContainer}>
            {/* Left: Full height image */}
            {eventDetails.images && eventDetails.images.length > 0 && (
              <TouchableOpacity
                style={dynamicStyles.thumbnailLeft}
                onPress={() => handleImagePress(0)}
                activeOpacity={0.7}>
                <Image
                  source={eventDetails.images[0] || ImagePath.eventImage}
                  style={[dynamicStyles.thumbnailImage, {height: moderateScale(170)}]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {/* Right: 2 stacked images */}
            <View style={dynamicStyles.thumbnailRight}>
              {eventDetails.images?.slice(1, 3).map((image, index) => (
                <TouchableOpacity
                  key={index + 1}
                  style={[dynamicStyles.thumbnail]}
                  onPress={() => handleImagePress(index + 1)}
                  activeOpacity={0.7}>
                  <Image
                    source={image || ImagePath.eventImage}
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
            {params?.description || eventDetails.fullDescription}
          </Text>
        </View>
      </ScrollView>

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
        tollFreeNumber="1800 212 2129"
        whatsappNumber="919099433133"
      />
    </View>
  );
}

