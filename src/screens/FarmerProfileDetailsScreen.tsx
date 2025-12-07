import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {ImagePath} from '../assets/images';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';

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
  const navigation = useNavigation();

  const profileDetails = useMemo(() => getFarmerProfileDetails(), []);

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
          paddingTop: insets.top,
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
        <Text style={dynamicStyles.headerTitle}>Profile</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
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
            label="First name"
            value={profileDetails.firstName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Middle name"
            value={profileDetails.middleName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Last name"
            value={profileDetails.lastName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Mobile no."
            value={profileDetails.mobile}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Date of birth"
            value={profileDetails.dateOfBirth}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Date of marriage"
            value={profileDetails.dateOfMarriage}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Dealership name"
            value={profileDetails.dealershipName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Dealership address"
            value={profileDetails.dealershipAddress}
            moderateScale={moderateScale}
            isShowBorderBottom={false}
          />
        </View>

        {/* Tractor Details Section */}
        {profileDetails.tractors.map((tractor, index) => (
          <View key={tractor.id} style={dynamicStyles.card}>
            <View style={dynamicStyles.tractorHeader}>
              <Text style={dynamicStyles.tractorTitle}>Tractor details</Text>
              <Text style={dynamicStyles.tractorCount}>
                Tractor count: {index + 1} of {profileDetails.tractors.length}
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
              label="Model name"
              value={tractor.model}
              moderateScale={moderateScale}
            />
            <InfoRow
              label="Vehicle no."
              value={tractor.vehicleNo}
              moderateScale={moderateScale}
            />
            <InfoRow
              label="Owner name"
              value={tractor.ownerName}
              moderateScale={moderateScale}
            />
            <InfoRow
              label="Chassis no."
              value={tractor.chassisNo}
              moderateScale={moderateScale}
            />
            <InfoRow
              label="Engine no."
              value={tractor.engineNo}
              moderateScale={moderateScale}
            />
            <InfoRow
              label="Mobile no."
              value={tractor.mobile}
              moderateScale={moderateScale}
            />
            <InfoRow
              label="Date of invoice"
              value={tractor.dateOfInvoice}
              moderateScale={moderateScale}
            />
            <InfoRow
              label="Date of registration"
              value={tractor.dateOfRegistration}
              moderateScale={moderateScale}
            />
            <InfoRow
              label="Who drives"
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

