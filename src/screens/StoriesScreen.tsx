import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {ImagePath} from '../assets/images';
import {useNavigation} from '@react-navigation/native';
import {SCREEN_NAMES} from '../constants/screenNames';

// Mock stories data
const storiesData = [
  {
    id: '1',
    title: 'Tractor Horsepower Guide: Find the Best Fit for Your Farm Work',
    shortTitle: 'Tractor Horsepower Guide: Find the be...',
    date: '10 November 2025',
    bannerImage: ImagePath.farmerTractor,
    logo: ImagePath.captainEnglishLogo,
    overlayText: '12 HP Tractor TO 28 HP Tractor',
  },
  {
    id: '2',
    title: 'Tractor Horsepower Guide: Find the Best Fit for Your Farm Work',
    shortTitle: 'Tractor Horsepower Guide: Find the be...',
    date: '10 November 2025',
    bannerImage: ImagePath.farmerTractor,
    logo: ImagePath.captainEnglishLogo,
    overlayText: '12 HP Tractor TO 28 HP Tractor',
  },
  {
    id: '3',
    title: 'Tractor Horsepower Guide: Find the Best Fit for Your Farm Work',
    shortTitle: 'Tractor Horsepower Guide: Find the be...',
    date: '10 November 2025',
    bannerImage: ImagePath.farmerTractor,
    logo: ImagePath.captainEnglishLogo,
    overlayText: '12 HP Tractor TO 28 HP Tractor',
  },
];

export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();

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
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top ,
        },
        title: {
          ...Typography.boldXxl,
          fontSize: moderateScale(24),
          color: colors.textPrimary,
          marginBottom: moderateScale(24),
        },
        storyCard: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          marginBottom: moderateScale(16),
          overflow: 'hidden',
          shadowColor: colors.shadowColor,
          shadowOffset: {width: 0, height: moderateScale(2)},
          shadowOpacity: 0.05,
          shadowRadius: moderateScale(4),
          elevation: 2,
        },
        bannerContainer: {
          flexDirection: 'row',
          height: moderateScale(170),
          overflow: 'hidden',
          marginHorizontal:moderateScale(10),
          marginTop:moderateScale(10),
          backgroundColor: colors.grey,
          borderRadius:moderateScale(10)
        },
        bannerLeft: {
          flex: 1,
          backgroundColor:colors.grey, // Light beige/off-white
          padding: moderateScale(13),
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        },
        logo: {
          width: moderateScale(32),
          height: moderateScale(32),
          resizeMode: 'contain',
        },
        mainTitle: {
          ...Typography.boldXl,
          fontSize: moderateScale(14),
          color: '#1667c6', // Dark blue
          lineHeight: moderateScale(18),
          marginBottom: moderateScale(6),
        },
        subtitle: {
          ...Typography.boldMd,
          fontSize: moderateScale(12),
          color: colors.primaryDark, // Orange
          lineHeight: moderateScale(16),
          // marginBottom: moderateScale(12),
        },
        arrowButton: {
          width: moderateScale(60),
          height: moderateScale(20),
          borderWidth: 1,
          borderColor: colors.textPrimary,
          borderRadius: moderateScale(4),
          alignItems: 'center',
          justifyContent: 'center',
          // marginTop: 'auto',
        },
        bannerRight: {
          // flex: 1.4,
          position: 'relative',
        },
        bannerImage: {
          width: moderateScale(190),
          height: moderateScale(170),
          resizeMode: 'contain',
        },
        overlayText: {
          position: 'absolute',
          top: moderateScale(20),
          left: moderateScale(8),
          right: moderateScale(8),
          ...Typography.boldMd,
          fontSize: moderateScale(14),
          color: colors.primary,
          textAlign: 'center',
          lineHeight: moderateScale(16),
        },
        storyContent: {
          padding: moderateScale(16),
        },
        storyTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(8),
        },
        dateContainer: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        dateText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
          marginLeft: moderateScale(6),
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <View style={dynamicStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}>
        <Text style={dynamicStyles.title}>Stories</Text>

        {storiesData.map((story) => (
          <TouchableOpacity
            key={story.id}
            style={dynamicStyles.storyCard}
            activeOpacity={0.7}
            onPress={() => {
              (navigation as any).navigate(SCREEN_NAMES.StoryDetails, {
                storyId: story.id,
                title: story.title,
                date: story.date,
                bannerImage: story.bannerImage,
                images: [story.bannerImage, ImagePath.eventImage, ImagePath.eventImage2],
                fromScreen: 'List',
              });
            }}>
            {/* Banner Section */}
            <View style={dynamicStyles.bannerContainer}>
              {/* Left Section - Logo and Text */}
              <View style={dynamicStyles.bannerLeft}>
                <Image
                  source={story.logo}
                  style={dynamicStyles.logo}
                  resizeMode="contain"
                />
                <View style={{flex: 1,marginBottom:moderateScale(10)}}>
                  <Text style={dynamicStyles.mainTitle}>
                    Tractor{'\n'}Horsepower{'\n'}Guide:
                  </Text>
                  <Text style={dynamicStyles.subtitle}>
                    Find the Best Fit for{'\n'}Your Farm Work
                  </Text>
                </View>
                <View style={dynamicStyles.arrowButton}>
                  <Ionicons
                    name="arrow-forward"
                    size={moderateScale(16)}
                    color={colors.textPrimary}
                  />
                </View>
              </View>

              {/* Right Section - Image with Overlay */}
              <View style={dynamicStyles.bannerRight}>
                <Image
                  source={story.bannerImage}
                  style={dynamicStyles.bannerImage}
                  resizeMode="cover"
                />
                <Text style={dynamicStyles.overlayText}>
                  12 HP Tractor{'\n'}TO{'\n'}28 HP Tractor
                </Text>
              </View>
            </View>

            {/* Story Content */}
            <View style={dynamicStyles.storyContent}>
              <Text style={dynamicStyles.storyTitle} numberOfLines={1}>
                {story.shortTitle}
              </Text>
              <View style={dynamicStyles.dateContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={moderateScale(14)}
                  color={colors.textSecondary}
                />
                <Text style={dynamicStyles.dateText}>{story.date}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

