import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {RootStackParamList} from '../navigation/RootNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import {useLanguage} from '../contexts/LanguageContext';
import colors from '../utils/colors';
import {Typography} from '../utils/typography';
import useDeviceMetrics from '../utils/responsiveCustom';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import Button from '../components/Button';
import SimpleBoxInput from '../components/FloatingInput';

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
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Match status bar with light grey background
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Sample notification data matching the image design
  const notifications: NotificationItem[] = [
    {
      id: '1',
      title: 'Annual meetup 2025',
      description: 'Captain Tractors proudly organized its Nat..',
      timestamp: '10:35 AM',
      type: 'event',
      isRead: false,
    },
    {
      id: '2',
      title: 'Captain added a story',
      description: 'Captain Tractors proudly organized its Nat..',
      timestamp: '10:35 AM',
      type: 'story',
      isRead: false,
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return 'calendar-outline';
      case 'story':
        return 'time-outline';
      default:
        return 'notifications-outline';
    }
  };

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
        notificationCard: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
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
          width: moderateScale(48),
          height: moderateScale(48),
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

  const handleNotificationPress = (notification: NotificationItem) => {
    // Handle notification press - navigate to details or show modal
    if (notification.status === 'failed') {
      setSelectedNotification(notification);
      setFirstName(notification.firstName || '');
      setLastName(notification.lastName || '');
      setRejectionReason(notification.rejectionReason || '');
      setShowFailedModal(true);
    } else {
      console.log('Navigate to notification details:', notification.id);
      // Navigate based on notification type
      // For events: navigate to event details
      // For stories: navigate to story details
      // You can add navigation logic here if needed
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

      {/* Scrollable Content */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Notifications - Each as separate card */}
        {notifications.map((notification) => {
          const iconName = getNotificationIcon(notification.type);

          return (
            <Pressable
              key={notification.id}
              style={styles.notificationCard}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.7}>
              <View style={styles.notificationItem}>
                {/* Icon Container */}
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={iconName}
                    size={moderateScale(24)}
                    color={colors.textPrimary}
                  />
                </View>

                {/* Notification Content */}
                <View style={styles.notificationContent}>
                  <View style={styles.notificationTextContainer}>
                    {/* Title with Unread Dot */}
                    <View style={styles.notificationTitleRow}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    {/* Description */}
                    <Text style={styles.notificationDescription}>
                      {notification.description}
                    </Text>
                  </View>
                  {/* Timestamp */}
                  <Text style={styles.timestamp}>
                    {notification.timestamp}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

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


