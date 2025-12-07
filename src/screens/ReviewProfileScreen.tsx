import React, {useState, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography, FontFamily} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useImagePicker} from '../hooks/useImagePicker';
import {RootStackParamList} from '../navigation/RootNavigator';
import SimpleBoxInput from '../components/FloatingInput';
import ImagePickerModal from '../components/ImagePickerModal';
import Button from '../components/Button';
import {SCREEN_NAMES} from '../constants/screenNames';
import {saveProfileReviewed} from '../utils/session';
import { ImagePath } from '../assets/images';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ReviewProfileScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation<NavigationProp>();
  const {pickImage} = useImagePicker();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  // Profile photo
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Personal details
  const [dealershipName, setDealershipName] = useState('J.K enterprise');
  const [firstName, setFirstName] = useState('Harrison');
  const [middleName, setMiddleName] = useState('Nathan');
  const [lastName, setLastName] = useState('Wills');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('01254 03254');
  const [dobDD, setDobDD] = useState('28');
  const [dobMM, setDobMM] = useState('02');
  const [dobYYYY, setDobYYYY] = useState('1979');
  const [domDD, setDomDD] = useState('14');
  const [domMM, setDomMM] = useState('03');
  const [domYYYY, setDomYYYY] = useState('1999');

  // Tractor details
  const [tractorCount, setTractorCount] = useState(1);
  const [tractorImage, setTractorImage] = useState<string | null>(null);
  const [modelName, setModelName] = useState('280 DX 2 WD');
  const [vehicleNo, setVehicleNo] = useState('GJ 27 MS 6402');
  const [ownerName, setOwnerName] = useState('David wills');
  const [chassisNo, setChassisNo] = useState('MBNGAALDNNNA02481');
  const [engineNo, setEngineNo] = useState('1104C-E44TA');
  const [tractorMobileNo, setTractorMobileNo] = useState('+91 54852 26478');
  const [dateOfInvoice, setDateOfInvoice] = useState('12 Oct 2025');
  const [dateOfRegistration, setDateOfRegistration] = useState('16 Oct 2025');
  const [whoDrives, setWhoDrives] = useState('Father');

  useDynamicStatusBar({
    backgroundColor: colors.backgroundWhite,
    bottomBarColor: colors.backgroundWhite,
  });

  const [currentImageType, setCurrentImageType] = useState<'profile' | 'tractor'>('profile');

  const handleImagePicker = (type: 'profile' | 'tractor') => {
    setCurrentImageType(type);
    setImagePickerVisible(true);
  };

  const handleCameraPress = async () => {
    try {
      const imageUri = await pickImage('camera');
      if (imageUri) {
        if (currentImageType === 'profile') {
          setProfilePhoto(imageUri);
        } else {
          setTractorImage(imageUri);
        }
      }
      setImagePickerVisible(false);
    } catch (error) {
      console.error('Error picking image from camera:', error);
      setImagePickerVisible(false);
    }
  };

  const handleGalleryPress = async () => {
    try {
      const imageUri = await pickImage('gallery');
      if (imageUri) {
        if (currentImageType === 'profile') {
          setProfilePhoto(imageUri);
        } else {
          setTractorImage(imageUri);
        }
      }
      setImagePickerVisible(false);
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      setImagePickerVisible(false);
    }
  };

  const handleContinue = async () => {
    try {
      // Mark profile as reviewed
      await saveProfileReviewed();
      // Navigate to FarmerTabs
      navigation.replace(SCREEN_NAMES.FarmerTabs);
    } catch (error) {
      console.error('Error saving profile review status:', error);
    }
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
          marginVertical:moderateScale(60)
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingTop: moderateScale(10) ,
          paddingBottom: moderateScale(20),
          
        },
        title: {
          ...Typography.boldXxl,
          fontSize: moderateScale(24),
          color: colors.textPrimary,
          marginBottom: moderateScale(24),
        },
        card: {
          backgroundColor: colors.white,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        sectionTitle: {
          ...Typography.semiBoldLg,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
          marginBottom: moderateScale(8),
        },
        sectionDescription: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
          marginBottom: moderateScale(16),
        },
        profilePhotoContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(20),
        },
        profilePhotoWrapper: {
          marginRight: moderateScale(16),
        },
        profilePhoto: {
          width: moderateScale(70),
          height: moderateScale(70),
          borderRadius: moderateScale(50),
        },
        profilePhotoPlaceholder: {
          width: moderateScale(70),
          height: moderateScale(70),
          borderRadius: moderateScale(50),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        profilePhotoTextContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        changePhotoText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          textDecorationLine: 'underline',
        },
        uploadHint: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
          marginTop: moderateScale(8),
        },
        row: {
          flexDirection: 'row',
          gap: moderateScale(12),
        },
        dateInputContainer: {
          flex: 1,
        },
        dateLabel: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
          marginBottom: moderateScale(4),
        },
        tractorHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        tractorCount: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
        },
        tractorImage: {
          width: '100%',
          height: moderateScale(200),
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          marginBottom: moderateScale(16),
        },
        detailRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: moderateScale(12),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        detailLabel: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
          flex: 0.4,
        },
        detailValue: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          flex: 0.6,
          textAlign: 'right',
          fontFamily: FontFamily.Medium,
        },
        continueButton: {
          marginTop: moderateScale(24),
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <KeyboardAvoidingView
      style={dynamicStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}>
        <Text style={dynamicStyles.title}>Review profile</Text>

        {/* Personal Details Section */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.sectionTitle}>Personal details</Text>
          <Text style={dynamicStyles.sectionDescription}>
            After the details are reviewed and updated, no further changes will
            be allowed.
          </Text>

          {/* Profile Photo */}
          <View style={dynamicStyles.profilePhotoContainer}>
            <TouchableOpacity
              onPress={() => handleImagePicker('profile')}
              activeOpacity={0.7}
              style={dynamicStyles.profilePhotoWrapper}>
              {profilePhoto ? (
                <Image
                  source={{uri: profilePhoto}}
                  style={dynamicStyles.profilePhoto}
                />
              ) : (
                <View style={dynamicStyles.profilePhotoPlaceholder}>
                  <Ionicons
                    name="person"
                    size={moderateScale(40)}
                    color={colors.textTertiary}
                  />
                </View>
              )}
            </TouchableOpacity>
            <View style={dynamicStyles.profilePhotoTextContainer}>
              <TouchableOpacity
                onPress={() => handleImagePicker('profile')}
                activeOpacity={0.7}>
                <Text style={dynamicStyles.changePhotoText}>
                  Change profile photo
                </Text>
              </TouchableOpacity>
              <Text style={dynamicStyles.uploadHint}>
                Upload png or jpg. 5 mb max size.
              </Text>
            </View>
          </View>

          {/* Dealership Name */}
          <SimpleBoxInput
            label="Dealership name"
            value={dealershipName}
            onChangeText={setDealershipName}
            editable={false}
          />

          {/* First Name */}
          <SimpleBoxInput
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
          />

          {/* Middle Name */}
          <SimpleBoxInput
            label="Middle name"
            value={middleName}
            onChangeText={setMiddleName}
          />

          {/* Last Name */}
          <SimpleBoxInput
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
          />

          {/* Phone Number */}
          <View style={dynamicStyles.row}>
            <View style={[dynamicStyles.dateInputContainer, {flex: 0.3}]}>
              <SimpleBoxInput
                label="Code"
                value={countryCode}
                onChangeText={setCountryCode}
              />
            </View>
            <View style={[dynamicStyles.dateInputContainer, {flex: 0.7}]}>
              <SimpleBoxInput
                label="Number"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>
          </View>

          {/* Date of Birth */}
          <Text style={dynamicStyles.dateLabel}>Date of birth</Text>
          <View style={dynamicStyles.row}>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput
                label="Date"
                value={dobDD}
                onChangeText={setDobDD}
              />
            </View>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput label="of" value={dobMM} onChangeText={setDobMM} />
            </View>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput
                label="birth"
                value={dobYYYY}
                onChangeText={setDobYYYY}
              />
            </View>
          </View>

          {/* Date of Marriage */}
          <Text style={[dynamicStyles.dateLabel, {marginTop: moderateScale(12)}]}>
            Date of marriage
          </Text>
          <View style={dynamicStyles.row}>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput
                label="Date"
                value={domDD}
                onChangeText={setDomDD}
              />
            </View>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput label="of" value={domMM} onChangeText={setDomMM} />
            </View>
            <View style={dynamicStyles.dateInputContainer}>
              <SimpleBoxInput
                label="marriage"
                value={domYYYY}
                onChangeText={setDomYYYY}
              />
            </View>
          </View>
        </View>

        {/* Tractor Details Section */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.tractorHeader}>
            <Text style={dynamicStyles.sectionTitle}>Tractor details</Text>
            <Text style={dynamicStyles.tractorCount}>
              Tractor count: {tractorCount} of 1
            </Text>
          </View>

          {/* Tractor Image */}
          <TouchableOpacity
            onPress={() => handleImagePicker('tractor')}
            activeOpacity={0.7}>
            {/* {tractorImage ? ( */}
              <Image
                source={ImagePath.farmerTractor}
                style={dynamicStyles.tractorImage}
                resizeMode="cover"
              />
            {/* ) : ( */}
              {/* <View style={dynamicStyles.tractorImage}>
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons
                    name="image-outline"
                    size={moderateScale(40)}
                    color={colors.textTertiary}
                  />
                </View>
              </View>
            )} */}
          </TouchableOpacity>

          {/* Tractor Details */}
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Model name:</Text>
            <Text style={dynamicStyles.detailValue}>{modelName}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Vehicle no.:</Text>
            <Text style={dynamicStyles.detailValue}>{vehicleNo}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Owner name:</Text>
            <Text style={dynamicStyles.detailValue}>{ownerName}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Chassis no.:</Text>
            <Text style={dynamicStyles.detailValue}>{chassisNo}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Engine no.:</Text>
            <Text style={dynamicStyles.detailValue}>{engineNo}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Mobile no.:</Text>
            <Text style={dynamicStyles.detailValue}>{tractorMobileNo}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Date of invoice:</Text>
            <Text style={dynamicStyles.detailValue}>{dateOfInvoice}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Date of registration:</Text>
            <Text style={dynamicStyles.detailValue}>{dateOfRegistration}</Text>
          </View>
          <View style={[dynamicStyles.detailRow, {borderBottomWidth: 0}]}>
            <Text style={dynamicStyles.detailLabel}>Who drives:</Text>
            <Text style={dynamicStyles.detailValue}>{whoDrives}</Text>
          </View>
        </View>

        {/* Continue Button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          style={dynamicStyles.continueButton}
        />
      </ScrollView>

      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
      />
    </KeyboardAvoidingView>
  );
}

