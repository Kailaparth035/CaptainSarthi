import React, {useMemo, useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Modal,
  Pressable,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, CommonActions, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {FarmerTabParamList} from '../navigation/FarmerTabNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography, FontFamily} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import VideoPlayer from '../components/VideoPlayer';
import {SCREEN_NAMES} from '../constants/screenNames';
import {ImagePath} from '../assets/images';
import {Platform, ActivityIndicator, Linking} from 'react-native';
import {useLanguage} from '../contexts/LanguageContext';
import {getData, postData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {saveFarmerProfileData, FarmerProfileData, getFarmerProfileData} from '../utils/session';
import {isYouTubeUrl, getYouTubeThumbnailUrl, extractYouTubeVideoId} from '../utils/youtubeUtils';
import YoutubePlayer from 'react-native-youtube-iframe';

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString || typeof dateString !== 'string') return '';
  const trimmed = dateString.trim();
  if (!trimmed) return '';
  try {
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) return trimmed;
    const day = date.getDate();
    const month = date.toLocaleString('default', {month: 'short'});
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (error) {
    return trimmed;
  }
};

// Get display date from event object (tries all known API date fields)
const getEventDateDisplay = (event: any): string => {
  if (!event) return '';
  const raw =
    event.display_date ||
    event.display_datetime ||
    event.start_date ||
    event.event_date ||
    event.publish_date ||
    event.date ||
    event.end_date ||
    event.created_at ||
    '';
  if (typeof raw === 'string') return formatDate(raw);
  return '';
};

// Membership services will be created with translations in the component

