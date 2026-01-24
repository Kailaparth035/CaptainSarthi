import React, {useMemo, useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  BackHandler,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import LinearGradient from 'react-native-linear-gradient';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {FarmerTabParamList} from '../navigation/FarmerTabNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {ImagePath} from '../assets/images';
import {SCREEN_NAMES} from '../constants/screenNames';
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {getFarmerProfileData} from '../utils/session';
import {useLanguage} from '../contexts/LanguageContext';
import {isYouTubeUrl, getYouTubeThumbnailUrl} from '../utils/youtubeUtils';

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', {month: 'short'});
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  } catch (error) {
    return dateString;
  }
};

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const {currentLanguage, t} = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [rawEvents, setRawEvents] = useState<any[]>([]); // Store raw events for language re-transformation

  // Helper function to transform events with language-specific titles
  const transformEventsWithLanguage = useCallback((eventsArray: any[], language: string) => {
    // Transform API events to match UI structure
    return eventsArray.map((event: any) => {
      // Check for video URL - prioritize YouTube thumbnail if video is YouTube
      let videoUrl = '';
      if (event.media?.cover_video?.video_url) {
        videoUrl = event.media.cover_video.video_url;
      } else if (event.video_url || event.videoUrl) {
        videoUrl = event.video_url || event.videoUrl;
      }
      
      // Use YouTube thumbnail if video is YouTube, otherwise use image_url
      let imageUrl = null;
      if (videoUrl && isYouTubeUrl(videoUrl)) {
        const youtubeThumbnail = getYouTubeThumbnailUrl(videoUrl, 'maxresdefault');
        imageUrl = youtubeThumbnail;
      } else if (event.image_url) {
        // Handle JSON string format (current API) or array format (future API)
        let imageUrls: string[] = [];
        if (typeof event.image_url === 'string' && event.image_url.trim().startsWith('[')) {
          // Parse JSON string to array
          try {
            const parsedUrls = JSON.parse(event.image_url);
            if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
              imageUrls = parsedUrls;
            } else {
              imageUrls = [event.image_url];
            }
          } catch (e) {
            console.warn('[EventsScreen] Failed to parse image_url JSON:', e);
            imageUrls = [event.image_url];
          }
        } else if (Array.isArray(event.image_url)) {
          // Future API format: already an array
          imageUrls = event.image_url;
        } else {
          // Single string URL
          imageUrls = [event.image_url];
        }
        // Use first image from the array
        if (imageUrls.length > 0) {
          imageUrl = getImageUrl(imageUrls[0]);
        }
      }
      
      // Only use default thumbnail if no video URL or image URL
      const imageUri = imageUrl ? {uri: imageUrl} : (videoUrl ? undefined : ImagePath.eventImage);
      
      // Handle language-specific title
      // Map language code to language_id (en -> 1, hi -> 2, gu -> 3)
      const languageIdMap: Record<string, number> = {
        'en': 1,
        'hi': 2,
        'gu': 3,
      };
      const currentLanguageId = languageIdMap[language] || 1;
      
      // Check if languages array exists and find matching language
      let displayTitle = event.title || 'Event';
      if (event.languages && Array.isArray(event.languages) && event.languages.length > 0) {
        const languageSpecificContent = event.languages.find(
          (lang: any) => lang.language_id === currentLanguageId
        );
        // Use language-specific title if found, otherwise use default title
        if (languageSpecificContent?.title) {
          displayTitle = languageSpecificContent.title;
        } else if (!event.title) {
          // Fallback to English if no title found for selected language
          const englishContent = event.languages.find(
            (lang: any) => lang.language_id === 1
          );
          if (englishContent?.title) {
            displayTitle = englishContent.title;
          }
        }
      }
      
      // Handle location - prefer full_address, then event_venue, then construct from location object
      let location = 'Location not specified';
      if (event.location?.full_address) {
        location = event.location.full_address;
      } else if (event.location?.city && event.location?.state) {
        location = `${event.location.city}, ${event.location.state}`;
      } else if (event.event_venue) {
        location = event.event_venue;
      } else if (event.location) {
        location = event.location;
      } else if (event.venue) {
        location = event.venue;
      }
      
      // Handle date - prefer display_date, otherwise format from start_date/end_date
      let date = '';
      if (event.display_date) {
        date = event.display_date;
      } else if (event.start_date && event.end_date) {
        // Format date range
        const startDate = formatDate(event.start_date);
        const endDate = formatDate(event.end_date);
        date = `${startDate} to ${endDate}`;
      } else if (event.start_date) {
        date = formatDate(event.start_date);
      } else if (event.event_date) {
        date = formatDate(event.event_date);
      } else if (event.publish_date) {
        date = formatDate(event.publish_date);
      } else if (event.date) {
        date = formatDate(event.date);
      }
      
      return {
        id: event.event_id || event.id || String(Math.random()),
        title: displayTitle,
        location: location,
        date: date,
        imageUri: imageUri,
      };
    });
  }, []);

  // Fetch events from API
  const fetchEvents = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get stored farmer profile data to extract location details
      const profileData = await getFarmerProfileData();
      const locationDetails = profileData?.location_details || {};
      
      console.log('[EventsScreen] Profile data:', profileData);
      console.log('[EventsScreen] Location details:', locationDetails);
      
      // Build query parameters in correct order: state, district, village, category
      // Format: state=1&district=2&village=3&category=1
      // const queryParams: any = {};
      let urlParams;

      
      // Add state parameter (first)
      if (locationDetails.state_id) {
        // queryParams.state = String(locationDetails.state_id);
        urlParams =`?state=${locationDetails.state_id}`
      }
      
      // Add district parameter (second)
      if (locationDetails.district_id) {
        // queryParams.district = String(locationDetails.district_id);
        urlParams= urlParams + `&district=${locationDetails.district_id}`
      }
      
      // Add village parameter (third)
      if (locationDetails.village_id) {
        // queryParams.village = String(locationDetails.village_id);
        urlParams=urlParams + `&village=${locationDetails.village_id}`
      }
      
      // Add category parameter (fourth)
      if (locationDetails.category_id) {
        // queryParams.category = String(locationDetails.category_id);
        urlParams=urlParams +`&category=${locationDetails.category_id}`
      }
      
      console.log('[EventsScreen] Query parameters (ordered):', urlParams);
      
      // Always use events by location API when we have profile data
      // Use location API if we have any location parameters, otherwise use regular API
      const apiEndpoint =  Apis.FARMER_EVENTS_BY_LOCATION + urlParams;
      console.log('[EventsScreen] API Endpoint:', apiEndpoint);
      
      const response = await getData(apiEndpoint);
      
      console.log('[EventsScreen] Events API Response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        // Check if data has events array (new structure) or is directly an array
        const eventsArray = response.data.events || 
                           response.data.list ||
                           (Array.isArray(response.data) ? response.data : []);
        
        console.log('[EventsScreen] Events array extracted:', eventsArray?.length || 0, 'events');
        
        if (Array.isArray(eventsArray) && eventsArray.length > 0) {
          // Store raw events for language re-transformation
          setRawEvents(eventsArray);
          
          // Transform events with current language
          const transformedEvents = transformEventsWithLanguage(eventsArray, currentLanguage);
          
          setEvents(transformedEvents);
        } else {
          console.warn('[EventsScreen] No events found in response');
          setEvents([]);
          setRawEvents([]);
        }
      } else {
        console.warn('[EventsScreen] Unexpected API response format:', response);
        setEvents([]);
        setRawEvents([]);
      }
    } catch (error) {
      console.error('[EventsScreen] Error fetching events:', error);
      setEvents([]);
      setRawEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [transformEventsWithLanguage, currentLanguage]);

  // Re-transform events when language changes (if events are already loaded)
  useEffect(() => {
    if (rawEvents.length > 0) {
      const transformedEvents = transformEventsWithLanguage(rawEvents, currentLanguage);
      setEvents(transformedEvents);
    }
  }, [currentLanguage, rawEvents, transformEventsWithLanguage]);

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchEvents(true);
  }, [fetchEvents]);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle back button - navigate to Home tab
  useFocusEffect(
    React.useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        tabNavigation.navigate(SCREEN_NAMES.Home);
        return true;
      });

      return () => backHandler.remove();
    }, [tabNavigation])
  );

  // Re-transform events when language changes (if events are already loaded)
  useEffect(() => {
    if (events.length > 0) {
      // Re-fetch to get fresh data with current language transformation
      fetchEvents();
    }
  }, [currentLanguage]);

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

  // Skeleton component for event cards - matches exact design
  const renderSkeleton = () => {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}>
        <SkeletonPlaceholder
          backgroundColor={colors.backgroundGray}
          highlightColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}>
          {[1, 2, 3, 4, 5].map((index) => (
            <View key={index} style={dynamicStyles.eventCard}>
              {/* Skeleton Image - matches eventImage style */}
              <SkeletonPlaceholder.Item
                width={moderateScale(80)}
                height={moderateScale(80)}
                borderRadius={moderateScale(8)}
                marginRight={moderateScale(12)}
              />
              {/* Skeleton Content - matches eventContent style */}
              <View style={{flex: 1, justifyContent: 'center', minWidth: 0}}>
                {/* Skeleton Title - matches eventTitle (2 lines, fontSize 16) */}
                <SkeletonPlaceholder.Item
                  width="95%"
                  height={moderateScale(16)}
                  borderRadius={moderateScale(2)}
                  marginBottom={moderateScale(8)}
                />
                <SkeletonPlaceholder.Item
                  width="75%"
                  height={moderateScale(16)}
                  borderRadius={moderateScale(2)}
                  marginBottom={moderateScale(8)}
                />
                {/* Skeleton Location - matches eventLocation with icon */}
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(6)}}>
                  {/* Icon placeholder */}
                  <SkeletonPlaceholder.Item
                    width={moderateScale(16)}
                    height={moderateScale(16)}
                    borderRadius={moderateScale(8)}
                    marginRight={moderateScale(6)}
                  />
                  {/* Location text */}
                  <SkeletonPlaceholder.Item
                    width="70%"
                    height={moderateScale(14)}
                    borderRadius={moderateScale(2)}
                  />
                </View>
                {/* Skeleton Date Badge - matches eventDate style with gradient look */}
                <SkeletonPlaceholder.Item
                  width="55%"
                  height={moderateScale(28)}
                  borderRadius={moderateScale(8)}
                  marginTop={moderateScale(4)}
                />
              </View>
            </View>
          ))}
        </SkeletonPlaceholder>
      </ScrollView>
    );
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>{t('events.title')}</Text>
      </View>

      {/* Events List */}
      {loading ? (
        renderSkeleton()
      ) : (
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
          {refreshing && events.length > 0 ? (
            <View style={dynamicStyles.scrollContent}>
              <SkeletonPlaceholder
                backgroundColor={colors.backgroundGray}
                highlightColor={colors.backgroundWhite}
                borderRadius={moderateScale(12)}>
                {[1, 2, 3, 4, 5].map((index) => (
                  <View key={index} style={dynamicStyles.eventCard}>
                    {/* Skeleton Image */}
                    <SkeletonPlaceholder.Item
                      width={moderateScale(80)}
                      height={moderateScale(80)}
                      borderRadius={moderateScale(8)}
                      marginRight={moderateScale(12)}
                    />
                    {/* Skeleton Content */}
                    <View style={{flex: 1, justifyContent: 'center', minWidth: 0}}>
                      {/* Skeleton Title */}
                      <SkeletonPlaceholder.Item
                        width="95%"
                        height={moderateScale(16)}
                        borderRadius={moderateScale(2)}
                        marginBottom={moderateScale(8)}
                      />
                      <SkeletonPlaceholder.Item
                        width="75%"
                        height={moderateScale(16)}
                        borderRadius={moderateScale(2)}
                        marginBottom={moderateScale(8)}
                      />
                      {/* Skeleton Location with icon */}
                      <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(6)}}>
                        <SkeletonPlaceholder.Item
                          width={moderateScale(16)}
                          height={moderateScale(16)}
                          borderRadius={moderateScale(8)}
                          marginRight={moderateScale(6)}
                        />
                        <SkeletonPlaceholder.Item
                          width="70%"
                          height={moderateScale(14)}
                          borderRadius={moderateScale(2)}
                        />
                      </View>
                      {/* Skeleton Date Badge */}
                      <SkeletonPlaceholder.Item
                        width="55%"
                        height={moderateScale(28)}
                        borderRadius={moderateScale(8)}
                        marginTop={moderateScale(4)}
                      />
                    </View>
                  </View>
                ))}
              </SkeletonPlaceholder>
            </View>
          ) : events.length === 0 ? (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: moderateScale(100), paddingBottom: moderateScale(50)}}>
              <Image 
                source={ImagePath.noEvent} 
                style={{
                  width: moderateScale(200),
                  height: moderateScale(200),
                  resizeMode: 'contain',
                  marginBottom: moderateScale(20),
                }}
              />
              <Text style={[Typography.boldXl, {color: colors.textPrimary, fontSize: moderateScale(20)}]}>
                {t('events.noEventsFound')}
              </Text>
            </View>
          ) : (
            events.map((event) => (
          <TouchableOpacity
            key={event.id}
            style={dynamicStyles.eventCard}
            activeOpacity={0.7}
            onPress={() => {
              (navigation as any).navigate(SCREEN_NAMES.EventDetails, {
                eventId: event.id,
                title: event.title,
                location: event.location,
                date: event.date,
                fromScreen: 'List',
              });
            }}>
            {/* Event Image */}
            <View style={dynamicStyles.eventImage}>
              {event.imageUri ? (
                typeof event.imageUri === 'object' && event.imageUri?.uri && typeof event.imageUri.uri === 'string' ? (
                  <FastImage
                    source={{
                      uri: event.imageUri.uri,
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={dynamicStyles.eventImagePlaceholder}
                    resizeMode={FastImage.resizeMode.cover}
                    defaultSource={ImagePath.eventImage}
                  />
                ) : typeof event.imageUri === 'string' ? (
                  <FastImage
                    source={{
                      uri: event.imageUri,
                      priority: FastImage.priority.normal,
                      cache: FastImage.cacheControl.immutable,
                    }}
                    style={dynamicStyles.eventImagePlaceholder}
                    resizeMode={FastImage.resizeMode.cover}
                    defaultSource={ImagePath.eventImage}
                  />
                ) : (
                  <Image
                    source={event.imageUri}
                    style={dynamicStyles.eventImagePlaceholder}
                    resizeMode="cover"
                  />
                )
              ) : null}
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
          )}
        </ScrollView>
      )}
    </View>
  );
}
