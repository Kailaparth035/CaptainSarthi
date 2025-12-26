import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {ImagePath} from '../assets/images';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';

// Mock data for farmer profile details
const getFarmerProfileDetails = () => {
  return {
    firstName: 'Harrison',
    middleName: 'Richard',
    lastName: 'Wills',
    fullName: 'Harrison wills',
    mobile: '+91 54852 26478',
    dateOfBirth: '10 Feb 1996',
    dateOfMarriage: '3 Nov 2015',
    dealershipName: 'J.P enterprise',
    dealershipAddress: 'Padavia Road, Veraval (Shapar), Kotda Sangani, Rajkot (Gujarat) INDIA.360024.',
    tractors: [
      {
        id: '1',
        model: '280 DX 2 WD',
        vehicleNo: 'GJ 27 MS 6402',
        ownerName: 'David wills',
        chassisNo: 'MBNGAALDNNNA02481',
        engineNo: '1104C-E44TA',
        mobile: '+91 54852 26478',
        dateOfInvoice: '12 Oct 2025',
        dateOfRegistration: '16 Oct 2025',
        whoDrives: 'Father',
      },
    ],
  };
};

// Info Row Component
const InfoRow = ({
  label,
  value,
  moderateScale,
  isShowBorderBottom = true,
  isColumn = false,
}: {
  label: string;
  value: string;
  moderateScale: (size: number, factor?: number) => number;
  isShowBorderBottom?: boolean;
  isColumn?: boolean;
}) => {
  if (isColumn) {
    return (
      <View
        style={{
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
              marginBottom: moderateScale(8),
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
              textAlign: 'left',
            },
          ]}>
          {value}
        </Text>
      </View>
    );
  }

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
            flex: 0.35,
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
            flex: 0.65,
            textAlign: 'right',
          },
        ]}>
        {value}
      </Text>
    </View>
  );
};

export default function FarmerProfileDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const profileDetails = useMemo(() => getFarmerProfileDetails(), []);

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call - replace with actual API call when available
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

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
          paddingTop: insets.top + moderateScale(12),
          marginBottom: moderateScale(7),
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
          marginLeft: moderateScale(10),
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
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
        tractorHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        tractorTitle: {
          ...Typography.boldXl,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
        },
        tractorCount: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
        tractorImageContainer: {
          alignItems: 'center',
          marginVertical: moderateScale(16),
        },
        tractorMainImage: {
          width: '100%',
          height: moderateScale(200),
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          marginBottom: moderateScale(12),
        },
      }),
    [moderateScale, insets.top],
  );

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* User Profile Section */}
        <View style={dynamicStyles.card}>
          {/* Profile Header */}
          <View style={dynamicStyles.profileHeader}>
            <View style={dynamicStyles.profileImageContainer}>
              <View style={dynamicStyles.profileImage}>
                <Text style={dynamicStyles.profileImageText}>
                  {getInitials(profileDetails.fullName)}
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
                {profileDetails.fullName}
              </Text>
              <Text style={dynamicStyles.profilePhone}>
                {profileDetails.mobile}
              </Text>
            </View>
          </View>

          {/* Personal Details */}
          <InfoRow
            label={t('farmerProfile.firstName')}
            value={profileDetails.firstName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.middleName')}
            value={profileDetails.middleName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.lastName')}
            value={profileDetails.lastName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.mobileNo')}
            value={profileDetails.mobile}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.dateOfBirth')}
            value={profileDetails.dateOfBirth}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.dateOfMarriage')}
            value={profileDetails.dateOfMarriage}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.dealershipName')}
            value={profileDetails.dealershipName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label={t('farmerProfile.dealershipAddress')}
            value={profileDetails.dealershipAddress}
            moderateScale={moderateScale}
            isShowBorderBottom={false}
            isColumn={true}
          />
        </View>

        {/* Tractor Details Section */}
        {profileDetails.tractors.map((tractor, index) => (
          <View key={tractor.id} style={dynamicStyles.card}>
            <View style={dynamicStyles.tractorHeader}>
              <Text style={dynamicStyles.tractorTitle}>{t('farmerProfile.tractorDetails')}</Text>
              <Text style={dynamicStyles.tractorCount}>
                {t('farmerProfile.tractorCount')}: {index + 1} of {profileDetails.tractors.length}
              </Text>
            </View>

            {/* Tractor Image */}
            <View style={dynamicStyles.tractorImageContainer}>
              <View style={dynamicStyles.tractorMainImage}>
                <Image
                  source={ImagePath.tractor}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: moderateScale(8),
                  }}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Tractor Specifications */}
            <InfoRow
              label={t('farmerProfile.modelName')}
              value={tractor.model}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.vehicleNo')}
              value={tractor.vehicleNo}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.ownerName')}
              value={tractor.ownerName}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.chassisNo')}
              value={tractor.chassisNo}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.engineNo')}
              value={tractor.engineNo}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.mobileNo')}
              value={tractor.mobile}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.dateOfInvoice')}
              value={tractor.dateOfInvoice}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.dateOfRegistration')}
              value={tractor.dateOfRegistration}
              moderateScale={moderateScale}
            />
            <InfoRow
              label={t('farmerProfile.whoDrives')}
              value={tractor.whoDrives}
              moderateScale={moderateScale}
              isShowBorderBottom={false}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

