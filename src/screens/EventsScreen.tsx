import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {SCREEN_NAMES} from '../constants/screenNames';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';

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

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Fetch events from API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await getData(Apis.FARMER_EVENTS, {});
        
        if (response?.status === true && Array.isArray(response?.data)) {
          // Transform API response to match expected format
          const transformedEvents = response.data.map((event: any) => ({
            id: event.id?.toString() || '',
            title: event.title || '',
            location: event.location || event.event_venue || '',
            date: formatEventDate(
              event.event_date,
              event.end_date,
              event.start_time,
              event.end_time
            ),
            imageUri: getImageUrl(event.image) ? {uri: getImageUrl(event.image)} : null,
            // Additional fields for EventDetails screen
            description: event.description || '',
            event_date: event.event_date,
            end_date: event.end_date,
            start_time: event.start_time,
            end_time: event.end_time,
            event_venue: event.event_venue,
            video_url: event.video_url,
            whatsapp_message: event.whatsapp_message,
            contact_numbers: event.contact_numbers || [],
            image: event.image,
          }));
          setEvents(transformedEvents);
        } else if (Array.isArray(response)) {
          // Fallback: if response is directly an array
          const transformedEvents = response.map((event: any) => ({
            id: event.id?.toString() || '',
            title: event.title || '',
            location: event.location || event.event_venue || '',
            date: formatEventDate(
              event.event_date,
              event.end_date,
              event.start_time,
              event.end_time
            ),
            imageUri: getImageUrl(event.image) ? {uri: getImageUrl(event.image)} : null,
            description: event.description || '',
            event_date: event.event_date,
            end_date: event.end_date,
            start_time: event.start_time,
            end_time: event.end_time,
            event_venue: event.event_venue,
            video_url: event.video_url,
            whatsapp_message: event.whatsapp_message,
            contact_numbers: event.contact_numbers || [],
            image: event.image,
          }));
          setEvents(transformedEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        header: {
          backgroundColor: colors.backgroundWhite,
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(16),
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
          justifyContent: 'center',
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
        },
        eventLocationText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
          marginLeft: moderateScale(6),
        },
        eventDate: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: moderateScale(8),
          paddingHorizontal: moderateScale(10),
          paddingVertical: moderateScale(6),
          alignSelf: 'flex-start',
          marginTop: moderateScale(4),
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
      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: moderateScale(20)}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.scrollContent}>
          {events.length > 0 ? (
            events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={dynamicStyles.eventCard}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate(SCREEN_NAMES.EventDetails as never, {
                    eventId: event.id,
                    title: event.title,
                    location: event.location || event.event_venue,
                    date: event.date,
                    description: event.description,
                    event_date: event.event_date,
                    end_date: event.end_date,
                    start_time: event.start_time,
                    end_time: event.end_time,
                    event_venue: event.event_venue,
                    video_url: event.video_url,
                    whatsapp_message: event.whatsapp_message,
                    contact_numbers: event.contact_numbers,
                    image: event.image,
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
            ))
          ) : (
            <View style={{padding: moderateScale(20), alignItems: 'center'}}>
              <Text style={[Typography.regularMd, {color: colors.textSecondary}]}>
                No events found
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
