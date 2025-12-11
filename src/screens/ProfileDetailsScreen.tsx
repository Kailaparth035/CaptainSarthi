import React, {useMemo} from 'react';
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
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';

// Mock data for profile details - matching the image
const getProfileDetails = () => {
  return {
    name: 'Jason statham',
    dealerId: 'DLR0001',
    dealerName: 'Jason statham',
    firmName: 'J.P enterprise',
    email: 'owner@jpenterprise.com',
    mobile: '+91 54852 26478',
    dateOfMarriage: '3 Nov 2015',
    address: {
      houseNumber: '140/C Goodluck society',
      streetName: 'Nr town hall, old high court road',
      landmark: 'R.J tibrewal college',
      village: 'Anand',
      district: 'Ahmedabad',
      state: 'Gujarat',
      pinCode: '380008',
    },
  };
};

// Info Row Component
const InfoRow = ({
  label,
  value,
  moderateScale,
  isShowBorderBottom = true,
}: {
  label: string;
  value: string;
  moderateScale: (size: number, factor?: number) => number;
  isShowBorderBottom?: boolean;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(12),
        borderBottomWidth: isShowBorderBottom ? 1 : 0,
        borderBottomColor: colors.borderLight,
      }}>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textTertiary,
            flex: 0.45,
          },
        ]}>
        {label}:
      </Text>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textPrimary,
            flex: 0.55,
            textAlign: 'right',
          },
        ]}>
        {value}
      </Text>
    </View>
  );
};

export default function ProfileDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const navigation = useNavigation();

  const profileDetails = useMemo(() => getProfileDetails(), []);

  // Update StatusBar and bottom bar to match screen background color
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
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(16),
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
          paddingHorizontal: moderateScale(16),
          paddingTop: moderateScale(16),
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
        profileId: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
        cardTitle: {
          ...Typography.boldXl,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
          marginBottom: moderateScale(16),
        },
      }),
    [moderateScale, insets.top],
  );

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>{t('profile.title')}</Text>
      </View>

      {/* Scrollable Content */}
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
                  {getInitials(profileDetails.name)}
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
              <Text style={dynamicStyles.profileName}>
                {profileDetails.name}
              </Text>
              <Text style={dynamicStyles.profileId}>
                {profileDetails.dealerId}
              </Text>
            </View>
          </View>

          {/* Personal Information */}
          <InfoRow
            label={t('profile.dealerName')}
            value={profileDetails.dealerName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.dealerId')}
            value={profileDetails.dealerId}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.nameOfFirm')}
            value={profileDetails.firmName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.email')}
            value={profileDetails.email}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.mobileNo')}
            value={profileDetails.mobile}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.dateOfMarriage')}
            value={profileDetails.dateOfMarriage}
            moderateScale={moderateScale}
            isShowBorderBottom={false}
          />
        </View>

        {/* Address Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.cardTitle}>{t('profile.dealershipAddress')}</Text>
          <InfoRow
            label={t('profile.apartmentBuilding')}
            value={profileDetails.address.houseNumber}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.streetName')}
            value={profileDetails.address.streetName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.landmark')}
            value={profileDetails.address.landmark}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.village')}
            value={profileDetails.address.village}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.district')}
            value={profileDetails.address.district}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.state')}
            value={profileDetails.address.state}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('profile.pinCode')}
            value={profileDetails.address.pinCode}
            moderateScale={moderateScale}
            isShowBorderBottom={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

