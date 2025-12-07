import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import LogoutModal from '../components/LogoutModal';
import UpdateNumberModal from '../components/UpdateNumberModal';
import {SCREEN_NAMES} from '../constants/screenNames';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {clearSession, getSession} from '../utils/session';

export default function FarmerProfileScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [updateNumberModalVisible, setUpdateNumberModalVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Harrison wills',
    phone: '+91 54852 26478',
    initials: 'HW',
  });

  // Load user data from session
  React.useEffect(() => {
    const loadUserData = async () => {
      try {
        const session = await getSession();
        if (session?.mobileNumber) {
          setUserData(prev => ({
            ...prev,
            phone: session.mobileNumber || prev.phone,
          }));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(16),
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        profileHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(20),
        },
        profileImageContainer: {
          position: 'relative',
          marginRight: moderateScale(16),
        },
        profileImage: {
          width: moderateScale(60),
          height: moderateScale(60),
          borderRadius: moderateScale(30),
          backgroundColor: colors.light_dark_yellow,
          alignItems: 'center',
          justifyContent: 'center',
        },
        profileImageText: {
          ...Typography.boldXl,
          fontSize: moderateScale(22),
          color: colors.textSecondary,
        },
        cameraIconContainer: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: moderateScale(22),
          height: moderateScale(22),
          borderRadius: moderateScale(11),
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.backgroundWhite,
        },
        profileInfo: {
          flex: 1,
        },
        profileName: {
          ...Typography.boldXl,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
          textTransform: 'capitalize',
        },
        profilePhone: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
        optionRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: moderateScale(12),
        },
        optionLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        optionIcon: {
          marginRight: moderateScale(12),
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        optionContent: {
          flex: 1,
        },
        optionLabel: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginBottom: moderateScale(2),
        },
        optionText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
        },
        divider: {
          height: 1,
          backgroundColor: colors.borderDefault,
          marginVertical: moderateScale(4),
        },
        logoutRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        logoutLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        logoutIcon: {
          marginRight: moderateScale(12),
        },
        logoutText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.statusError,
        },
      }),
    [moderateScale, insets.top],
  );

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await clearSession();
      setLogoutModalVisible(false);
      (navigation as any).reset({
        index: 0,
        routes: [{name: SCREEN_NAMES.Login}],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      setLogoutModalVisible(false);
      (navigation as any).reset({
        index: 0,
        routes: [{name: SCREEN_NAMES.Login}],
      });
    }
  };

  const handleViewProfile = () => {
    navigation.navigate(SCREEN_NAMES.FarmerProfileDetails as never);
  };

  const handleUpdateNumber = () => {
    setUpdateNumberModalVisible(true);
  };

  const handleSendRequest = (newNumber: string) => {
    // Handle send request logic here
    console.log('Sending request to update number to:', newNumber);
    // You can add API call here to send the request
    setUpdateNumberModalVisible(false);
    // Optionally show a success message
  };

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  return (
    <View style={dynamicStyles.container}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Information Card */}
        <View style={dynamicStyles.card}>
          {/* Profile Header */}
          <View style={dynamicStyles.profileHeader}>
            <View style={dynamicStyles.profileImageContainer}>
              <View style={dynamicStyles.profileImage}>
                <Text style={dynamicStyles.profileImageText}>
                  {getInitials(userData.name)}
                </Text>
              </View>
              <TouchableOpacity
                style={dynamicStyles.cameraIconContainer}
                activeOpacity={0.7}>
                <Ionicons
                  name="camera"
                  size={moderateScale(14)}
                  color={colors.textWhite}
                />
              </TouchableOpacity>
            </View>
            <View style={dynamicStyles.profileInfo}>
              <Text style={dynamicStyles.profileName}>{userData.name}</Text>
              <Text style={dynamicStyles.profilePhone}>{userData.phone}</Text>
            </View>
          </View>

          {/* Profile Option */}
          <TouchableOpacity
            style={dynamicStyles.optionRow}
            onPress={handleViewProfile}
            activeOpacity={0.7}>
            <View style={dynamicStyles.optionLeft}>
              <View style={dynamicStyles.optionIcon}>
                <Ionicons
                  name="person-outline"
                  size={moderateScale(20)}
                  color={colors.textPrimary}
                />
              </View>
              <View style={dynamicStyles.optionContent}>
                <Text style={dynamicStyles.optionLabel}>Profile</Text>
                <Text style={dynamicStyles.optionText}>View profile</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Divider */}
          <View style={dynamicStyles.divider} />

          {/* Update Number Option */}
          <TouchableOpacity
            style={dynamicStyles.optionRow}
            onPress={handleUpdateNumber}
            activeOpacity={0.7}>
            <View style={dynamicStyles.optionLeft}>
              <View style={dynamicStyles.optionIcon}>
                <Ionicons
                  name="call-outline"
                  size={moderateScale(20)}
                  color={colors.textPrimary}
                />
              </View>
              <View style={dynamicStyles.optionContent}>
                <Text style={dynamicStyles.optionLabel}>Update number</Text>
                <Text style={dynamicStyles.optionText}>
                  Update your mobile number.
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        {/* Log Out Card */}
        <View style={dynamicStyles.card}>
          <TouchableOpacity
            style={dynamicStyles.logoutRow}
            onPress={handleLogout}
            activeOpacity={0.7}>
            <View style={dynamicStyles.logoutLeft}>
              <View style={dynamicStyles.logoutIcon}>
                <Ionicons
                  name="log-out-outline"
                  size={moderateScale(24)}
                  color={colors.statusError}
                />
              </View>
              <Text style={dynamicStyles.logoutText}>Log out</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Update Number Modal */}
      <UpdateNumberModal
        visible={updateNumberModalVisible}
        onClose={() => setUpdateNumberModalVisible(false)}
        existingNumber={userData.phone}
        onSendRequest={handleSendRequest}
      />
    </View>
  );
}
