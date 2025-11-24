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
            flex: 1,
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
            flex: 1,
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
  const navigation = useNavigation();

  const profileDetails = useMemo(() => getProfileDetails(), []);

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
          paddingBottom: moderateScale(100),
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
        <Text style={dynamicStyles.headerTitle}>Profile</Text>
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
            label="Dealer name"
            value={profileDetails.dealerName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Dealer ID"
            value={profileDetails.dealerId}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Name of firm"
            value={profileDetails.firmName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Email"
            value={profileDetails.email}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Mobile no."
            value={profileDetails.mobile}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Date of marriage"
            value={profileDetails.dateOfMarriage}
            moderateScale={moderateScale}
            isShowBorderBottom={false}
          />
        </View>

        {/* Address Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.cardTitle}>Address</Text>
          <InfoRow
            label="House number / name"
            value={profileDetails.address.houseNumber}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Street name"
            value={profileDetails.address.streetName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Landmark"
            value={profileDetails.address.landmark}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Village"
            value={profileDetails.address.village}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="District"
            value={profileDetails.address.district}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="State"
            value={profileDetails.address.state}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Pin code"
            value={profileDetails.address.pinCode}
            moderateScale={moderateScale}
            isShowBorderBottom={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

