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
  type: 'event' | 'story' | 'other';
  isRead: boolean;
  hasArrow?: boolean;
  firstName?: string;
  lastName?: string;
  rejectionReason?: string;
  status?: NotificationStatus;
  referenceId?: string | number;
  clickAction?: string;
  eventId?: string;
  storyId?: string;
  dataType?: string; // data.type from API response
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
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

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    // If timestamp is already formatted, return as is
    if (timestamp && timestamp.includes('AM') || timestamp.includes('PM')) {
      return timestamp;
    }
    // Otherwise, try to format it
    try {
      const date = new Date(timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    } catch (e) {
      return timestamp;
    }
  };

  // Transform API response to NotificationItem
  const transformNotification = (item: any): NotificationItem => {
    const notificationData = item.data || {};
    return {
      id: item.id?.toString() || item.notification_id?.toString() || String(Math.random()),
      title: item.title || item.message || 'Notification',
      description: item.description || item.body || item.message || '',
      timestamp: formatTimestamp(item.createdAt || item.created_at || item.timestamp || item.date || ''),
      type: item.type || 'other',
      isRead: item.is_read === true || item.isRead === true || false,
      hasArrow: item.has_arrow !== false,
      firstName: item.first_name || item.firstName || '',
      lastName: item.last_name || item.lastName || '',
      rejectionReason: item.rejection_reason || item.rejectionReason || '',
      status: item.status || undefined,
      referenceId: item.reference_id || item.referenceId,
      clickAction: notificationData.click_action || notificationData.clickAction,
      eventId: notificationData.event_id || notificationData.eventId,
      storyId: notificationData.story_id || notificationData.storyId,
      dataType: notificationData.type || item.type || 'other', // data.type from API response
    };
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (showRefreshing = false) => {
    // Prevent multiple simultaneous API calls
    if (isFetchingRef.current) {
      console.log('[NotificationsScreen] Already fetching, skipping duplicate call');
      return;
    }

    try {
      isFetchingRef.current = true;

      // Check if farmer is logged in
      const loggedIn = await isLoggedIn();
      const role = await getUserRole();
      
      if (!loggedIn || role !== 'farmer') {
        console.log('[NotificationsScreen] Farmer not logged in, skipping API call');
        isFetchingRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
        return;
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

      console.log('[NotificationsScreen] Fetching notifications - Page:', page, 'Limit:', limit);
      
      const response = await getData(Apis.FARMER_PUSH_NOTIFICATIONS, params);
      
      console.log('[NotificationsScreen] Notifications API Response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        // Handle response structure
        const notificationsArray = response.data.notifications || 
                                   response.data.list || 
                                   response.data.data ||
                                   (Array.isArray(response.data) ? response.data : []);
        
        if (mountedRef.current) {
          if (Array.isArray(notificationsArray)) {
            const transformedNotifications = notificationsArray.map(transformNotification);
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
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      const readUrl = `${Apis.FARMER_PUSH_NOTIFICATION_READ}/${notificationId}/read`;
      console.log('[NotificationsScreen] Marking notification as read:', notificationId);
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
          padding: moderateScale(16),
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
        timestamp: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
          marginTop: moderateScale(2),
        },
        arrowIcon: {
          marginLeft: moderateScale(8),
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
    [moderateScale, insets.top, insets.bottom],
  );

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Handle notification press - navigate to details or show modal
    if (notification.status === 'failed') {
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

  const handleViewForm = () => {
    // Handle view form action
    console.log('View form for:', selectedNotification?.id);
    // You can add navigation logic here if needed
    handleCloseModal();
  };

  // Render notification item
  const renderNotificationItem = ({item}: {item: NotificationItem}) => {
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
            {/* Timestamp */}
            <Text style={styles.timestamp}>
              {item.timestamp}
            </Text>
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
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
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
                containerStyle={styles.modalInputContainer}
              />

              {/* Last Name Input */}
              <SimpleBoxInput
                label={t('notifications.lastName')}
                value={lastName}
                onChangeText={setLastName}
                placeholder={t('notifications.enterLastName')}
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