export default function FarmerHomeScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale, deviceWidth: screenWidth, deviceHeight: screenHeight} =
    useDeviceMetrics();
  const {t, currentLanguage, currentLanguageId} = useLanguage();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const autoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcementCarouselRef = useRef<FlatList>(null);
  
  // API data states
  const [carouselItems, setCarouselItems] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [recentStories, setRecentStories] = useState<any[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmerName, setFarmerName] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [submittingEventId, setSubmittingEventId] = useState<string | number | null>(null);

  // Membership services with translations
  const membershipServices = useMemo(() => [
    {
      id: '1',
      imageName: ImagePath.prioritySupport,
      title: t('farmerHome.services.one.title'),
      description: t('farmerHome.services.one.description'),
    },
    {
      id: '2',
      imageName: ImagePath.events,
      title: t('farmerHome.services.two.title'),
      description: t('farmerHome.services.two.description'),
    },
    {
      id: '3',
      imageName: ImagePath.healthCheckup,
      title: t('farmerHome.services.three.title'),
      description: t('farmerHome.services.three.description'),
    },
    {
      id: '4',
      imageName: ImagePath.festivalGift,
      title: t('farmerHome.services.four.title'),
      description: t('farmerHome.services.four.description'),
    },
    {
      id: '5',
      imageName: ImagePath.plantVisit,
      title: t('farmerHome.services.five.title'),
      description: t('farmerHome.services.five.description'),
    },
    {
      id: '6',
      imageName: ImagePath.discountSparePart,
      title: t('farmerHome.services.six.title'),
      description: t('farmerHome.services.six.description'),
    },
    {
      id: '7',
      imageName: ImagePath.call,
      title: t('farmerHome.services.seven.title'),
      description: t('farmerHome.services.seven.description'),
    },
  ], [t]);

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const submitEventResponse = async (eventId: string | number, response: 'yes' | 'no') => {
    try {
      setSubmittingEventId(eventId);
      const url = `${Apis.FARMER_EVENT_RESPOND}/${eventId}/respond`;
      const body = {response};
      const res = await postData(url, body);
      console.log("event right success ::",res)
      if (res?.status === true || res?.success === true) {
        // Refresh only events list via events-by-location API
        await fetchDashboardEvents();
      }
    } catch (error) {
      console.error('[FarmerHomeScreen] Error submitting event response:', error);
    } finally {
      setSubmittingEventId(null);
    }
  };

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      console.log('[FarmerHomeScreen] Fetching unread notification count...');
      const response = await getData(Apis.FARMER_PUSH_NOTIFICATIONS_UNREAD_COUNT, {});
      
      if (response?.status === true && response?.data) {
        const count = response.data.count || response.data.unread_count || 0;
        setUnreadCount(count);
        console.log('[FarmerHomeScreen] Unread notification count:', count);
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('[FarmerHomeScreen] Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  // Fetch farmer profile to get name and store profile data
  const fetchFarmerProfile = async () => {
    try {
      console.log('[FarmerHomeScreen] Fetching farmer profile data...');
      const response = await getData(Apis.FARMER_PROFILE, {});
      
      if (response?.status === true && response?.data) {
        const data = response.data;
        const personalDetails = data.personal_details || {};
        
        // Build full name
        const firstName = personalDetails.first_name || '';
        const middleName = personalDetails.middle_name || '';
        const lastName = personalDetails.last_name || '';
        const fullNameParts = [firstName, middleName, lastName].filter(Boolean);
        const fullName = fullNameParts.join(' ') || '';
        
        if (fullName) {
          // Use first name for greeting, or full name if first name is not available
          const displayName = firstName || fullName;
          setFarmerName(displayName);
        }

        // Extract location details from profile data
        // Location data might be in different places in the response
        const locationDetails = data.location_details || data.location || {};
        const addressData = data.address || data.Address || personalDetails.address || personalDetails.Address || {};
        
        // Try to extract location IDs from various possible locations
        // Check location_details, address, personal_details, or root level
        const stateId = locationDetails.state_id || locationDetails.stateId || 
                       addressData.state_id || addressData.stateId || 
                       data.state_id || data.stateId || 
                       personalDetails.state_id || personalDetails.stateId;
        
        const districtId = locationDetails.district_id || locationDetails.districtId || 
                          addressData.district_id || addressData.districtId || 
                          data.district_id || data.districtId || 
                          personalDetails.district_id || personalDetails.districtId;
        
        const villageId = locationDetails.village_id || locationDetails.villageId || 
                         addressData.village_id || addressData.villageId || 
                         data.village_id || data.villageId || 
                         personalDetails.village_id || personalDetails.villageId;
        
        const categoryId = locationDetails.category_id || locationDetails.categoryId || 
                          data.category_id || data.categoryId || 
                          personalDetails.category_id || personalDetails.categoryId;
        
        // Prepare profile data to save
        const profileData: FarmerProfileData = {
          personal_details: personalDetails,
          location_details: {
            state_id: stateId,
            district_id: districtId,
            village_id: villageId,
            category_id: categoryId,
            state: locationDetails.state || addressData.state || data.state,
            district: locationDetails.district || addressData.district || data.district,
            village: locationDetails.village || addressData.village || data.village,
            category: locationDetails.category || data.category,
          },
          dealership_details: data.dealership_details || {},
          tractor_details: data.tractor_details || {},
          fullData: data, // Store full data for reference
        };

        // Save profile data to AsyncStorage
        await saveFarmerProfileData(profileData);
        console.log('[FarmerHomeScreen] Farmer profile data saved to AsyncStorage:', {
          state_id: profileData.location_details?.state_id,
          district_id: profileData.location_details?.district_id,
          village_id: profileData.location_details?.village_id,
          category_id: profileData.location_details?.category_id,
        });
      }
    } catch (error) {
      console.error('[FarmerHomeScreen] Error fetching farmer profile:', error);
    }
  };

  // Fetch recent events for dashboard from events-by-location API
  const fetchDashboardEvents = React.useCallback(async () => {
    try {
      const eventsByLocationResponse = await getData(Apis.FARMER_EVENTS_BY_LOCATION, {});
      console.log('[FarmerHomeScreen] Events by location response:', JSON.stringify(eventsByLocationResponse, null, 2));

      const eventsSource =
        eventsByLocationResponse?.data?.events ||
        eventsByLocationResponse?.data?.list ||
        (Array.isArray(eventsByLocationResponse?.data)
          ? eventsByLocationResponse.data
          : []);

      const selectedLanguageId = currentLanguageId || 1;

      if (Array.isArray(eventsSource) && eventsSource.length > 0) {
        // Limit to first 5 events for dashboard
        const limitedEventsArray = eventsSource.slice(0, 5);

        const events = limitedEventsArray.map((event: any) => {
          // Prioritize image_url over video thumbnails
          let imageUrl = null;
          if (event.image_url) {
            imageUrl = getImageUrl(event.image_url);
          } else {
            // Fallback to video thumbnail only if image_url is not available
            let videoUrl = '';
            if (event.media?.cover_video?.video_url) {
              videoUrl = event.media.cover_video.video_url;
            } else if (event.video_url || event.videoUrl) {
              videoUrl = event.video_url || event.videoUrl;
            }

            if (videoUrl && isYouTubeUrl(videoUrl)) {
              const youtubeThumbnail = getYouTubeThumbnailUrl(videoUrl, 'maxresdefault');
              imageUrl = youtubeThumbnail;
            }
          }

          // Only use default thumbnail if no image URL
          const thumbnail = imageUrl ? {uri: imageUrl} : ImagePath.farmerTractor;

          // Handle language-specific title
          let displayTitle = event.title || '';
          if (event.languages && Array.isArray(event.languages) && event.languages.length > 0) {
            const languageSpecificContent = event.languages.find(
              (lang: any) => lang.language_id === selectedLanguageId,
            );
            // Use language-specific title if found, otherwise use default title
            if (languageSpecificContent?.title) {
              displayTitle = languageSpecificContent.title;
            }
          }


          return {
            id:  event.id || event.event_id,
            thumbnail,
            title: displayTitle,
            date: getEventDateDisplay(event),
            isAnswered: event.isAnswered ?? event.is_answered ?? false,
            responseValue: event.responseValue,
          };
        });

        console.log('[FarmerHomeScreen] Dashboard events (by location):', events);
        setRecentEvents(events);
      } else {
        console.log('[FarmerHomeScreen] No events returned from events-by-location API');
        setRecentEvents([]);
      }
    } catch (eventsError) {
      console.error('[FarmerHomeScreen] Error fetching events by location for dashboard:', eventsError);
      setRecentEvents([]);
    }
  }, [currentLanguage]);

  // Fetch dashboard data from API
  const fetchDashboardData = React.useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get stored farmer profile data to extract location details
      const profileData = await getFarmerProfileData();
      const locationDetails = profileData?.location_details || {};
      
      console.log('[FarmerHomeScreen] Profile data:', profileData);
      console.log('[FarmerHomeScreen] Location details:', locationDetails);
      
      // Build query parameters in correct order: state, district, village, category
      // Format: state=1&district=2&village=3&category=1
      let urlParams = '';
      
      // Add state parameter (first)
      if (locationDetails.state_id) {
        urlParams = `?state=${locationDetails.state_id}`;
      }
      
      // Add district parameter (second)
      if (locationDetails.district_id) {
        urlParams = urlParams + `&district=${locationDetails.district_id}`;
      }
      
      // Add village parameter (third)
      if (locationDetails.village_id) {
        urlParams = urlParams + `&village=${locationDetails.village_id}`;
      }
      
      // Add category parameter (fourth)
      if (locationDetails.category_id) {
        urlParams = urlParams + `&category=${locationDetails.category_id}`;
      }
      
      console.log('[FarmerHomeScreen] Query parameters (ordered):', urlParams);
      
      // Build API endpoint with query parameters
      const apiEndpoint = Apis.FARMER_DASHBOARD;
      console.log('[FarmerHomeScreen] API Endpoint:', apiEndpoint);
      console.log('[FarmerHomeScreen] Fetching dashboard data...');
      const response = await getData(apiEndpoint);
      
      console.log('[FarmerHomeScreen] Dashboard API response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        const dashboardData = response.data;
        
        console.log("dashboardData ::",dashboardData);
        
        const selectedLanguageId = currentLanguageId || 1;
        
        // Transform top videos for carousel
        if (dashboardData.top_videos && Array.isArray(dashboardData.top_videos.list)) {
          const videos = dashboardData.top_videos.list.map((video: any, index: number) => {
            const videoUrl = video.video_url || '';
            
            // Use YouTube thumbnail if video is YouTube, otherwise use image_url
            let thumbnailUri = null;
            if (videoUrl && isYouTubeUrl(videoUrl)) {
              thumbnailUri = getYouTubeThumbnailUrl(videoUrl, 'maxresdefault');
            } else if (video.image_url) {
              thumbnailUri = getImageUrl(video.image_url);
            }
            
            // Only use default thumbnail if no video URL or image URL
            const thumbnailSource = thumbnailUri ? undefined : (videoUrl ? undefined : ImagePath.farmerTractor);
            
            return {
              id: video.video_id || `video_${index}`,
              type: 'video',
              thumbnailSource: thumbnailSource,
              thumbnailUri: thumbnailUri,
              videoUri: videoUrl,
              title: video.title || '',
            };
          });
          setCarouselItems(videos.length > 0 ? videos : []);
        } else {
          // Fallback to default carousel if no videos
          setCarouselItems([
            {
              id: '1',
              type: 'video',
              thumbnailSource: ImagePath.farmerTractor,
              videoUri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              title: 'Tractor Video 1',
            },
          ]);
        }
        
        // Transform recent events for dashboard using separate events-by-location call
        await fetchDashboardEvents();
        
        // Transform recent stories
        // Handle both structures: recent_stories.list (array) or recent_stories (direct array)
        const storiesArray = dashboardData.recent_stories?.list || 
                            (Array.isArray(dashboardData.recent_stories) ? dashboardData.recent_stories : []);
        if (Array.isArray(storiesArray) && storiesArray.length > 0) {
          // Limit to first 5 stories
          const limitedStoriesArray = storiesArray.slice(0, 5);
          
          const stories = limitedStoriesArray.map((story: any) => {
            // Prioritize image_url over video thumbnails
            let imageUrl = null;
            if (story.image_url) {
              imageUrl = getImageUrl(story.image_url);
            } else {
              // Fallback to video thumbnail only if image_url is not available
              let videoUrl = '';
              if (story.media?.cover_video?.video_url) {
                videoUrl = story.media.cover_video.video_url;
              } else if (story.video_url || story.videoUrl) {
                videoUrl = story.video_url || story.videoUrl;
              }
              
              if (videoUrl && isYouTubeUrl(videoUrl)) {
                const youtubeThumbnail = getYouTubeThumbnailUrl(videoUrl, 'maxresdefault');
                imageUrl = youtubeThumbnail;
              }
            }
            
            // Only use default thumbnail if no image URL
            const thumbnail = imageUrl ? {uri: imageUrl} : ImagePath.farmerTractor;
            
            // Handle language-specific title
            let displayTitle = story.title || '';
            if (story.languages && Array.isArray(story.languages) && story.languages.length > 0) {
              const languageSpecificContent = story.languages.find(
                (lang: any) => lang.language_id === selectedLanguageId
              );
              // Use language-specific title if found, otherwise use default title
              if (languageSpecificContent?.title) {
                displayTitle = languageSpecificContent.title;
              }
            }
            
            return {
              id: story.story_id || story.id,
              thumbnail: thumbnail,
              title: displayTitle,
              date: formatDate(story.publish_date || ''),
            };
          });
          setRecentStories(stories);
        } else {
          setRecentStories([]);
        }
        
        // Transform recent announcements
        if (dashboardData.recent_announcements && Array.isArray(dashboardData.recent_announcements.list)) {
          const announcements = dashboardData.recent_announcements.list.map((announcement: any) => {
            // Check for video URL - check direct field first, then nested structure
            let videoUrl = '';
            if (announcement.video_url || announcement.videoUrl) {
              videoUrl = announcement.video_url || announcement.videoUrl;
            } else if (announcement.media?.cover_video?.video_url) {
              videoUrl = announcement.media.cover_video.video_url;
            }
            
            // Check for link URL
            const linkUrl = announcement.link_url || announcement.link || announcement.url || '';
            
            // Always prioritize API image_url for announcement banner.
            let imageUrl = null;
            if (announcement.image_url) {
              imageUrl = getImageUrl(announcement.image_url);
            } else if (videoUrl && isYouTubeUrl(videoUrl)) {
              const youtubeThumbnail = getYouTubeThumbnailUrl(videoUrl, 'maxresdefault');
              imageUrl = youtubeThumbnail;
            }
            
            console.log('[FarmerHomeScreen] Announcement transformed:', {
              id: announcement.announcement_id,
              title: announcement.title,
              videoUrl: videoUrl,
              imageUrl: imageUrl,
              hasImage: !!announcement.image_url,
            });
            
            return {
              id: announcement.announcement_id || announcement.id || String(Math.random()),
              title: announcement.title || '',
              imageUrl: imageUrl,
              videoUrl: videoUrl,
              linkUrl: linkUrl,
              description: announcement.description || '',
            };
          });
          setRecentAnnouncements(announcements);
        } else {
          setRecentAnnouncements([]);
        }
      } else {
        console.warn('[FarmerHomeScreen] Unexpected API response format:', response);
        // Set empty arrays on error
        setCarouselItems([]);
        setRecentEvents([]);
        setRecentStories([]);
        setRecentAnnouncements([]);
      }
    } catch (error) {
      console.error('[FarmerHomeScreen] Error fetching dashboard data:', error);
      // Set empty arrays on error
      setCarouselItems([]);
      setRecentEvents([]);
      setRecentStories([]);
      setRecentAnnouncements([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentLanguage]);

  // Fetch data on mount and when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[FarmerHomeScreen] Screen focused - fetching dashboard data');
      fetchDashboardData(false);
      fetchFarmerProfile();
      fetchUnreadCount();

      // Handle back button - exit app when on Home screen
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });

      return () => backHandler.remove();
    }, [fetchDashboardData])
  );

  // Pull to refresh handler
  const onRefresh = React.useCallback(() => {
    fetchDashboardData(true);
    fetchFarmerProfile();
    fetchUnreadCount();
  }, [fetchDashboardData]);

  // Auto slide functionality for announcements
  const announcementAutoSlideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const startAnnouncementAutoSlide = () => {
    if (announcementAutoSlideTimerRef.current) {
      clearInterval(announcementAutoSlideTimerRef.current);
    }
    
    if (recentAnnouncements.length > 1) {
      announcementAutoSlideTimerRef.current = setInterval(() => {
        setAnnouncementIndex((prevIndex) => {
          return (prevIndex + 1) % recentAnnouncements.length;
        });
      }, 6000); // Change slide every 6 seconds (increased from 3 seconds)
    }
  };

  const stopAnnouncementAutoSlide = () => {
    if (announcementAutoSlideTimerRef.current) {
      clearInterval(announcementAutoSlideTimerRef.current);
      announcementAutoSlideTimerRef.current = null;
    }
  };

  // Start auto slide when announcements are available
  useEffect(() => {
    if (recentAnnouncements.length > 1) {
      startAnnouncementAutoSlide();
    } else {
      stopAnnouncementAutoSlide();
      setAnnouncementIndex(0);
    }
    return () => {
      stopAnnouncementAutoSlide();
    };
  }, [recentAnnouncements.length]);

  // Update announcements carousel when index changes
  useEffect(() => {
    if (recentAnnouncements.length > 0 && announcementCarouselRef.current) {
      try {
        announcementCarouselRef.current.scrollToIndex({
          index: announcementIndex,
          animated: true,
        });
      } catch (error) {
        console.error('[FarmerHomeScreen] Error scrolling announcements to index:', error);
        // Fallback to scrollToOffset if scrollToIndex fails
        const itemWidth = screenWidth;
        announcementCarouselRef.current.scrollToOffset({
          offset: announcementIndex * itemWidth,
          animated: true,
        });
      }
    }
  }, [announcementIndex, recentAnnouncements.length]);

  // Handle announcement press - open link or video
  const handleAnnouncementPress = async (announcement: any) => {
    // Priority: linkUrl first, then videoUrl
    const linkUrl = announcement.linkUrl || announcement.videoUrl || '';
    if (linkUrl) {
      try {
        const canOpen = await Linking.canOpenURL(linkUrl);
        if (canOpen) {
          await Linking.openURL(linkUrl);
          console.log('[FarmerHomeScreen] Opened announcement link:', linkUrl);
        } else {
          console.log('[FarmerHomeScreen] Cannot open URL:', linkUrl);
        }
      } catch (error) {
        console.error('[FarmerHomeScreen] Error opening URL:', error);
      }
    } else {
      console.log('[FarmerHomeScreen] No link or video URL for announcement:', announcement.id);
    }
  };

  const handleAnnouncementVideoPress = (announcement: any) => {
    const rawVideoUrl = announcement?.videoUrl || '';
    if (rawVideoUrl && isYouTubeUrl(rawVideoUrl)) {
      const videoId = extractYouTubeVideoId(rawVideoUrl);
      if (videoId) {
        setSelectedVideoId(videoId);
        setShowVideoModal(true);
        stopAnnouncementAutoSlide();
        return;
      }
    }

    // Fallback to existing behavior when URL is not a valid YouTube link.
    handleAnnouncementPress(announcement);
  };

  // Auto slide functionality
  const startAutoSlide = () => {
    // Don't start auto slide if there are no items or only one item
    if (!carouselItems || carouselItems.length <= 1) {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
        autoSlideTimerRef.current = null;
      }
      return;
    }
    
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
    }
    
    autoSlideTimerRef.current = setInterval(() => {
      setCurrentCarouselIndex(prevIndex => {
        // Ensure prevIndex is a valid number
        const currentIndex = isNaN(prevIndex) || prevIndex < 0 ? 0 : prevIndex;
        const nextIndex = (currentIndex + 1) % carouselItems.length;
        
        // Validate nextIndex before scrolling
        if (nextIndex >= 0 && nextIndex < carouselItems.length && carouselRef.current) {
          try {
            carouselRef.current.scrollToIndex({
              index: nextIndex,
              animated: true,
            });
          } catch (error) {
            console.error('[FarmerHomeScreen] Error scrolling to index:', error);
            // Fallback to scrollToOffset if scrollToIndex fails
            const itemWidth = screenWidth - moderateScale(32) - moderateScale(20);
            carouselRef.current.scrollToOffset({
              offset: nextIndex * itemWidth,
              animated: true,
            });
          }
        }
        return nextIndex;
      });
    }, 3000); // Auto slide every 3 seconds
  };

  useEffect(() => {
    // Only start auto slide if we have carousel items
    if (carouselItems && carouselItems.length > 1) {
      startAutoSlide();
    }

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
        autoSlideTimerRef.current = null;
      }
    };
  }, [carouselItems]);
  
  // Reset carousel index when items change or become empty
  useEffect(() => {
    if (carouselItems.length === 0) {
      setCurrentCarouselIndex(0);
    } else if (currentCarouselIndex >= carouselItems.length) {
      setCurrentCarouselIndex(0);
    } else if (isNaN(currentCarouselIndex) || currentCarouselIndex < 0) {
      setCurrentCarouselIndex(0);
    }
  }, [carouselItems.length, currentCarouselIndex]);

  // Reset auto slide timer when user manually scrolls
  const handleScroll = (event: any) => {
    if (!carouselItems || carouselItems.length === 0) {
      return;
    }
    
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const itemWidth = screenWidth - moderateScale(32) - moderateScale(20); // Account for margins and padding
    
    // Prevent division by zero
    if (itemWidth <= 0) {
      return;
    }
    
    const index = Math.round(scrollPosition / itemWidth);
    
    // Validate index before updating
    if (!isNaN(index) && index >= 0 && index < carouselItems.length && index !== currentCarouselIndex) {
      setCurrentCarouselIndex(index);
      // Reset auto slide timer after manual scroll
      startAutoSlide();
    }
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        scrollContent: {
          paddingBottom: moderateScale(16),
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
          paddingBottom: moderateScale(16),
        },
        greeting: {
          ...Typography.boldXxl,
          fontSize: moderateScale(22),
          color: colors.textPrimary,
          fontFamily: FontFamily.SemiBold,
        },
        bellIcon: {
          padding: moderateScale(4),
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        },
        notificationBadge: {
          position: 'absolute',
          top: moderateScale(6),
          right: moderateScale(6),
          width: moderateScale(8),
          height: moderateScale(8),
          borderRadius: moderateScale(4),
          backgroundColor: colors.primary,
        },
        carouselContainer: {
          marginHorizontal: moderateScale(16),
          marginBottom: moderateScale(16),
          backgroundColor: colors.white,
          borderRadius: moderateScale(12),
          padding: moderateScale(10),
          position: 'relative',
          overflow: 'hidden',
        },
        carouselWrapper: {
          width: screenWidth - moderateScale(32) - moderateScale(20), // Full width minus margins and padding
          height: moderateScale(180),
        },
        carouselItem: {
          width: screenWidth - moderateScale(32) - moderateScale(20), // Full width minus margins and padding
          height: moderateScale(180),
          borderRadius: moderateScale(12),
          overflow: 'hidden',
        },
        paginationContainer: {
          position: 'absolute',
          bottom: moderateScale(16),
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        },
        paginationDot: {
          width: moderateScale(8),
          height: moderateScale(8),
          borderRadius: moderateScale(4),
          backgroundColor: colors.textSecondary,
          marginHorizontal: moderateScale(4),
          opacity: 0.3,
        },
        paginationDotActive: {
          width: moderateScale(24),
          backgroundColor: colors.primary,
          opacity: 1,
        },
        carouselImage: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(12),
        },
        sectionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          marginBottom: moderateScale(12),
        },
        sectionTitle: {
          ...Typography.semiBoldLg,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
        },
        seeAllText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.primary,
        },
        announcementsContainer: {
          marginHorizontal: moderateScale(16),
          marginBottom: moderateScale(16),
          borderRadius: moderateScale(12),
          overflow: 'hidden',
          backgroundColor: colors.white,
        },
        announcementsCarousel: {
          width: screenWidth - moderateScale(32),
          height: moderateScale(200),
        },
        announcementItem: {
          width: screenWidth - moderateScale(32),
          height: moderateScale(200),
        },
        announcementImage: {
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
        },
        announcementPlayOverlay: {
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        announcementPlayButton: {
          width: moderateScale(56),
          height: moderateScale(56),
          borderRadius: moderateScale(28),
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 4,
          borderColor: 'rgba(246, 157, 42, 1)',
        },
        announcementPagination: {
          position: 'absolute',
          bottom: moderateScale(12),
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        },
        announcementDot: {
          width: moderateScale(8),
          height: moderateScale(8),
          borderRadius: moderateScale(4),
          backgroundColor: colors.textWhite,
          marginHorizontal: moderateScale(4),
          opacity: 0.5,
        },
        announcementDotActive: {
          width: moderateScale(24),
          backgroundColor: colors.primary,
          opacity: 1,
        },
        eventSliderContainer: {
          backgroundColor: colors.white,
          paddingVertical: moderateScale(12),
          marginBottom: moderateScale(16),
          marginHorizontal:moderateScale(16),
          borderRadius: moderateScale(12),
        },
        eventCard: {
          width: screenWidth / 2,
          marginRight: moderateScale(12),
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(16),
          borderWidth: 1,
          borderColor: colors.borderDefault,
          flexDirection: 'column',
          overflow: 'hidden',
        },
        eventThumbnail: {
          width: '100%',
          height: moderateScale(120),
        },
        eventContent: {
          width: '100%',
          paddingHorizontal: moderateScale(12),
          paddingTop: moderateScale(10),
          paddingBottom: moderateScale(8),
        },
        eventTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(13),
          color: colors.textPrimary,
          marginBottom: moderateScale(6),
          lineHeight: moderateScale(18),
        },
        eventDate: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: moderateScale(4),
        },
        eventDateText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
          marginLeft: moderateScale(4),
        },
        eventActionsContainer: {
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: colors.borderDefault,
          borderRadius:moderateScale(20),
          backgroundColor: colors.backgroundWhite,
          // height: moderateScale(40),
          margin:moderateScale(10)
        },
        eventActionButton: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding:moderateScale(10),
          borderRadius:moderateScale(20),
        },
        eventActionLeft: {
          borderRightWidth: 1,
          borderRightColor: colors.borderDefault,
        },
        eventActionText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
        },
        eventActionTextActive: {
          color: colors.primary,
        },
        serviceCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderRadius: moderateScale(12),
          borderWidth:1,
          borderColor:colors.borderColor,
          padding: moderateScale(10),
          marginBottom: moderateScale(14),
          marginHorizontal: moderateScale(16),         
        },
        serviceIconContainer: {
          width: moderateScale(48),
          height: moderateScale(48),
          borderRadius: moderateScale(10),
          backgroundColor: colors.light_orange,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        serviceContent: {
          flex: 1,
        },
        serviceTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        serviceDescription: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
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
        imageModalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        imageModalContainer: {
          width: screenWidth,
          height: screenHeight,
          justifyContent: 'center',
          alignItems: 'center',
        },
        imageModalScrollView: {
          width: screenWidth,
          height: screenHeight,
          bottom:moderateScale(40)
        },
        imageModalImageContainer: {
          width: screenWidth,
          height: screenHeight,
          justifyContent: 'center',
          alignItems: 'center',
        },
        imageModalImage: {
          width: screenWidth,
          height: screenHeight,
          resizeMode: 'contain',
        },
        imageModalCloseButton: {
          position: 'absolute',
          top: moderateScale(30),
          right: moderateScale(20),
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          elevation: 10,
        },
      }),
    [moderateScale, insets.top, screenWidth, screenHeight],
  );

  const renderCarouselItem = ({item, index}: {item: any; index: number}) => {
    if (item.type === 'video') {
      return (
        <View style={dynamicStyles.carouselItem}>
          <VideoPlayer
            thumbnailUri={item.thumbnailUri}
            thumbnailSource={item.thumbnailSource}
            videoUri={item.videoUri}
            title={item.title}
            containerStyle={dynamicStyles.carouselItem}
          />
        </View>
      );
    } else {
      return (
        <View style={dynamicStyles.carouselItem}>
          <Image
            source={item.imageUri}
            style={dynamicStyles.carouselImage}
            resizeMode="cover"
          />
        </View>
      );
    }
  };

  const renderEventCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={dynamicStyles.eventCard}
      activeOpacity={0.9}
      onPress={() => {
        // Navigate to Events tab and then to EventDetails
        tabNavigation.navigate(SCREEN_NAMES.Events, {
          screen: SCREEN_NAMES.EventDetails,
          params: {
            eventId: item.id,
            title: item.title,
            date: item.date,
            fromScreen: "Home",
          },
        } as any);
      }}
    >
      {item.thumbnail ? (
        <Image
          source={item.thumbnail}
          style={dynamicStyles.eventThumbnail}
          resizeMode="cover"
        />
      ) : null}
      <View style={dynamicStyles.eventContent}>
        <Text
          style={dynamicStyles.eventTitle}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <View style={dynamicStyles.eventDate}>
          <Ionicons
            name="calendar-outline"
            size={moderateScale(14)}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.eventDateText}>{item.date}</Text>
        </View>
      </View>

      <View style={dynamicStyles.eventActionsContainer}>
        <TouchableOpacity
          style={[
            dynamicStyles.eventActionButton,
            {
              backgroundColor:
                item?.responseValue == 1 ? colors.primary : colors.white,
            },
          ]}
          activeOpacity={0.7}
          disabled={item.isAnswered}
          onPress={() => submitEventResponse(item.id, "yes")}
        >
          <Text
            style={[
              dynamicStyles.eventActionText,
              dynamicStyles.eventActionTextActive,
              {
                color: item?.responseValue == 1 ? colors.white : colors.primary,
              },
            ]}
          >
            {t("events.yes")}
          </Text>
        </TouchableOpacity>
        <View
          style={{
            width: 1,
            height: moderateScale(20),
            backgroundColor: colors.borderDefault,
            alignSelf: "center",
            marginHorizontal: moderateScale(5),
          }}
        />
        <TouchableOpacity
          style={[
            dynamicStyles.eventActionButton,
            {
              backgroundColor:
                item?.responseValue == 0 ? colors.textSecondary : colors.white,
            },
          ]}
          activeOpacity={0.7}
          disabled={item.isAnswered}
          onPress={() => submitEventResponse(item.id, "no")}
        >
          <Text
            style={[
              dynamicStyles.eventActionText,
              {
                color:
                  item?.responseValue == 0
                    ? colors.white
                    : colors.textSecondary,
              },
            ]}
          >
            {t("events.no")}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderStoryCard = ({item}: {item: any}) => (
    <TouchableOpacity 
      style={dynamicStyles.eventCard} 
      activeOpacity={0.7}
      onPress={() => {
        // Navigate to Stories tab and then to StoryDetails
        tabNavigation.navigate(SCREEN_NAMES.Stories, {
          screen: SCREEN_NAMES.StoryDetails,
          params: {
            storyId: item.id,
            title: item.title,
            date: item.date,
            fromScreen: 'Home',
          },
        } as any);
      }}>
      {item.thumbnail ? (
        <Image
          source={item.thumbnail}
          style={dynamicStyles.eventThumbnail}
          resizeMode="cover"
        />
      ) : null}
      <View style={dynamicStyles.eventContent}>
        <Text 
          style={dynamicStyles.eventTitle} 
          numberOfLines={1}
          ellipsizeMode="tail">
          {item.title}
        </Text>
        <View style={dynamicStyles.eventDate}>
          <Ionicons
            name="calendar-outline"
            size={moderateScale(14)}
            color={colors.textSecondary}
          />
          <Text style={dynamicStyles.eventDateText}>{item.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderServiceCard = (service: any) => (
    <View key={service.id} style={dynamicStyles.serviceCard}>
      <View style={dynamicStyles.serviceIconContainer}>
        <Image
        source={service.imageName}
        style={{width:moderateScale(20),height:moderateScale(20),tintColor:colors.iconOrange}}
        />
        {/* {service.id === '1' ? (
          <View
            style={{
              width: moderateScale(32),
              height: moderateScale(32),
              borderRadius: moderateScale(16),
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                ...Typography.boldSm,
                fontSize: moderateScale(12),
                color: colors.textWhite,
              }}>
              24
            </Text>
          </View>
        ) : (
          <Ionicons
            name={service.icon}
            size={moderateScale(24)}
            color={colors.primary}
          />
        )} */}
      </View>
      <View style={dynamicStyles.serviceContent}>
        <Text style={dynamicStyles.serviceTitle}>{service.title}</Text>
        <Text style={dynamicStyles.serviceDescription}>
          {service.description}
        </Text>
      </View>
    </View>
  );

  // Skeleton content component
  const renderSkeletonContent = () => {
    return (
      <SkeletonPlaceholder
        backgroundColor={colors.backgroundGray}
        highlightColor={colors.backgroundWhite}
        borderRadius={moderateScale(10)}>
        {/* Carousel Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          padding={moderateScale(10)}
          marginHorizontal={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          <SkeletonPlaceholder.Item
            width="100%"
            height={moderateScale(180)}
            borderRadius={moderateScale(12)}
          />
        </SkeletonPlaceholder.Item>

        {/* Events Section Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          paddingVertical={moderateScale(12)}
          marginBottom={moderateScale(16)}
          marginHorizontal={moderateScale(16)}>
          {/* Section Header Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            justifyContent="space-between"
            paddingHorizontal={moderateScale(16)}
            marginBottom={moderateScale(12)}>
            <SkeletonPlaceholder.Item
              width="40%"
              height={moderateScale(18)}
              borderRadius={moderateScale(4)}
            />
            <SkeletonPlaceholder.Item
              width="20%"
              height={moderateScale(14)}
              borderRadius={moderateScale(4)}
            />
          </SkeletonPlaceholder.Item>

          {/* Events List Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            paddingHorizontal={moderateScale(16)}>
            {[1, 2].map((index) => (
              <SkeletonPlaceholder.Item
                key={index}
                width={screenWidth / 2}
                marginRight={moderateScale(12)}
                backgroundColor={colors.backgroundWhite}
                borderRadius={moderateScale(12)}
                borderWidth={1}
                borderColor={colors.borderDefault}
                flexDirection="row"
                padding={moderateScale(10)}>
                <SkeletonPlaceholder.Item
                  width={moderateScale(55)}
                  height={moderateScale(55)}
                  borderRadius={moderateScale(8)}
                  marginRight={moderateScale(10)}
                />
                <SkeletonPlaceholder.Item flex={1}>
                  <SkeletonPlaceholder.Item
                    width="90%"
                    height={moderateScale(13)}
                    borderRadius={moderateScale(2)}
                    marginBottom={moderateScale(8)}
                  />
                  <SkeletonPlaceholder.Item
                    width="60%"
                    height={moderateScale(12)}
                    borderRadius={moderateScale(2)}
                  />
                </SkeletonPlaceholder.Item>
              </SkeletonPlaceholder.Item>
            ))}
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder.Item>

        {/* Stories Section Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          paddingVertical={moderateScale(12)}
          marginBottom={moderateScale(16)}
          marginHorizontal={moderateScale(16)}>
          {/* Section Header Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            justifyContent="space-between"
            paddingHorizontal={moderateScale(16)}
            marginBottom={moderateScale(12)}>
            <SkeletonPlaceholder.Item
              width="40%"
              height={moderateScale(18)}
              borderRadius={moderateScale(4)}
            />
            <SkeletonPlaceholder.Item
              width="20%"
              height={moderateScale(14)}
              borderRadius={moderateScale(4)}
            />
          </SkeletonPlaceholder.Item>

          {/* Stories List Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            paddingHorizontal={moderateScale(16)}>
            {[1, 2].map((index) => (
              <SkeletonPlaceholder.Item
                key={index}
                width={screenWidth / 2}
                marginRight={moderateScale(12)}
                backgroundColor={colors.backgroundWhite}
                borderRadius={moderateScale(12)}
                borderWidth={1}
                borderColor={colors.borderDefault}
                flexDirection="row"
                padding={moderateScale(10)}>
                <SkeletonPlaceholder.Item
                  width={moderateScale(55)}
                  height={moderateScale(55)}
                  borderRadius={moderateScale(8)}
                  marginRight={moderateScale(10)}
                />
                <SkeletonPlaceholder.Item flex={1}>
                  <SkeletonPlaceholder.Item
                    width="90%"
                    height={moderateScale(13)}
                    borderRadius={moderateScale(2)}
                    marginBottom={moderateScale(8)}
                  />
                  <SkeletonPlaceholder.Item
                    width="60%"
                    height={moderateScale(12)}
                    borderRadius={moderateScale(2)}
                  />
                </SkeletonPlaceholder.Item>
              </SkeletonPlaceholder.Item>
            ))}
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder.Item>

        {/* Membership Services Section Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(10)}
          paddingTop={moderateScale(15)}
          marginHorizontal={moderateScale(16)}>
          {/* Section Header Skeleton */}
          <SkeletonPlaceholder.Item
            width="50%"
            height={moderateScale(18)}
            borderRadius={moderateScale(4)}
            marginLeft={moderateScale(16)}
            marginBottom={moderateScale(12)}
          />

          {/* Services List Skeleton */}
          {[1, 2, 3, 4, 5].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              alignItems="center"
              backgroundColor={colors.backgroundWhite}
              borderRadius={moderateScale(12)}
              borderWidth={1}
              borderColor={colors.borderColor}
              padding={moderateScale(10)}
              marginBottom={index < 5 ? moderateScale(14) : 0}
              marginHorizontal={moderateScale(16)}>
              <SkeletonPlaceholder.Item
                width={moderateScale(48)}
                height={moderateScale(48)}
                borderRadius={moderateScale(10)}
                marginRight={moderateScale(12)}
              />
              <SkeletonPlaceholder.Item flex={1}>
                <SkeletonPlaceholder.Item
                  width="70%"
                  height={moderateScale(16)}
                  borderRadius={moderateScale(4)}
                  marginBottom={moderateScale(4)}
                />
                <SkeletonPlaceholder.Item
                  width="90%"
                  height={moderateScale(12)}
                  borderRadius={moderateScale(4)}
                />
              </SkeletonPlaceholder.Item>
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    );
  };

  // Skeleton component matching the exact design
  const renderSkeleton = () => {
    return (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {renderSkeletonContent()}
      </ScrollView>
    );
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.greeting}>{t('farmerHome.greeting')} {farmerName || ''}</Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: moderateScale(12)}}>
          <TouchableOpacity
            style={dynamicStyles.bellIcon}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to Language screen
              (navigation as any).navigate(SCREEN_NAMES.Language);
            }}>
            <Ionicons
              name="language-outline"
              size={moderateScale(22)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.bellIcon}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to notifications
              (navigation as any).navigate(SCREEN_NAMES.Notifications);
            }}>
            <Ionicons
              name="notifications-outline"
              size={moderateScale(22)}
              color={colors.textPrimary}
            />
            {unreadCount > 0 && (
              <View style={dynamicStyles.notificationBadge} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.bellIcon}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to Profile screen - ensure it goes to root of FarmerProfileStack
              tabNavigation.navigate(SCREEN_NAMES.Profile, {
                screen: SCREEN_NAMES.Profile,
              } as any);
            }}>
            <Ionicons
              name="person-outline"
              size={moderateScale(22)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
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
          {refreshing ? (
            renderSkeletonContent()
          ) : (
            <>
              {/* Top Carousel - Show Announcements first (priority), then Videos */}
          {recentAnnouncements.length > 0 ? (
            <View style={dynamicStyles.carouselContainer}>
              <View style={dynamicStyles.carouselWrapper}>
                <FlatList
                  ref={announcementCarouselRef}
                  data={recentAnnouncements}
                  renderItem={({item: announcement, index}) => {
                    // Always show announcement image banner in slider.
                    return (
                      <TouchableOpacity
                        style={dynamicStyles.carouselItem}
                        activeOpacity={0.9}
                        onPress={() => {
                          if (announcement.videoUrl) {
                            handleAnnouncementVideoPress(announcement);
                          } else if (announcement.imageUrl) {
                            setSelectedImageUrl(announcement.imageUrl);
                            setShowImageModal(true);
                            stopAnnouncementAutoSlide();
                          } else if (announcement.linkUrl) {
                            handleAnnouncementPress(announcement);
                          }
                        }}>
                        {announcement.imageUrl ? (
                          <View style={dynamicStyles.carouselItem}>
                            <Image
                              source={{uri: announcement.imageUrl}}
                              style={dynamicStyles.carouselImage}
                              resizeMode="cover"
                            />
                            {announcement.videoUrl ? (
                              <View style={dynamicStyles.announcementPlayOverlay}>
                                <View style={dynamicStyles.announcementPlayButton}>
                                  <Ionicons
                                    name="play"
                                    size={moderateScale(30)}
                                    color={colors.primary}
                                    style={{marginLeft: moderateScale(2)}}
                                  />
                                </View>
                              </View>
                            ) : null}
                          </View>
                        ) : (
                          <View style={[dynamicStyles.carouselItem, {backgroundColor: colors.backgroundGray, justifyContent: 'center', alignItems: 'center'}]}>
                            <Text style={[Typography.regularMd, {color: colors.textSecondary, fontSize: moderateScale(14)}]}>
                              {announcement.title}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  keyExtractor={(item) => item.id}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  scrollEnabled={recentAnnouncements.length > 1}
                  snapToInterval={screenWidth - moderateScale(32) - moderateScale(20)}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onMomentumScrollEnd={(event) => {
                    const scrollPosition = event.nativeEvent.contentOffset.x;
                    const itemWidth = screenWidth - moderateScale(32) - moderateScale(20);
                    const index = Math.round(scrollPosition / itemWidth);
                    if (index >= 0 && index < recentAnnouncements.length) {
                      setAnnouncementIndex(index);
                    }
                  }}
                  getItemLayout={(data, index) => {
                    const itemWidth = screenWidth - moderateScale(32) - moderateScale(20);
                    return {
                      length: itemWidth,
                      offset: itemWidth * index,
                      index,
                    };
                  }}
                />
              </View>
              {/* Pagination Dots */}
              {recentAnnouncements.length > 1 && (
                <View style={dynamicStyles.paginationContainer}>
                  {recentAnnouncements.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        dynamicStyles.paginationDot,
                        index === announcementIndex && dynamicStyles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : carouselItems.length > 0 ? (
            <View style={dynamicStyles.carouselContainer}>
              <View style={dynamicStyles.carouselWrapper}>
                <FlatList
                  ref={carouselRef}
                  data={carouselItems}
                  renderItem={renderCarouselItem}
                  keyExtractor={item => item.id || `item_${item.video_id || Math.random()}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={screenWidth - moderateScale(32) - moderateScale(20)}
                  snapToAlignment="center"
                  decelerationRate="fast"
                  onScroll={handleScroll}
                  scrollEventThrottle={16}
                  getItemLayout={(data, index) => {
                    const itemWidth = screenWidth - moderateScale(32) - moderateScale(20);
                    return {
                      length: itemWidth,
                      offset: itemWidth * index,
                      index,
                    };
                  }}
                  contentContainerStyle={{
                    paddingHorizontal: 0,
                  }}
                  onScrollToIndexFailed={(info) => {
                    console.warn('[FarmerHomeScreen] scrollToIndex failed:', info);
                    // Validate index before attempting scroll
                    if (isNaN(info.index) || info.index < 0 || info.index >= carouselItems.length) {
                      console.error('[FarmerHomeScreen] Invalid index in onScrollToIndexFailed:', info.index);
                      return;
                    }
                    // Fallback to scrollToOffset
                    const itemWidth = screenWidth - moderateScale(32) - moderateScale(20);
                    const wait = new Promise<void>(resolve => setTimeout(() => resolve(), 500));
                    wait.then(() => {
                      if (carouselRef.current) {
                        try {
                          carouselRef.current.scrollToOffset({
                            offset: info.index * itemWidth,
                            animated: true,
                          });
                        } catch (error) {
                          console.error('[FarmerHomeScreen] Error in scrollToIndexFailed fallback:', error);
                        }
                      }
                    });
                  }}
                />
              </View>
              {/* Pagination Dots */}
              <View style={dynamicStyles.paginationContainer}>
                {carouselItems.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      dynamicStyles.paginationDot,
                      index === currentCarouselIndex && dynamicStyles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* Recent Events Section */}
          <View style={dynamicStyles.eventSliderContainer}>
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>{t('farmerHome.recentEvents')}</Text>
              {recentEvents.length > 0 && (
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={() => {
                    // Navigate to Events tab and ensure we're on the Events list screen
                    tabNavigation.dispatch(
                      CommonActions.navigate({
                        name: SCREEN_NAMES.Events,
                        params: {
                          screen: SCREEN_NAMES.Events,
                        },
                      }),
                    );
                  }}>
                  <Text style={dynamicStyles.seeAllText}>{t('home.seeAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {recentEvents.length > 0 ? (
              <FlatList
                data={recentEvents}
                renderItem={renderEventCard}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingLeft: moderateScale(16),
                  paddingRight: moderateScale(16),
                }}
              />
            ) : (
              <View style={{alignItems: 'center', justifyContent: 'center', paddingVertical: moderateScale(40), paddingHorizontal: moderateScale(16)}}>
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
            )}
          </View>

          {/* Recent Stories Section */}
          <View style={dynamicStyles.eventSliderContainer}>
            <View style={dynamicStyles.sectionHeader}>
              <Text style={dynamicStyles.sectionTitle}>{t('farmerHome.recentStories')}</Text>
              {recentStories.length > 0 && (
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => {
                    // Navigate to Stories tab and ensure we're on the Stories list screen
                    tabNavigation.dispatch(
                      CommonActions.navigate({
                        name: SCREEN_NAMES.Stories,
                        params: {
                          screen: SCREEN_NAMES.Stories,
                        },
                      }),
                    );
                  }}>
                  <Text style={dynamicStyles.seeAllText}>{t('home.seeAll')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {recentStories.length > 0 ? (
              <FlatList
                data={recentStories}
                renderItem={renderStoryCard}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingLeft: moderateScale(16),
                  paddingRight: moderateScale(16),
                }}
              />
            ) : (
              <View style={{alignItems: 'center', justifyContent: 'center', paddingVertical: moderateScale(40), paddingHorizontal: moderateScale(16)}}>
                <Image 
                  source={ImagePath.noStory} 
                  style={{
                    width: moderateScale(200),
                    height: moderateScale(200),
                    resizeMode: 'contain',
                    marginBottom: moderateScale(20),
                  }}
                />
                <Text style={[Typography.boldXl, {color: colors.textPrimary, fontSize: moderateScale(20)}]}>
                  {t('stories.noStoriesFound')}
                </Text>
              </View>
            )}
          </View>

        {/* Membership Services Section */}
        <View style={{backgroundColor:colors.white,marginHorizontal:moderateScale(16),borderRadius:moderateScale(10),paddingTop:moderateScale(15)}}>
        <View
          style={[
            dynamicStyles.sectionHeader,
            {marginBottom: moderateScale(12)},
          ]}>
          <Text style={dynamicStyles.sectionTitle}>{t('farmerHome.membershipServices')}</Text>
        </View>
          {membershipServices.map(service => renderServiceCard(service))}
        </View>
            </>
          )}
        </ScrollView>
      )}

      {/* Video Modal */}
<Modal
        visible={showVideoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowVideoModal(false);
          setSelectedVideoId(null);
          startAnnouncementAutoSlide();
        }}>
        <View style={dynamicStyles.videoModalOverlay}>
        <TouchableOpacity
                style={dynamicStyles.videoModalCloseButton}
                onPress={() => {
                  setShowVideoModal(false);
                  setSelectedVideoId(null);
                  startAnnouncementAutoSlide();
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
              startAnnouncementAutoSlide();
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

      {/* Image Preview Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowImageModal(false);
          setSelectedImageUrl(null);
          startAnnouncementAutoSlide();
        }}>
        <View style={dynamicStyles.imageModalOverlay}>
          <ScrollView
            style={dynamicStyles.imageModalScrollView}
            contentContainerStyle={dynamicStyles.imageModalImageContainer}
            minimumZoomScale={1}
            maximumZoomScale={3}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bouncesZoom={true}>
            {selectedImageUrl && (
              <Image
                source={{uri: selectedImageUrl}}
                style={dynamicStyles.imageModalImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>
          <TouchableOpacity
            style={dynamicStyles.imageModalCloseButton}
            onPress={() => {
              setShowImageModal(false);
              setSelectedImageUrl(null);
              startAnnouncementAutoSlide();
            }}
            activeOpacity={0.7}>
            <Ionicons
              name="close"
              size={moderateScale(24)}
              color={colors.textWhite}
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}
