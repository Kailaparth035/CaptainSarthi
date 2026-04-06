import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {TabParamList} from '../navigation/TabNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import LogoutModal from '../components/LogoutModal';
import {SCREEN_NAMES} from '../constants/screenNames';
import {ProfileStackParamList} from '../navigation/stacks/ProfileStack';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {clearSession} from '../utils/session';
import {useLanguage} from '../contexts/LanguageContext';
import {getData, postData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import FirebaseService from '../Service/FirebaseService';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t, currentLanguage} = useLanguage();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    initials: '',
    profileImage: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    if (!name) return 'NA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Fetch profile data from API
  const fetchProfileData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('[ProfileScreen] Fetching latest profile data');
      const response = await getData(Apis.DEALER_PROFILE, {});
      
      // Handle API response structure: { status: true, data: {...} }
      if (response?.status === true && response?.data) {
        const profileData = response.data;
        
        setUserData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          initials: getInitials(profileData.name || ''),
          profileImage: profileData.profile_image || null,
        });
      } else {
        console.warn('Unexpected API response format:', response);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchProfileData(true);
  }, []);

  // Fetch data on mount and whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProfileData();

      // Handle back button - navigate to Home tab
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        tabNavigation.navigate(SCREEN_NAMES.Home);
        return true;
      });

      return () => backHandler.remove();
    }, [tabNavigation])
  );

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
          paddingTop: insets.top + moderateScale(12),
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
          overflow: 'hidden',
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
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
          paddingBottom: moderateScale(12),
          marginBottom: moderateScale(12),
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
        languageRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        languageLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        languageIcon: {
          marginRight: moderateScale(12),
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(30),
          backgroundColor: colors.light_dark_yellow,
          alignItems: 'center',
          justifyContent: 'center',
        },
        languageContent: {
          flex: 1,
        },
        languageLabel: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(2),
        },
        languageText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
        },
      }),
    [moderateScale, insets.top],
  );

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      // Unregister FCM token before logout
      try {
        const deviceToken = await FirebaseService.getToken();
        
        if (deviceToken) {
          // Prepare request body
          const bodyData = {
            device_token: deviceToken,
          };
          
          // Call FCM unregister API
          const response = await postData(Apis.DEALER_FCM_UNREGISTER, bodyData);
          
          if (response) {
            console.log('[ProfileScreen] FCM token unregistered successfully:', response);
          } else {
            console.log('[ProfileScreen] FCM token unregistration failed or no response');
          }
        } else {
          console.log('[ProfileScreen] FCM token not available for unregistration');
        }
      } catch (fcmError) {
        console.error('[ProfileScreen] Error unregistering FCM token:', fcmError);
        // Continue with logout even if FCM unregistration fails
      }
      
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
    } finally {
      setIsLoggingOut(false);
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

      {/* Scrollable Content */}
      <ScrollView
        style={{flex: 1,   paddingTop: insets.top,}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* Profile Information Card */}
        <View style={dynamicStyles.card}>
          {/* Profile Header */}
          <View style={dynamicStyles.profileHeader}>
            <TouchableOpacity
              style={dynamicStyles.profileImageContainer}
              onPress={handleProfileIconPress}
              activeOpacity={0.7}>
              {loading ? (
                <View style={dynamicStyles.profileImage}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                </View>
              ) : userData.profileImage ? (
                <Image
                  source={{uri: getImageUrl(userData.profileImage) || ''}}
                  style={dynamicStyles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={dynamicStyles.profileImage}>
                  <Text style={dynamicStyles.profileImageText}>
                    {userData.initials || 'NA'}
                  </Text>
                </View>
              )}
              <View style={dynamicStyles.cameraIconContainer}>
                <Ionicons
                  name="camera"
                  size={moderateScale(14)}
                  color={colors.textWhite}
                />
              </View>
            </TouchableOpacity>
            <View style={dynamicStyles.profileInfo}>
              <Text style={dynamicStyles.profileName}>
                {loading ? 'Loading...' : userData.name || 'N/A'}
              </Text>
              <Text style={dynamicStyles.profilePhone}>
                {loading ? '' : userData.phone || 'N/A'}
              </Text>
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
                <Text style={dynamicStyles.viewProfileLabel}>{t('profile.title')}</Text>
                <Text style={dynamicStyles.viewProfileText}>{t('profile.viewProfile')}</Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(20)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Language Option */}
          <TouchableOpacity
            style={dynamicStyles.languageRow}
            onPress={() => navigation.navigate(SCREEN_NAMES.Language)}
            activeOpacity={0.7}>
            <View style={dynamicStyles.languageLeft}>
              <View style={dynamicStyles.languageIcon}>
                <Ionicons
                  name="language-outline"
                  size={moderateScale(20)}
                  color={colors.textPrimary}
                />
              </View>
              <View style={dynamicStyles.languageContent}>
                <Text style={dynamicStyles.languageLabel}>{t('language.title')}</Text>
                <Text style={dynamicStyles.languageText}>
                {t('language.selectLanguage')}

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
              <Text style={dynamicStyles.logoutText}>{t('profile.logOut')}</Text>
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
        onClose={() => !isLoggingOut && setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
        loading={isLoggingOut}
      />

    </View>
  );
}