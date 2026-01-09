import React, {useMemo, useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import {ImagePath} from '../assets/images';
import {RootStackParamList} from '../navigation/RootNavigator';
import {FarmerTabParamList} from '../navigation/FarmerTabNavigator';
import {TabParamList} from '../navigation/TabNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import {useLanguage} from '../contexts/LanguageContext';
import colors from '../utils/colors';
import {Typography} from '../utils/typography';
import useDeviceMetrics from '../utils/responsiveCustom';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import Button from '../components/Button';
import SimpleBoxInput from '../components/FloatingInput';
import {getData, putData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {isLoggedIn, getUserRole} from '../utils/session';

type NotificationsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Notifications'
>;

type NotificationStatus = 'complete' | 'pending' | 'failed';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  date?: string;
  time?: string;
  type: 'event' | 'story' | 'other';
  isRead: boolean;
  hasArrow?: boolean;
  firstName?: string;
  lastName?: string;
  rejectionReason?: string;
  status?: NotificationStatus;
  referenceId?: string | number;
  farmerId?: string; // Store farmer ID from notification data
  clickAction?: string;
  eventId?: string;
  storyId?: string;
  dataType?: string; // data.type from API response
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {moderateScale, deviceHeight} = useDeviceMetrics();
  const {t} = useLanguage();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList & TabParamList>>();
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // API state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState<'farmer' | 'dealer' | null>(null);
  const [farmerList, setFarmerList] = useState<any[]>([]); // Store farmer list for dealer role
  
  // API request parameters
  const page = 1;
  const limit = 20; // Fetch 50 notifications at once
  
  // Ref to prevent multiple simultaneous API calls
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Match status bar with light grey background
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const getNotificationIcon = (type: string, dataType?: string) => {
    // Use dataType if available, otherwise fall back to type
    const notificationType = dataType || type;
    
    switch (notificationType) {
      case 'event':
        return ImagePath.eventNotification;
      case 'story':
        return ImagePath.story;
      default:
        return null; // Return null for default, we'll handle it in the render
    }
  };

  // Format timestamp to return date and time separately
  const formatTimestamp = (timestamp: string): {date: string; time: string} => {
    try {
      const date = new Date(timestamp);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return {date: '', time: timestamp || ''};
      }
      
      // Format date (e.g., "15 Jan 2025" or "Today", "Yesterday")
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const isToday = date.toDateString() === today.toDateString();
      const isYesterday = date.toDateString() === yesterday.toDateString();
      
      let formattedDate = '';
      if (isToday) {
        formattedDate = 'Today';
      } else if (isYesterday) {
        formattedDate = 'Yesterday';
      } else {
        const day = date.getDate();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        formattedDate = `${day} ${month} ${year}`;
      }
      
      // Format time (e.g., "1:15 PM")
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const formattedTime = `${formattedHours}:${formattedMinutes} ${ampm}`;
      
      return {date: formattedDate, time: formattedTime};
    } catch (e) {
      // If timestamp is already formatted (contains AM/PM), try to extract time
      if (timestamp && (timestamp.includes('AM') || timestamp.includes('PM'))) {
        return {date: '', time: timestamp};
      }
      return {date: '', time: timestamp || ''};
    }
  };

  // Transform API response to NotificationItem
  const transformNotification = (item: any, farmers: any[] = []): NotificationItem => {
    const notificationData = item.data || {};
    const timestampData = formatTimestamp(item.createdAt || item.created_at || item.timestamp || item.date || '');
    
    // Extract status from data.status ("0" = pending, "1" = complete, "2" = failed/rejected)
    let status: NotificationStatus | undefined;
    const statusCode = notificationData.status?.toString() || item.status?.toString();
    if (statusCode === '1') {
      status = 'complete';
    } else if (statusCode === '0') {
      status = 'pending';
    } else if (statusCode === '2') {
      status = 'failed';
    } else if (item.description || item.body || item.message) {
      // Fallback to text parsing if status code not available
      const desc = (item.description || item.body || item.message || '').toLowerCase();
      if (desc.includes('complete') || desc.includes('verified')) {
        status = 'complete';
      } else if (desc.includes('pending')) {
        status = 'pending';
      } else if (desc.includes('failed') || desc.includes('reject')) {
        status = 'failed';
      }
    }
    
    // Extract farmer_id from notification data
    const farmerIdFromNotification = notificationData.farmer_id?.toString() || notificationData.reference_id?.toString();
    
    // Find farmer from farmer list (use passed parameter or state)
    const farmersToSearch = farmers.length > 0 ? farmers : farmerList;
    let farmerFirstName = '';
    let farmerLastName = '';
    if (farmerIdFromNotification && farmersToSearch.length > 0) {
      const farmer = farmersToSearch.find((f: any) => 
        f.id?.toString() === farmerIdFromNotification || 
        f.farmer_id?.toString() === farmerIdFromNotification
      );
      if (farmer) {
        farmerFirstName = farmer.first_name || farmer.firstName || '';
        farmerLastName = farmer.last_name || farmer.lastName || '';
      }
    }
    
    // Extract rejection reason from body (format: "Farmer xyz has been rejected. Reason: reason text")
    let rejectionReason = '';
    const body = item.body || item.description || '';
    if (status === 'failed' && body) {
      const reasonMatch = body.match(/Reason:\s*(.+)/i);
      if (reasonMatch && reasonMatch[1]) {
        rejectionReason = reasonMatch[1].trim();
      }
    }
    
    return {
      id: item.id?.toString() || item.notification_id?.toString() || String(Math.random()),
      title: item.title || item.message || 'Notification',
      description: item.description || item.body || item.message || '',
      timestamp: item.createdAt || item.created_at || item.timestamp || item.date || '',
      date: timestampData.date,
      time: timestampData.time,
      type: item.type || 'other',
      isRead: item.is_read === true || item.isRead === true || false,
      hasArrow: item.has_arrow !== false,
      firstName: farmerFirstName || item.first_name || item.firstName || notificationData.first_name || notificationData.firstName || '',
      lastName: farmerLastName || item.last_name || item.lastName || notificationData.last_name || notificationData.lastName || '',
      rejectionReason: rejectionReason || item.rejection_reason || item.rejectionReason || notificationData.rejection_reason || notificationData.rejectionReason || '',
      status: status,
      referenceId: item.reference_id || item.referenceId || farmerIdFromNotification,
      farmerId: farmerIdFromNotification, // Store farmer ID for matching
      clickAction: notificationData.click_action || notificationData.clickAction,
      eventId: notificationData.event_id || notificationData.eventId,
      storyId: notificationData.story_id || notificationData.storyId,
      dataType: notificationData.type || item.type || 'other', // data.type from API response
    };
  };

  // Fetch farmer list for dealer role
  const fetchFarmerList = useCallback(async (): Promise<any[]> => {
    try {
      const role = await getUserRole();
      if (role !== 'dealer') {
        return []; // Only fetch for dealer role
      }
      
      console.log('[NotificationsScreen] Fetching farmer list for dealer');
      const response = await getData(Apis.DEALER_FARMERS, {});
      
      if (response?.status === true && response?.data) {
        const farmersArray = response.data.farmers || 
                           (Array.isArray(response.data) ? response.data : []);
        
        if (mountedRef.current && Array.isArray(farmersArray)) {
          setFarmerList(farmersArray);
          console.log('[NotificationsScreen] Farmer list fetched:', farmersArray.length, 'farmers');
          return farmersArray;
        }
      }
      return [];
    } catch (error) {
      console.error('[NotificationsScreen] Error fetching farmer list:', error);
      return [];
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (showRefreshing = false) => {
    // Prevent multiple simultaneous API calls
    if (isFetchingRef.current) {
      console.log('[NotificationsScreen] Already fetching, skipping duplicate call');
      return;
    }

    try {
      isFetchingRef.current = true;

      // Check if user is logged in
      const loggedIn = await isLoggedIn();
      const role = await getUserRole();
      
      // Store role in state
      if (mountedRef.current) {
        setUserRole(role as 'farmer' | 'dealer' | null);
      }
      
      if (!loggedIn) {
        console.log('[NotificationsScreen] User not logged in, skipping API call');
        isFetchingRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
        return;
      }
      
      console.log("role ::",role);

      // Determine API endpoint based on role
      const apiEndpoint = role === 'farmer' 
        ? Apis.FARMER_PUSH_NOTIFICATIONS 
        : Apis.DEALER_PUSH_NOTIFICATIONS;

      // Fetch farmer list if dealer role (before notifications to match farmer IDs)
      let farmersList: any[] = [];
      if (role === 'dealer') {
        farmersList = await fetchFarmerList();
      }

      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Pass page and limit as query parameters
      const params = {
        page: page.toString(),
        limit: limit.toString(),
      };

      console.log('[NotificationsScreen] Fetching notifications - Role:', role, 'Page:', page, 'Limit:', limit);
      
      const response = await getData(apiEndpoint, params);
      
      console.log('[NotificationsScreen] Notifications API Response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        // Handle response structure
        const notificationsArray = response.data.notifications || 
                                   response.data.list || 
                                   response.data.data ||
                                   (Array.isArray(response.data) ? response.data : []);
        
        if (mountedRef.current) {
          if (Array.isArray(notificationsArray)) {
            // Transform notifications with farmer list passed as parameter
            const transformedNotifications = notificationsArray.map((item: any) => transformNotification(item, farmersList));
            setNotifications(transformedNotifications);
          } else {
            console.warn('[NotificationsScreen] Unexpected notifications array format');
            setNotifications([]);
          }
        }
      } else {
        console.warn('[NotificationsScreen] Unexpected API response format:', response);
        if (mountedRef.current) {
          setNotifications([]);
        }
      }
    } catch (error) {
      console.error('[NotificationsScreen] Error fetching notifications:', error);
      if (mountedRef.current) {
        setNotifications([]);
      }
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetchFarmerList]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      // Determine API endpoint based on role
      const role = await getUserRole();
      const apiEndpoint = role === 'farmer' 
        ? Apis.FARMER_PUSH_NOTIFICATION_READ 
        : Apis.DEALER_PUSH_NOTIFICATION_READ;
      
      const readUrl = `${apiEndpoint}/${notificationId}/read`;
      console.log('[NotificationsScreen] Marking notification as read:', notificationId, 'Role:', role);
      const response = await putData(readUrl, {});
      console.log('[NotificationsScreen] Mark as read response:', response);
      
      // Update local state to mark as read
      if (mountedRef.current) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? {...notif, isRead: true}
              : notif
          )
        );
      }
      return response;
    } catch (error) {
      console.error('[NotificationsScreen] Error marking notification as read:', error);
      return null;
    }
  }, []);

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Fetch notifications on mount (only once)
  useEffect(() => {
    mountedRef.current = true;
    fetchNotifications(false);
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      isFetchingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - fetchNotifications is stable with no dependencies

  // Refresh notifications when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[NotificationsScreen] Screen focused, refreshing notifications');
      fetchNotifications(true);
    }, [fetchNotifications])
  );

  const styles = useMemo(
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
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        headerTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
        },
        scrollContent: {
          padding: moderateScale(16),
          paddingBottom: moderateScale(100),
        },
        listContent: {
          padding: moderateScale(0),
          paddingBottom: moderateScale(100),
        },
        skeletonContainer: {
          padding: moderateScale(16),
        },
        notificationCard: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(12),
          marginBottom: moderateScale(12),
          shadowColor: colors.shadowColor,
          shadowOpacity: 0.08,
          shadowOffset: {width: 0, height: moderateScale(4)},
          shadowRadius: moderateScale(10),
          elevation: 4,
        },
        notificationItem: {
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        iconContainer: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(24),
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.backgroundWhite,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        notificationContent: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        },
        notificationTextContainer: {
          flex: 1,
          marginRight: moderateScale(8),
        },
        notificationTitleRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(4),
        },
        notificationTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginRight: moderateScale(6),
        },
        unreadDot: {
          width: moderateScale(8),
          height: moderateScale(8),
          borderRadius: moderateScale(4),
          backgroundColor: '#FF3B30', // Red color for unread indicator
        },
        notificationDescription: {
          ...Typography.regularSm,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
          lineHeight: moderateScale(20),
        },
        timestampContainer: {
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
        },
        timestampDate: {
          ...Typography.regularSm,
          fontSize: moderateScale(11),
          color: colors.textTertiary,
          marginBottom: moderateScale(2),
        },
        timestampTime: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
        },
        arrowIcon: {
          marginLeft: moderateScale(8),
        },
        // Dealer Notification Styles - Container for all notifications
        dealerNotificationContainer: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          marginTop: moderateScale(16),
          marginBottom: moderateScale(16),
          marginHorizontal: moderateScale(16),
          shadowColor: colors.shadowColor,
          shadowOpacity: 0.08,
          shadowOffset: {width: 0, height: moderateScale(4)},
          shadowRadius: moderateScale(10),
          elevation: 4,
          overflow: 'hidden',
          height: deviceHeight - insets.top - moderateScale(110), // Fixed height: screen height minus header and padding
        },
        dealerNotificationScrollContainer: {
          flex: 1,
        },
        dealerNotificationCard: {
          padding: moderateScale(16),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        dealerNotificationCardLast: {
          borderBottomWidth: 0,
        },
        dealerNotificationItem: {
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        dealerIconContainer: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(15),
        },
        dealerNotificationContent: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        },
        dealerNotificationTextContainer: {
          flex: 1,
          marginRight: moderateScale(12),
        },
        dealerNotificationName: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        dealerNotificationDescription: {
          ...Typography.regularSm,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
          lineHeight: moderateScale(20),
        },
        dealerRightContainer: {
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
        },
        dealerTimestampContainer: {
          alignItems: 'flex-end',
          marginBottom: moderateScale(8),
        },
        dealerTimestampDate: {
          ...Typography.regularSm,
          fontSize: moderateScale(11),
          color: colors.textTertiary,
          marginBottom: moderateScale(2),
        },
        dealerTimestampTime: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
        },
        dealerStatusContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        },
        dealerArrow: {
          marginRight: moderateScale(4),
        },
        statusIconContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft:moderateScale(7),
          bottom:moderateScale(2)
        },
        dealerUnreadDot: {
          position: 'absolute',
          top: moderateScale(-2),
          right: moderateScale(-2),
          width: moderateScale(12),
          height: moderateScale(12),
          borderRadius: moderateScale(6),
          backgroundColor: '#FF9500', // Orange color for unread
          borderWidth: 2,
          borderColor: colors.backgroundWhite,
        },
        statusIconCircleGreen: {
          width: moderateScale(13),
          height: moderateScale(13),
          borderRadius: moderateScale(12),
          backgroundColor: '#34C759',
          alignItems: 'center',
          justifyContent: 'center',
        },
        statusIconCircleYellow: {
          width: moderateScale(13),
          height: moderateScale(13),
          borderRadius: moderateScale(12),
          backgroundColor: '#FF9500',
          alignItems: 'center',
          justifyContent: 'center',
        },
        statusIconCircleRed: {
          width: moderateScale(15),
          height: moderateScale(15),
          borderRadius: moderateScale(12),
          backgroundColor: '#FF3B30',
          alignItems: 'center',
          justifyContent: 'center',
        },
        // Bottom Sheet Modal styles
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        modalContainer: {
          backgroundColor: colors.backgroundWhite,
          borderTopLeftRadius: moderateScale(20),
          borderTopRightRadius: moderateScale(20),
          width: '100%',
          padding: moderateScale(20),
          paddingBottom: insets.bottom + moderateScale(12),
          shadowColor: colors.shadowColor,
          shadowOpacity: 0.25,
          shadowOffset: {width: 0, height: moderateScale(-4)},
          shadowRadius: moderateScale(10),
          elevation: 8,
          maxHeight: '90%',
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(20),
        },
        modalTitle: {
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
        },
        closeButton: {
          width: moderateScale(32),
          height: moderateScale(32),
          borderRadius: moderateScale(16),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        modalButton: {
          marginTop: moderateScale(20),
          marginBottom:moderateScale(10)
        },
        modalInputContainer: {
          marginBottom: moderateScale(0),
        },
      }),
    [moderateScale, insets.top, insets.bottom, deviceHeight],
  );

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Handle notification press - navigate to details or show modal
    // For dealer role, show failed modal for failed status
    if (userRole === 'dealer' && notification.status === 'failed') {
      setSelectedNotification(notification);
      setFirstName(notification.firstName || '');
      setLastName(notification.lastName || '');
      setRejectionReason(notification.rejectionReason || '');
      setShowFailedModal(true);
      // Mark as read when opening modal
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
      }
    } else if (notification.status === 'failed') {
      // For farmer role or other cases
      setSelectedNotification(notification);
      setFirstName(notification.firstName || '');
      setLastName(notification.lastName || '');
      setRejectionReason(notification.rejectionReason || '');
      setShowFailedModal(true);
    } else {
      // Mark notification as read before navigating
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
      }
      
      // Navigate based on data.type from notification data
      const dataType = notification.dataType;
      const eventId = notification.eventId;
      const storyId = notification.storyId;
      
      if (dataType === 'event' && eventId) {
        // Navigate to Events tab and then to EventDetails
        tabNavigation.navigate(SCREEN_NAMES.Events, {
          screen: SCREEN_NAMES.EventDetails,
          params: {
            eventId: eventId,
            fromScreen: 'Notifications',
          },
        } as any);
      } else if (dataType === 'story' && storyId) {
        // Navigate to Stories tab and then to StoryDetails
        tabNavigation.navigate(SCREEN_NAMES.Stories, {
          screen: SCREEN_NAMES.StoryDetails,
          params: {
            storyId: storyId,
            fromScreen: 'Notifications',
          },
        } as any);
      } else {
        console.log('No navigation action for notification:', notification.id, 'dataType:', dataType);
      }
    }
  };

  const handleCloseModal = () => {
    setShowFailedModal(false);
    setSelectedNotification(null);
    setFirstName('');
    setLastName('');
    setRejectionReason('');
  };

  const handleViewForm = async () => {
    // Handle view form action - navigate to AddFarmerScreen in edit mode
    // Use farmerId if available (from notification data), otherwise use referenceId
    const farmerId = selectedNotification?.farmerId || selectedNotification?.referenceId;
    
    if (farmerId) {
      console.log('[NotificationsScreen] View form clicked - Farmer ID:', farmerId);
      
      // Close modal first
      handleCloseModal();
      
      // Small delay to ensure modal is closed before navigation
      setTimeout(() => {
        // Navigate to AddFarmerScreen with farmer ID for edit mode
        // Since NotificationsScreen is in HomeStack and AddFarmer is in FarmerStack,
        // we need to navigate to the Farmer tab first, then to AddFarmer screen
        try {
          console.log('[NotificationsScreen] Attempting navigation to AddFarmer with params:', {
            farmerId: farmerId.toString(),
            editMode: true,
          });
          
          // Use tabNavigation to navigate across tabs
          // Pass rejectedUpdate: true to indicate this is a rejected update flow
          tabNavigation.navigate(SCREEN_NAMES.Farmer, {
            screen: SCREEN_NAMES.AddFarmer,
            params: {
              farmerId: farmerId.toString(),
              rejectedUpdate: true, // Third flow: rejected update from notifications
            },
          } as any);
          
          console.log('[NotificationsScreen] Navigation successful');
        } catch (error) {
          console.error('[NotificationsScreen] Error navigating with tabNavigation:', error);
          // Fallback: try using navigation prop with nested navigation
          try {
            (navigation as any).navigate(SCREEN_NAMES.Farmer, {
              screen: SCREEN_NAMES.AddFarmer,
              params: {
                farmerId: farmerId.toString(),
                rejectedUpdate: true, // Third flow: rejected update from notifications
              },
            });
            console.log('[NotificationsScreen] Fallback navigation successful');
          } catch (fallbackError) {
            console.error('[NotificationsScreen] Fallback navigation also failed:', fallbackError);
            // Navigation failed - user can manually navigate to Farmer tab
          }
        }
      }, 100);
    } else {
      console.log('[NotificationsScreen] No farmer ID found for notification:', selectedNotification?.id);
      handleCloseModal();
    }
  };

  // Get status icon for dealer notifications
  const getStatusIcon = (status?: NotificationStatus) => {
    switch (status) {
      case 'complete':
        return (
          <View style={styles.statusIconContainer}>
            <View style={styles.statusIconCircleGreen}>
              <Ionicons name="checkmark" size={moderateScale(10)} color="#FFFFFF" />
            </View>
          </View>
        );
      case 'pending':
        return (
          <View style={styles.statusIconContainer}>
            <View style={styles.statusIconCircleYellow}>
              <Ionicons name="alert" size={moderateScale(10)} color="#FFFFFF" />
            </View>
          </View>
        );
      case 'failed':
        return (
          <View style={styles.statusIconContainer}>
            <View style={styles.statusIconCircleRed}>
              <Ionicons name="close" size={moderateScale(10)} color="#FFFFFF" />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // Render dealer notification item (matching the image design)
  const renderDealerNotificationItem = ({item, index}: {item: NotificationItem; index: number}) => {
    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.title || 'Unknown';
    const status = item.status;
    const isLast = index === notifications.length - 1;
    
    // Build status message: title • body (if title contains status)
    // Format: "Verification complete • Send login details" or "Verification pending" or "Verification failed • See rejection reason"
    let statusMessage = '';
    const title = item.title || '';
    const body = item.description || item.body || '';
    
    if (status === 'complete' || status === 'pending' || status === 'failed') {
      // Extract status text from title if it contains verification status
      if (title.toLowerCase().includes('verified') || title.toLowerCase().includes('complete')) {
        statusMessage = title;
        if (body && !title.toLowerCase().includes(body.toLowerCase())) {
          statusMessage += ` • ${body}`;
        }
      } else if (title.toLowerCase().includes('rejected') || title.toLowerCase().includes('failed')) {
        statusMessage = title;
        if (body && !title.toLowerCase().includes(body.toLowerCase())) {
          statusMessage += ` • ${body}`;
        }
      } else {
        // Use title first, then add body with dot separator
        statusMessage = title || 'Verification';
        if (body && body !== title) {
          statusMessage += ` • ${body}`;
        }
      }
    } else {
      // For other notification types
      statusMessage = title;
      if (body && body !== title) {
        statusMessage += ` • ${body}`;
      }
    }

    return (
      <Pressable
        style={[
          styles.dealerNotificationCard,
          isLast && styles.dealerNotificationCardLast,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.dealerNotificationItem}>
          {/* User Icon with Unread Orange Dot */}
          <View style={styles.dealerIconContainer}>
            <Ionicons
              name="people-outline"
              size={moderateScale(22)}
              color={colors.textSecondary}
            />
            {!item.isRead && <View style={styles.dealerUnreadDot} />}
          </View>

          {/* Notification Content */}
          <View style={styles.dealerNotificationContent}>
            <View style={styles.dealerNotificationTextContainer}>
              {/* User Name */}
              <View style={styles.dealerStatusContainer}>
                <Text style={styles.dealerNotificationName} numberOfLines={1}>
                  {fullName}
                </Text>
                {getStatusIcon(status)}
              </View>
              {/* Status Message with dot separator */}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.dealerNotificationDescription}
              >
                {statusMessage}
              </Text>
            </View>

            {/* Right Side: Date, Time, and Status Icon */}
            <View style={styles.dealerRightContainer}>
              {/* Date and Time */}
              <View style={styles.dealerTimestampContainer}>
                {item.date ? (
                  <Text style={styles.dealerTimestampDate}>{item.date}</Text>
                ) : null}
                {item.time ? (
                  <Text style={styles.dealerTimestampTime}>{item.time}</Text>
                ) : item.timestamp ? (
                  <Text style={styles.dealerTimestampTime}>
                    {item.timestamp}
                  </Text>
                ) : null}
              </View>

              {/* Status Icon and Arrow (only for failed) */}

              {/* {status === 'failed' && (
                  <Ionicons
                    name="chevron-forward"
                    size={moderateScale(20)}
                    color={colors.textSecondary}
                    style={styles.dealerArrow}
                  />
                )} */}
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  // Render notification item (farmer or dealer)
  const renderNotificationItem = ({item, index}: {item: NotificationItem; index: number}) => {
    // Use dealer UI if user is a dealer
    if (userRole === 'dealer') {
      return renderDealerNotificationItem({item, index});
    }

    // Use farmer UI (original design)
    const iconSource = getNotificationIcon(item.type, item.dataType);

    return (
      <Pressable
        style={styles.notificationCard}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}>
        <View style={styles.notificationItem}>
          {/* Icon Container */}
          <View style={styles.iconContainer}>
            {iconSource ? (
              <Image
                source={iconSource}
                style={{
                  width: moderateScale(20),
                  height: moderateScale(20),
                }}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name="notifications-outline"
                size={moderateScale(24)}
                color={colors.textPrimary}
              />
            )}
          </View>

          {/* Notification Content */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationTextContainer}>
              {/* Title with Unread Dot */}
              <View style={styles.notificationTitleRow}>
                <Text style={styles.notificationTitle}>
                  {item.title}
                </Text>
                {!item.isRead && (
                  <View style={styles.unreadDot} />
                )}
              </View>
              {/* Description */}
              <Text
              numberOfLines={1}
              ellipsizeMode='tail'
              style={styles.notificationDescription}>
                {item.description}
              </Text>
            </View>
            {/* Date and Time */}
            <View style={styles.timestampContainer}>
              {item.date ? (
                <Text style={styles.timestampDate}>{item.date}</Text>
              ) : null}
              {item.time ? (
                <Text style={styles.timestampTime}>{item.time}</Text>
              ) : item.timestamp ? (
                <Text style={styles.timestampTime}>{item.timestamp}</Text>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  // Skeleton placeholder component
  const renderSkeleton = () => {
    return (
      <View style={styles.skeletonContainer}>
        <SkeletonPlaceholder
          backgroundColor={colors.backgroundGray}
          highlightColor={colors.backgroundWhite}
          borderRadius={moderateScale(10)}>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              backgroundColor={colors.backgroundWhite}
              borderRadius={moderateScale(12)}
              padding={moderateScale(16)}
              marginBottom={moderateScale(12)}
              flexDirection="row"
              alignItems="flex-start">
              {/* Icon Skeleton */}
              <SkeletonPlaceholder.Item
                width={moderateScale(48)}
                height={moderateScale(48)}
                borderRadius={moderateScale(24)}
                marginRight={moderateScale(12)}
              />
              {/* Content Skeleton */}
              <SkeletonPlaceholder.Item flex={1}>
                {/* Title Skeleton */}
                <SkeletonPlaceholder.Item
                  width="70%"
                  height={moderateScale(16)}
                  borderRadius={moderateScale(4)}
                  marginBottom={moderateScale(8)}
                />
                {/* Description Skeleton */}
                <SkeletonPlaceholder.Item
                  width="90%"
                  height={moderateScale(12)}
                  borderRadius={moderateScale(4)}
                  marginBottom={moderateScale(4)}
                />
                <SkeletonPlaceholder.Item
                  width="60%"
                  height={moderateScale(12)}
                  borderRadius={moderateScale(4)}
                />
              </SkeletonPlaceholder.Item>
              {/* Timestamp Skeleton */}
              <SkeletonPlaceholder.Item
                width={moderateScale(60)}
                height={moderateScale(12)}
                borderRadius={moderateScale(4)}
              />
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder>
      </View>
    );
  };

  // List empty component
  const ListEmptyComponent = () => {
    if (loading || refreshing) {
      return null;
    }
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: moderateScale(100), paddingBottom: moderateScale(50)}}>
        <Text style={[Typography.regularMd, {color: colors.textSecondary, fontSize: moderateScale(16)}]}>
          No notifications found
        </Text>
      </View>
    );
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
      </View>

      {/* Notifications List */}
      {loading && !refreshing ? (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {renderSkeleton()}
        </ScrollView>
      ) : userRole === 'dealer' ? (
        // Dealer notifications in a single white card container with fixed height and scrollable content
        <View style={{flex: 1}}>
          {notifications.length > 0 ? (
            <View style={styles.dealerNotificationContainer}>
              <ScrollView
                style={styles.dealerNotificationScrollContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                  />
                }>
                {notifications.map((notification, index) => (
                  <View key={notification.id}>
                    {renderNotificationItem({item: notification, index})}
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
              <ListEmptyComponent />
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({item, index}) => renderNotificationItem({item, index})}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={ListEmptyComponent}
        />
      )}

      {/* Verification Failed Bottom Sheet Modal */}
      <Modal
        visible={showFailedModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}>
        <Pressable
          style={styles.modalOverlay}
          onPress={handleCloseModal}
          activeOpacity={1}>
          <Pressable
            style={styles.modalContainer}
            onPress={e => e.stopPropagation()}
            activeOpacity={1}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('notifications.verificationFailed')}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                  activeOpacity={0.7}>
                  <Ionicons
                    name="close"
                    size={moderateScale(20)}
                    color={colors.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              {/* First Name Input */}
              <SimpleBoxInput
                label={t('notifications.firstName')}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={t('notifications.enterFirstName')}
                editable={false}
                containerStyle={styles.modalInputContainer}
              />

              {/* Last Name Input */}
              <SimpleBoxInput
                label={t('notifications.lastName')}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('notifications.enterLastName')}
                editable={false}
                containerStyle={styles.modalInputContainer}
              />

              {/* Rejection Reason Text Area */}
              <SimpleBoxInput
                label={t('notifications.rejectionReason')}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder={t('notifications.enterRejectionReason')}
                multiline={true}
                textAlignVertical="top"
                editable={false}
                containerStyle={styles.modalInputContainer}
              />

              {/* View Form Button */}
              <Button
                title={t('notifications.viewForm')}
                onPress={handleViewForm}
                style={styles.modalButton}
              />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default NotificationsScreen;


