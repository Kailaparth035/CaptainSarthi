import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import { ImagePath } from '../assets/images';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';

type FarmerDetailsRouteParams = {
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  farmerInitials: string;
};

// Mock data for farmer details
const getFarmerDetails = (farmerId: string) => {
  // Default data matching the image
  const defaultData = {
    id: farmerId,
    firstName: 'David',
    middleName: 'Richie',
    lastName: 'Wills',
    fullName: 'David Wills',
    mobile: '+91 54852 26478',
    dateOfBirth: '10 Feb 1996',
    dateOfMarriage: '3 Nov 2015',
    dealershipName: 'J.P enterprise',
    tractors: [
      {
        id: '1',
        model: '280 DX 2 WD',
        chassisNo: 'MBNGAALDNNNA02481',
        vehicleNo: 'GJ 27 KS 9710',
        engineNo: '1104C-E44TA',
        mobile: '+91 54852 26478',
        dateOfInvoice: '12 Oct 2025',
        whoDrives: 'Father',
      },
    ],
  };

  // You can add more farmer data here based on farmerId
  return defaultData;
};

// Info Row Component
const InfoRow = ({
  label,
  value,
  moderateScale,
  valueUnderlined = false,
  isShowBorderBottom = true
}: {
  label: string;
  value: string;
  moderateScale: (size: number, factor?: number) => number;
  valueUnderlined?: boolean;
  isShowBorderBottom?: boolean;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(12),
        borderBottomWidth: isShowBorderBottom ?  1 : 0, 
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
            textDecorationLine: valueUnderlined ? 'underline' : 'none',
          },
        ]}>
        {value}
      </Text>
    </View>
  );
};

export default function FarmerDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as FarmerDetailsRouteParams;
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const farmerDetails = useMemo(
    () => getFarmerDetails(params?.farmerId || '1'),
    [params?.farmerId],
  );

  // Prepare images for preview modal - only include RC book document images
  const previewImages: ImageItem[] = useMemo(() => {
    const images: ImageItem[] = [];
    
    // Document images (RC Book) only
    images.push({
      id: 'doc-1',
      source: ImagePath.rcBook,
    });
    images.push({
      id: 'doc-2',
      source: ImagePath.rcBook,
    });
    
    return images;
  }, []);

  const handleImagePress = (docIndex: number) => {
    setSelectedImageIndex(docIndex);
    setPreviewModalVisible(true);
  };

  const handleCloseModal = () => {
    setPreviewModalVisible(false);
  };

  const handleReplaceImage = (imageId: string) => {
    // Handle replace image action
    console.log('Replace image:', imageId);
    // You can add your replace image logic here
  };

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
          // paddingTop: moderateScale(16),
          marginBottom:moderateScale(7),
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
          borderRadius: moderateScale(40),
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
          borderRadius: moderateScale(14),
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
        documentImagesContainer: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: moderateScale(8),
        },
        documentImage: {
          // width: moderateScale(160),
          height: moderateScale(100),
          borderRadius: moderateScale(8),
          marginHorizontal:moderateScale(5),
          paddingHorizontal:moderateScale(10),
          backgroundColor: colors.backgroundGray,
        },
        placeholderImage: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        placeholderText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
          textAlign: 'center',
        },
      }),
    [moderateScale],
  );

  return (
    <View style={[dynamicStyles.container]}>
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
        <Text style={dynamicStyles.headerTitle}>Farmers Details</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* User Details Card */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.profileHeader}>
            <View style={dynamicStyles.profileImageContainer}>
              <View style={dynamicStyles.profileImage}>
                <Text style={dynamicStyles.profileImageText}>
                  {params?.farmerInitials || 'DW'}
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
                {params?.farmerName || farmerDetails.fullName}
              </Text>
              <Text style={dynamicStyles.profilePhone}>
                {params?.farmerPhone || farmerDetails.mobile}
              </Text>
            </View>
          </View>

          <InfoRow
            label="First name"
            value={farmerDetails.firstName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Middle name"
            value={farmerDetails.middleName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Last name"
            value={farmerDetails.lastName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Mobile no."
            value={farmerDetails.mobile}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Date of birth"
            value={farmerDetails.dateOfBirth}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Date of marriage"
            value={farmerDetails.dateOfMarriage}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Dealership name"
            value={farmerDetails.dealershipName}            
            moderateScale={moderateScale}
            isShowBorderBottom={false}
          />
        </View>

        {/* Tractor Details Card */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.tractorHeader}>
            <Text style={dynamicStyles.tractorTitle}>Tractor details</Text>
            <Text style={dynamicStyles.tractorCount}>
              Tractor count: {farmerDetails.tractors.length}
            </Text>
          </View>

          {farmerDetails.tractors.map((tractor, index) => (
            <View key={tractor.id}>
              {/* Tractor Main Image */}
              <View style={dynamicStyles.tractorImageContainer}>
                <View style={dynamicStyles.tractorMainImage}>
                  <View style={dynamicStyles.placeholderImage}>
                   <Image source={ImagePath.tractor} style={{width:moderateScale(340),height:moderateScale(150)}}/>
                  </View>
                </View>

                {/* Document Images */}
                <View style={dynamicStyles.documentImagesContainer}>
                  <TouchableOpacity
                    style={dynamicStyles.documentImage}
                    onPress={() => handleImagePress(0)}
                    activeOpacity={0.7}>
                    <View style={dynamicStyles.placeholderImage}>
                      <Image source={ImagePath.rcBook} style={{width:moderateScale(140),height:moderateScale(70),borderRadius: moderateScale(8),}}/>                   
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={dynamicStyles.documentImage}
                    onPress={() => handleImagePress(1)}
                    activeOpacity={0.7}>
                    <View style={dynamicStyles.placeholderImage}>
                      <Image source={ImagePath.rcBook} style={{width:moderateScale(140),height:moderateScale(70),borderRadius: moderateScale(8),}}/>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tractor Specifications */}
              <InfoRow
                label="Model name"
                value={tractor.model}
                moderateScale={moderateScale}
              />
              <InfoRow
                label="Chassis no."
                value={tractor.chassisNo}
                moderateScale={moderateScale}
                valueUnderlined={true}
              />
              <InfoRow
                label="Vehicle no."
                value={tractor.vehicleNo}
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
                label="Who drives"
                value={tractor.whoDrives}
                moderateScale={moderateScale}
                isShowBorderBottom={false}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={previewModalVisible}
        images={previewImages}
        initialIndex={selectedImageIndex}
        onClose={handleCloseModal}
        onReplaceImage={handleReplaceImage}
      />
    </View>
  );
}

