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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import LogoutModal from '../components/LogoutModal';
import {SCREEN_NAMES} from '../constants/screenNames';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {clearSession} from '../utils/session';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Mock user data
  const userData = {
    name: 'Jason statham',
    phone: '+91 54852 26478',
    initials: 'JS',
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
          paddingTop: moderateScale(16),
          paddingBottom: moderateScale(100),
        },
        title: {
          ...Typography.boldXxl,
          fontSize: moderateScale(22),
          color: colors.textPrimary,
          marginBottom: moderateScale(16),
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top,
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
        viewProfileRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',          
        },
        viewProfileLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        viewProfileIcon: {
          marginRight: moderateScale(12),
            width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(30),
          backgroundColor: colors.light_dark_yellow,
          alignItems: 'center',
          justifyContent: 'center',
        },
        viewProfileContent: {
          flex: 1,
        },
        viewProfileLabel: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(2),
        },
        viewProfileText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
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
          ...Typography.regularMd,
          fontSize: moderateScale(14),
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
      // Clear session from AsyncStorage
      await clearSession();
      setLogoutModalVisible(false);
      // Navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{name: SCREEN_NAMES.Login}],
      });
    } catch (error) {
      console.error('Error during logout:', error);
      setLogoutModalVisible(false);
      // Still navigate to login even if clearing session fails
      navigation.reset({
        index: 0,
        routes: [{name: SCREEN_NAMES.Login}],
      });
    }
  };

  const handleViewProfile = () => {
    navigation.navigate(SCREEN_NAMES.ProfileDetails);
  };

  const handleProfileIconPress = () => {
    navigation.navigate(SCREEN_NAMES.ProfileDetails);
  };

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  return (
    <View style={dynamicStyles.container}>
      {/* Title */}
      <Text style={dynamicStyles.title}>Profile</Text>

      {/* Scrollable Content */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Profile Information Card */}
        <View style={dynamicStyles.card}>
          {/* Profile Header */}
          <View style={dynamicStyles.profileHeader}>
            <TouchableOpacity
              style={dynamicStyles.profileImageContainer}
              onPress={handleProfileIconPress}
              activeOpacity={0.7}>
              <View style={dynamicStyles.profileImage}>
                <Text style={dynamicStyles.profileImageText}>
                  {userData.initials}
                </Text>
              </View>
              <View style={dynamicStyles.cameraIconContainer}>
                <Ionicons
                  name="camera"
                  size={moderateScale(14)}
                  color={colors.textWhite}
                />
              </View>
              </TouchableOpacity>
            <View style={dynamicStyles.profileInfo}>
              <Text style={dynamicStyles.profileName}>{userData.name}</Text>
              <Text style={dynamicStyles.profilePhone}>{userData.phone}</Text>
            </View>
          </View>

          {/* View Profile Link */}
          <TouchableOpacity
            style={dynamicStyles.viewProfileRow}
            onPress={handleViewProfile}
            activeOpacity={0.7}>
            <View style={dynamicStyles.viewProfileLeft}>
              <View style={dynamicStyles.viewProfileIcon}>
                <Ionicons
                  name="person-outline"
                  size={moderateScale(20)}
                  color={colors.textPrimary}
                />
              </View>
              <View style={dynamicStyles.viewProfileContent}>
                <Text style={dynamicStyles.viewProfileLabel}>Profile</Text>
                <Text style={dynamicStyles.viewProfileText}>View profile</Text>
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
    </View>
  );
}