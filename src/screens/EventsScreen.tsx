import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {ImagePath} from '../assets/images';
import {SCREEN_NAMES} from '../constants/screenNames';

// Mock event data
const events = [
  {
    id: '1',
    title: 'Captain tractor national',
    location: 'Udaipur, rajasthan',
    date: '9th Sep, 2025 to 10th Sep, 2025',
    imageUri: ImagePath.eventImage, // Will use placeholder
  },
  {
    id: '2',
    title: 'Little master 250 launch',
    location: 'Dy patil stadium, Mumbai',
    date: '10:30 am, 15 Sept 2025',
    imageUri: ImagePath.eventImage2, // Will use placeholder
  },
  {
    id: '3',
    title: 'Little master 250 launch',
    location: 'Dy patil stadium, Mumbai',
    date: '10:30 am, 15 Sept 2025',
    imageUri: ImagePath.eventImage2,
  },
  {
    id: '4',
    title: 'Little master 250 launch',
    location: 'Dy patil stadium, Mumbai',
    date: '10:30 am, 15 Sept 2025',
    imageUri: ImagePath.eventImage,
  },
  {
    id: '5',
    title: 'Little master 250 launch',
    location: 'Dy patil stadium, Mumbai',
    date: '10:30 am, 15 Sept 2025',
    imageUri: ImagePath.eventImage2,
  },
];

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call - replace with actual API call when available
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

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
          backgroundColor: colors.backgroundLight,
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
          paddingBottom: moderateScale(16),
        },
        title: {
          ...Typography.boldXxl,
          fontSize: moderateScale(24),
          color: colors.textPrimary,
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingTop: moderateScale(16),
        },
        eventCard: {
          flexDirection: 'row',
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(12),
          marginBottom: moderateScale(16),
          shadowColor: colors.shadowColor,
          shadowOffset: {width: 0, height: moderateScale(2)},
          shadowOpacity: 0.05,
          shadowRadius: moderateScale(4),
          elevation: 2,
          overflow: 'hidden',
        },
        eventImage: {
          width: moderateScale(80),
          height: moderateScale(80),
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          marginRight: moderateScale(12),
        },
        eventImagePlaceholder: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        eventImagePlaceholderText: {
          ...Typography.regularSm,
          fontSize: moderateScale(10),
          color: colors.textTertiary,
          textAlign: 'center',
        },
        eventContent: {
          flex: 1,
          flexShrink: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        eventTitle: {
          ...Typography.boldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginBottom: moderateScale(8),
        },
        eventLocation: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(6),
          flexShrink: 1,
        },
        eventLocationText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
          marginLeft: moderateScale(6),
          flex: 1,
          flexShrink: 1,
        },
        eventDate: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: moderateScale(8),
          paddingHorizontal: moderateScale(10),
          paddingVertical: moderateScale(6),
          alignSelf: 'flex-start',
          marginTop: moderateScale(4),
          maxWidth: '100%',
          flexShrink: 1,
          shadowColor: colors.primary,
          shadowOffset: {
            width: 0,
            height: moderateScale(2),
          },
          shadowOpacity: 0.15,
          shadowRadius: moderateScale(4),
          elevation: 3,
          overflow: 'hidden',
        },
        eventDateText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.primary,
          marginLeft: moderateScale(6),
          flexShrink: 1,
          minWidth: 0,
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Events</Text>
      </View>

      {/* Events List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {events.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={dynamicStyles.eventCard}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate(SCREEN_NAMES.EventDetails as never, {
                eventId: event.id,
                title: event.title,
                location: event.location,
                date: event.date,
                fromScreen: 'List',
              } as never);
            }}>
            {/* Event Image */}
            <View style={dynamicStyles.eventImage}>
              {event.imageUri ? (
                <Image
                  source={event.imageUri}
                  style={dynamicStyles.eventImagePlaceholder}
                  resizeMode="cover"
                />
              ) : (
                <View style={dynamicStyles.eventImagePlaceholder}>
                  <Text style={dynamicStyles.eventImagePlaceholderText}>
                    Event Image
                  </Text>
                </View>
              )}
            </View>

            {/* Event Content */}
            <View style={dynamicStyles.eventContent}>
              <Text style={dynamicStyles.eventTitle} numberOfLines={2}>
                {event.title}
              </Text>

              {/* Location */}
              <View style={dynamicStyles.eventLocation}>
                <Ionicons
                  name="location-outline"
                  size={moderateScale(16)}
                  color={colors.textSecondary}
                />
                <Text style={dynamicStyles.eventLocationText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>

              {/* Date/Time */}
              <LinearGradient
                colors={[colors.light_orange,colors.white]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={dynamicStyles.eventDate}>
                <Ionicons
                  name="calendar"
                  size={moderateScale(16)}
                  color={colors.primary}
                />
                <Text style={dynamicStyles.eventDateText} numberOfLines={1}>
                  {event.date}
                </Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
