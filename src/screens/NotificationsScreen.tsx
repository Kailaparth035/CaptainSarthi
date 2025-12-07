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
import {STRINGS} from '../constants/strings';
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
  name: string;
  subtitle: string;
  status: NotificationStatus;
  hasArrow?: boolean;
  firstName?: string;
  lastName?: string;
  rejectionReason?: string;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
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

  // Sample notification data
  const notifications: NotificationItem[] = [
    {
      id: '1',
      name: 'David wills',
      subtitle: 'Verification complete • Send login details',
      status: 'complete',
    },
    {
      id: '2',
      name: 'David wills',
      subtitle: 'Verification pending',
      status: 'pending',
    },
    {
      id: '3',
      name: 'Cody rollins',
      subtitle: 'Verification failed • See rejection reason',
      status: 'failed',
      hasArrow: true,
      firstName: 'Michael',
      lastName: 'Harris',
      rejectionReason:
        "Farmer's name is not same in Aadhar card and PAN card.",
    },
  ];

  const getStatusIcon = (status: NotificationStatus) => {
    switch (status) {
      case 'complete':
        return {
          icon: 'checkmark',
          color: colors.statusSuccess,
          bgColor: colors.statusSuccess,
        };
      case 'pending':
        return {
          icon: 'alert-circle',
          color: colors.statusWarning,
          bgColor: colors.statusWarning,
        };
      case 'failed':
        return {
          icon: 'close',
          color: colors.statusError,
          bgColor: colors.statusError,
        };
      default:
        return {
          icon: 'alert-circle',
          color: colors.textTertiary,
          bgColor: colors.textTertiary,
        };
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
          paddingTop: insets.top,
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
        },
        scrollContent: {
          padding: moderateScale(16),
          paddingBottom: moderateScale(100),
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          shadowColor: colors.shadowColor,
          shadowOpacity: 0.08,
          shadowOffset: {width: 0, height: moderateScale(4)},
          shadowRadius: moderateScale(10),
          elevation: 4,
        },
        notificationItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: moderateScale(12),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        lastNotificationItem: {
          borderBottomWidth: 0,
        },
        iconContainer: {
          width: moderateScale(48),
          height: moderateScale(48),
          borderRadius: moderateScale(24),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
          position: 'relative',
        },
        statusBadge: {
          position: 'absolute',
          bottom: moderateScale(-2),
          right: moderateScale(-2),
          width: moderateScale(18),
          height: moderateScale(18),
          borderRadius: moderateScale(9),
          borderWidth: moderateScale(2),
          borderColor: colors.backgroundWhite,
          alignItems: 'center',
          justifyContent: 'center',
        },
        notificationContent: {
          flex: 1,
        },
        notificationName: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        notificationSubtitle: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
          lineHeight: moderateScale(16),
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
          paddingBottom: insets.bottom + moderateScale(20),
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
    // Handle notification press - show modal for failed notifications
    if (notification.status === 'failed') {
      setSelectedNotification(notification);
      setFirstName(notification.firstName || '');
      setLastName(notification.lastName || '');
      setRejectionReason(notification.rejectionReason || '');
      setShowFailedModal(true);
    } else if (notification.hasArrow) {
      console.log('Navigate to notification details:', notification.id);
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
        <Text style={styles.headerTitle}>{STRINGS.notifications.title}</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Notifications Card */}
        <View style={styles.card}>
          {notifications.map((notification, index) => {
            const statusIcon = getStatusIcon(notification.status);
            const isLast = index === notifications.length - 1;

            return (
              <Pressable
                key={notification.id}
                style={[
                  styles.notificationItem,
                  isLast && styles.lastNotificationItem,
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}>
                {/* Icon with Status Badge */}
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="person"
                    size={moderateScale(24)}
                    color={colors.textTertiary}
                  />
                  <View
                    style={[
                      styles.statusBadge,
                      {backgroundColor: statusIcon.bgColor},
                    ]}>
                    <Ionicons
                      name={statusIcon.icon}
                      size={moderateScale(10)}
                      color={colors.textWhite}
                    />
                  </View>
                </View>

                {/* Notification Content */}
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationName}>
                    {notification.name}
                  </Text>
                  <Text style={styles.notificationSubtitle}>
                    {notification.subtitle}
                  </Text>
                </View>

                {/* Arrow Icon (if applicable) */}
                {notification.hasArrow && (
                  <Ionicons
                    name="chevron-forward"
                    size={moderateScale(20)}
                    color={colors.textTertiary}
                    style={styles.arrowIcon}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
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
                  {STRINGS.notifications.verificationFailed}
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
                label={STRINGS.notifications.firstName}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Enter first name"
                containerStyle={styles.modalInputContainer}
              />

              {/* Last Name Input */}
              <SimpleBoxInput
                label={STRINGS.notifications.lastName}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Enter last name"
                containerStyle={styles.modalInputContainer}
              />

              {/* Rejection Reason Text Area */}
              <SimpleBoxInput
                label={STRINGS.notifications.rejectionReason}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Enter rejection reason"
                multiline={true}
                textAlignVertical="top"
                containerStyle={styles.modalInputContainer}
              />

              {/* View Form Button */}
              <Button
                title={STRINGS.notifications.viewForm}
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

