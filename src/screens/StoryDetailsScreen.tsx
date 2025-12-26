import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
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
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useStatusBar} from '../contexts/StatusBarContext';
import {useTTS} from '../contexts/TTSContext';
import {ImagePath} from '../assets/images';

type StoryDetailsRouteParams = {
  storyId: string;
  title?: string;
  date?: string;
  description?: string;
  videoUri?: string;
  images?: string[];
  fromScreen?: 'Home' | 'List';
};

// Mock story data
const getStoryDetails = (storyId: string) => {
  const defaultData = {
    id: storyId,
    title: 'Tractor Horsepower Guide: Find the Best Fit for Your Farm Work',
    date: '10 November 2025',
    description:
      'Choosing the right tractor horsepower is crucial for efficient farming operations. The horsepower of a tractor determines its ability to handle various farming tasks, from plowing and tilling to harvesting and transportation.',
    fullDescription:
      'Choosing the right tractor horsepower is crucial for efficient farming operations. The horsepower of a tractor determines its ability to handle various farming tasks, from plowing and tilling to harvesting and transportation.\n\nCaptain Tractors proudly organized its National Dealer Meet 2025 on the 9th and 10th of September in the royal city of Udaipur, Rajasthan. This grand assembly brought together over 175+ of our valued dealer partners from every corner of India, celebrating the strength, trust, and growth of the Captain Tractors family.\n\nThe first day was a vibrant celebration. Dealers were welcomed with traditional Rajasthani hospitality, creating a festive atmosphere. An unforgettable evening of folk dance, music, and cultural performances perfectly embodied the event\'s theme, \'Chhalaang\', binding the Captain family in a shared spirit of unity and enthusiasm.\n\nWhen selecting a tractor, consider factors such as field size, soil type, and the specific tasks you need to perform. Smaller farms may benefit from 12-20 HP tractors, while larger operations might require 25-35 HP or more for heavy-duty work.',
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

export default function StoryDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const route = useRoute();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const params = route.params as StoryDetailsRouteParams;
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const {playTTS, state: ttsState} = useTTS();

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call - replace with actual API call when available
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const storyDetails = useMemo(
    () => getStoryDetails(params?.storyId || '1'),
    [params?.storyId],
  );

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
          marginBottom: moderateScale(8),
          borderRadius: moderateScale(10),
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        thumbnailContainer: {
          flexDirection: 'row',
          gap: moderateScale(8),
          marginTop: moderateScale(8),
          height: moderateScale(128),
        },
        thumbnailLeft: {
          flex: 1.8,
          borderRadius: moderateScale(8),
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        thumbnailRight: {
          flex: 1,
          gap: moderateScale(8),
          justifyContent: 'space-between',
        },
        thumbnail: {
          borderRadius: moderateScale(8),
          backgroundColor: 'transparent',
          overflow: 'hidden',
        },
        thumbnailImage: {
          width: '100%',
          height: moderateScale(60),
          borderRadius: moderateScale(8),
        },
        thumbnailLeftImage: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(8),
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
        storyTitle: {
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
          marginBottom: moderateScale(12),
        },
        dateContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        dateText: {
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
          backgroundColor: colors.light_orange,
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(10),
          borderRadius: moderateScale(20),
          alignSelf: 'flex-start',
          marginBottom: moderateScale(16),
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.primary,
        },
        textToSpeechButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.primary,
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
    storyDetails.images?.forEach((img, index) => {
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
  }, [storyDetails.images]);

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

  const handleTextToSpeech = async () => {
    const descriptionText = params?.description || storyDetails.fullDescription;
    await playTTS(descriptionText);
  };

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const {currentConfig} = useStatusBar();

  return (
    <View style={dynamicStyles.container}>
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
        <Text style={dynamicStyles.headerTitle}>Story detail</Text>
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
        {/* Video Player Section */}
        {/* <View style={dynamicStyles.card}> */}
          <View style={dynamicStyles.videoContainer}>
            <VideoPlayer
              thumbnailUri={undefined}
              thumbnailSource={storyDetails.thumbnailUri}
              videoUri={storyDetails.videoUri}
              title={storyDetails.title}
            />
          </View>

          {/* Thumbnails Grid - Left: Full height, Right: 2 stacked */}
          <View style={dynamicStyles.thumbnailContainer}>
            {/* Left: Full height image */}
            {storyDetails.images && storyDetails.images.length > 0 && (
              <TouchableOpacity
                style={dynamicStyles.thumbnailLeft}
                onPress={() => handleImagePress(0)}
                activeOpacity={0.7}>
                <Image
                  source={storyDetails.images[0] || ImagePath.eventImage}
                  style={dynamicStyles.thumbnailLeftImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}

            {/* Right: 2 stacked images */}
            <View style={dynamicStyles.thumbnailRight}>
              {storyDetails.images?.slice(1, 3).map((image, index) => (
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
                  {index === 1 && storyDetails.images && storyDetails.images.length > 3 && (
                    <View style={dynamicStyles.thumbnailMore}>
                      <Text style={dynamicStyles.thumbnailMoreText}>
                        + {storyDetails.images.length - 3} more
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        {/* </View> */}

        {/* Story Title and Date Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.storyTitle}>
            {params?.title || storyDetails.title}
          </Text>

          {/* Date */}
          <View style={dynamicStyles.dateContainer}>
            <Ionicons
              name="calendar-outline"
              size={moderateScale(18)}
              color={colors.textSecondary}
            />
            <Text style={dynamicStyles.dateText}>
              {params?.date || storyDetails.date}
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
                Text to speech
              </Text>
            </TouchableOpacity>
          )}

          <Text style={dynamicStyles.descriptionText}>
            {params?.description || storyDetails.fullDescription}
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
    </View>
  );
}

