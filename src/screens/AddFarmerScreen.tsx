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
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useImagePicker} from '../hooks/useImagePicker';
import {RootStackParamList} from '../navigation/RootNavigator';
import SimpleBoxInput from '../components/FloatingInput';
import ImagePickerModal from '../components/ImagePickerModal';
import Dropdown from '../components/Dropdown';
import Button from '../components/Button';
import {SCREEN_NAMES} from '../constants/screenNames';
import {
  TextInputQuestion,
  RadioButtonQuestion,
  CheckboxQuestion,
  FileUploadQuestion,
  DropdownQuestion,
} from '../components/QuestionComponents';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Category options
const categoryOptions = [
  {label: 'Client with more than 1 tractor', value: 'more_than_one_tractor'},
  {label: 'Client with major crops/tractors', value: 'major_crops'},
  {label: 'Owner of multiple crops/animals', value: 'multiple_crops'},
  {label: 'Farmers who responded to new generations', value: 'new_generations'},
  {label: '10+ years loyal users', value: 'loyal_users'},
  {label: 'Farmers who influenced 10+ to 50+ agri', value: 'influencers'},
  {label: 'Demand high income from rental services', value: 'rental_services'},
  {label: 'Farmers who developed/innovated machines', value: 'innovators'},
  {label: 'Living conditions for rental or commodity bonds', value: 'rental_bonds'},
];

// Question type definitions
type QuestionType = 'text' | 'radio' | 'checkbox' | 'file' | 'dropdown';

type QuestionConfig = {
  type: QuestionType;
  question: string;
  options?: string[];
  dropdownOptions?: {label: string; value: string}[];
  placeholder?: string;
  label?: string;
};

// Sub-questions configuration for each category
const categorySubQuestions: Record<string, QuestionConfig[]> = {
  more_than_one_tractor: [
    {
      type: 'text',
      question: 'How many tractors does farmer have?',
      placeholder: 'Your answer here',
    },
    {
      type: 'radio',
      question: 'Does the farmer own more than 5 tractors?',
      options: ['Yes', 'No'],
    },
    {
      type: 'checkbox',
      question: 'Select all applicable options:',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    },
    {
      type: 'file',
      question: 'Upload tractor ownership documents:',
    },
    {
      type: 'dropdown',
      question: 'Select tractor model:',
      label: 'Model name',
      dropdownOptions: [
        {label: '200 DI TWO', value: '200_di_two'},
        {label: '300 DI', value: '300_di'},
        {label: '400 DI', value: '400_di'},
        {label: '500 DI', value: '500_di'},
      ],
      placeholder: 'Enter model name',
    },
  ],
  major_crops: [
    {
      type: 'radio',
      question: 'Owner of multiple crops/animals',
      options: ['Yes', 'No'],
    },
    {
      type: 'text',
      question: 'Farmers who responded to new generations of crops/animals',
      placeholder: 'Your answer here',
    },
  ],
  multiple_crops: [
    {
      type: 'radio',
      question: 'Owner of multiple crops/animals',
      options: ['Yes', 'No'],
    },
  ],
  new_generations: [
    {
      type: 'text',
      question: 'Farmers who responded to new generations of crops/animals',
      placeholder: 'Your answer here',
    },
  ],
  loyal_users: [
    {
      type: 'radio',
      question: '10+ years loyal users of certain tractors',
      options: ['Yes', 'No'],
    },
  ],
  influencers: [
    {
      type: 'text',
      question: 'Farmers who influenced 10+ to 50+ agri in their village',
      placeholder: 'Your answer here',
    },
  ],
  rental_services: [
    {
      type: 'text',
      question: 'Demand high income from rental services using certain tractors',
      placeholder: 'Your answer here',
    },
  ],
  innovators: [
    {
      type: 'text',
      question: 'Farmers who developed / innovated machines with support tractors',
      placeholder: 'Your answer here',
    },
  ],
  rental_bonds: [
    {
      type: 'radio',
      question: 'Living conditions for rental or commodity bonds',
      options: ['Yes', 'No'],
    },
  ],
};

type TractorDetails = {
  id: string;
  tractorImages?: string[]; // Array for multiple tractor images (min 1, max 2)
  rcImage?: string;
  rcFront?: string;
  rcBack?: string;
  modelName: string;
  chassisNumber: string;
  engineNumber: string;
  ownerName: string;
  registrationNumber: string;
  purchaseDateDD: string;
  purchaseDateMM: string;
  purchaseDateYYYY: string;
  whoFrom: string;
  errors: {
    modelName?: string;
    chassisNumber?: string;
    engineNumber?: string;
    ownerName?: string;
    registrationNumber?: string;
    purchaseDateDD?: string;
    purchaseDateMM?: string;
    purchaseDateYYYY?: string;
    whoFrom?: string;
    tractorImages?: string;
  };
};

type FormErrors = {
  profilePhoto?: string;
  dealerName?: string;
  category?: string;
  selectedSubQuestion?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  countryCode?: string;
  phoneNumber?: string;
  dobDD?: string;
  dobMM?: string;
  dobYYYY?: string;
  domDD?: string;
  domMM?: string;
  domYYYY?: string;
  whoFrom?: string;
  houseNumber?: string;
  streetName?: string;
  landmark?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
};

export default function AddFarmerScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation<NavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);
  const {pickImage} = useImagePicker();

  // Profile photo
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [imagePickerType, setImagePickerType] = useState<'profile' | 'tractor' | 'rc' | 'rcFront' | 'rcBack'>('profile');
  const [currentTractorId, setCurrentTractorId] = useState<string>('');

  // Dealer name (from logged in account - mock for now)
  const [dealerName] = useState('Default Dealer Name');

  // Category
  const [category, setCategory] = useState('');
  const [subQuestionAnswers, setSubQuestionAnswers] = useState<
    Record<string, any>
  >({});

  // Personal details
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('01254 03254');
  const [dobDD, setDobDD] = useState('');
  const [dobMM, setDobMM] = useState('');
  const [dobYYYY, setDobYYYY] = useState('');
  const [domDD, setDomDD] = useState('');
  const [domMM, setDomMM] = useState('');
  const [domYYYY, setDomYYYY] = useState('');
  const [whoFrom, setWhoFrom] = useState('');

  // Address
  const [houseNumber, setHouseNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Tractors
  const [tractors, setTractors] = useState<TractorDetails[]>([
    {
      id: '1',
      tractorImages: [], // Start with empty array, add first slot when needed
      modelName: '',
      chassisNumber: '',
      engineNumber: '',
      ownerName: '',
      registrationNumber: '',
      purchaseDateDD: '',
      purchaseDateMM: '',
      purchaseDateYYYY: '',
      whoFrom: '',
      errors: {},
    },
  ]);

  // Errors
  const [errors, setErrors] = useState<FormErrors>({});

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

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
        },
        backButton: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        headerTitle: {
          ...Typography.semiBoldXxl,
          // fontSize: moderateScale(20),
          color: colors.textPrimary,
          flex: 1,
        },
        scrollContent: {
          padding: moderateScale(16),
          paddingBottom: moderateScale(100),
        },
        section: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        sectionTitle: {
          ...Typography.boldLg,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginBottom: moderateScale(12),
        },
        profilePhotoContainer: {
          flexDirection: 'row',
          alignItems: 'center',          
          marginBottom: moderateScale(20),
        },
        profilePhotoPlaceholder: {
          width: moderateScale(60),
          height: moderateScale(60),
          borderRadius: moderateScale(30),
          backgroundColor: colors.backgroundGray,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: colors.borderDefault,
          borderStyle: 'dashed',
          marginRight: moderateScale(12),
        },
        profilePhoto: {
          width: moderateScale(60),
          height: moderateScale(60),
          borderRadius: moderateScale(30),
          marginRight: moderateScale(12),
        },
        cameraIcon: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          backgroundColor: colors.primary,
          borderRadius: moderateScale(15),
          padding: moderateScale(8),
        },
        uploadText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          textDecorationLine: 'underline',
          flex: 1,
        },
        dateRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        dateInput: {
          flex: 0.3,
        },
        phoneRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: moderateScale(12),
        },
        phoneCodeInput: {
          flex: 0.35,
        },
        phoneNumberInput: {
          flex: 0.65,
        },
        tractorHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        tractorCountText: {
          ...Typography.boldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
        },
        addNewButton: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: moderateScale(8),
          paddingHorizontal: moderateScale(12),
          borderRadius: moderateScale(8),
          alignSelf:'flex-start'
          // backgroundColor: colors.backgroundGray,
        },
        addNewText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.primary,
          marginLeft: moderateScale(4),
        },
        imageUploadContainer: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: moderateScale(16),
        },
        imageUploadItem: {
          width: '48%',
          marginBottom: moderateScale(12),
        },
        imageUploadItemFullWidth: {
          width: '100%',
          marginBottom: moderateScale(12),
        },
        tractorImagesContainer: {
          marginBottom: moderateScale(16),
        },
        tractorImagesRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: moderateScale(12),
        },
        tractorImageItem: {
          width: '48%',
          marginBottom: moderateScale(12),
        },
        imageUploadBox: {
          width: '100%',
          height: moderateScale(100),
          borderRadius: moderateScale(10),
          backgroundColor: colors.backgroundGray,
          borderWidth: 1,
          borderColor: colors.borderDefault,
          borderStyle: 'dashed',
          justifyContent: 'center',
          alignItems: 'center',
        },
        imageUploadBoxFilled: {
          borderStyle: 'solid',
          borderColor: colors.primary,
        },
        uploadedImage: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(10),
        },
        uploadIcon: {
          marginBottom: moderateScale(4),
        },
        uploadLabel: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
          textAlign: 'center',
        },
        removeTractorButton: {
          alignSelf: 'flex-end',
          paddingVertical: moderateScale(8),
          paddingHorizontal: moderateScale(12),
          borderRadius: moderateScale(8),
          backgroundColor: colors.statusError,
          marginTop: moderateScale(8),
        },
        removeTractorText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(12),
          color: colors.textWhite,
        },
        errorText: {
          color: 'red',
          fontSize: moderateScale(10),
          marginTop: moderateScale(-10),
          marginBottom: moderateScale(10),
        },
      }),
    [moderateScale, insets.top],
  );

  const handleImagePicker = (type: 'profile' | 'tractor' | 'rc' | 'rcFront' | 'rcBack', tractorId?: string, imageIndex?: number) => {
    setImagePickerType(type);
    if (tractorId) {
      // Format: "tractorId-imageIndex" for tractor images, just "tractorId" for others
      setCurrentTractorId(type === 'tractor' && imageIndex !== undefined ? `${tractorId}-${imageIndex}` : tractorId);
    }
    setImagePickerVisible(true);
  };

  const handleCameraPress = async () => {
    try {
      console.log('Opening camera for:', imagePickerType);
      const imageUri = await pickImage('camera');
      console.log('Camera result:', imageUri);
      if (imageUri) {
        if (imagePickerType === 'profile') {
          setProfilePhoto(imageUri);
        } else if (currentTractorId) {
          if (imagePickerType === 'tractor') {
            const [tractorId, imageIndexStr] = currentTractorId.split('-');
            const imageIndex = imageIndexStr ? parseInt(imageIndexStr) : undefined;
            updateTractorImage(tractorId, imagePickerType, imageUri, imageIndex);
          } else {
            updateTractorImage(currentTractorId, imagePickerType, imageUri);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleCameraPress:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const handleGalleryPress = async () => {
    try {
      console.log('Opening gallery for:', imagePickerType);
      const imageUri = await pickImage('gallery');
      console.log('Gallery result:', imageUri);
      if (imageUri) {
        if (imagePickerType === 'profile') {
          setProfilePhoto(imageUri);
        } else if (currentTractorId) {
          const tractorImageIndex = imagePickerType === 'tractor' ? parseInt(currentTractorId.split('-')[1] || '0') : undefined;
          updateTractorImage(currentTractorId.split('-')[0], imagePickerType, imageUri, tractorImageIndex);
        }
      }
    } catch (error) {
      console.error('Error in handleGalleryPress:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const updateTractorImage = (
    tractorId: string,
    type: 'tractor' | 'rc' | 'rcFront' | 'rcBack',
    imageUri: string,
    tractorImageIndex?: number,
  ) => {
    setTractors(prev =>
      prev.map(tractor => {
        if (tractor.id === tractorId) {
          if (type === 'tractor' && tractorImageIndex !== undefined) {
            // Handle tractor images array
            const currentImages = tractor.tractorImages || [];
            const newImages = [...currentImages];
            // Ensure array is large enough
            while (newImages.length <= tractorImageIndex) {
              newImages.push('');
            }
            newImages[tractorImageIndex] = imageUri;
            return {
              ...tractor,
              tractorImages: newImages,
            };
          } else {
            // Handle other image types
            return {
              ...tractor,
              [type === 'rc' ? 'rcImage' : type === 'rcFront' ? 'rcFront' : 'rcBack']: imageUri,
            };
          }
        }
        return tractor;
      }),
    );
  };

  const addTractorImage = (tractorId: string) => {
    setTractors(prev =>
      prev.map(tractor => {
        if (tractor.id === tractorId) {
          const currentImages = tractor.tractorImages || [];
          if (currentImages.length < 2) {
            return {
              ...tractor,
              tractorImages: [...currentImages, ''],
            };
          }
        }
        return tractor;
      }),
    );
  };

  const ensureFirstTractorImageSlot = (tractorId: string) => {
    setTractors(prev =>
      prev.map(tractor => {
        if (tractor.id === tractorId) {
          const currentImages = tractor.tractorImages || [];
          if (currentImages.length === 0) {
            return {
              ...tractor,
              tractorImages: [''],
            };
          }
        }
        return tractor;
      }),
    );
  };

  const removeTractorImage = (tractorId: string, imageIndex: number) => {
    setTractors(prev =>
      prev.map(tractor => {
        if (tractor.id === tractorId) {
          const currentImages = tractor.tractorImages || [];
          if (currentImages.length > 1) {
            const newImages = currentImages.filter((_, index) => index !== imageIndex);
            return {
              ...tractor,
              tractorImages: newImages,
            };
          } else {
            Alert.alert('Error', 'At least one tractor image is required');
          }
        }
        return tractor;
      }),
    );
  };

  const addNewTractor = () => {
    const newId = String(tractors.length + 1);
    setTractors(prev => [
      ...prev,
      {
        id: newId,
        tractorImages: [''], // Start with one empty slot for first image
        modelName: '',
        chassisNumber: '',
        engineNumber: '',
        ownerName: '',
        registrationNumber: '',
        purchaseDateDD: '',
        purchaseDateMM: '',
        purchaseDateYYYY: '',
        whoFrom: '',
        errors: {},
      },
    ]);
  };

  const removeTractor = (tractorId: string) => {
    if (tractors.length > 1) {
      setTractors(prev => prev.filter(t => t.id !== tractorId));
    } else {
      Alert.alert('Error', 'At least one tractor is required');
    }
  };

  const updateTractorField = (
    tractorId: string,
    field: keyof TractorDetails,
    value: string,
  ) => {
    setTractors(prev =>
      prev.map(tractor => {
        if (tractor.id === tractorId) {
          return {
            ...tractor,
            [field]: value,
            errors: {
              ...tractor.errors,
              [field]: undefined,
            },
          };
        }
        return tractor;
      }),
    );
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Profile photo
    if (!profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required';
    }

    // Category
    if (!category) {
      newErrors.category = 'Category is required';
    }

    // Sub-questions validation
    if (category && categorySubQuestions[category]) {
      const hasAnswers = categorySubQuestions[category].some(
        (_, index) => {
          const questionKey = `${category}_${index}`;
          const answer = subQuestionAnswers[questionKey];
          if (Array.isArray(answer)) {
            return answer.length > 0;
          }
          return answer && answer.toString().trim() !== '';
        },
      );
      if (!hasAnswers) {
        newErrors.selectedSubQuestion = 'Please answer all sub-questions';
      }
    }

    // Personal details
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!countryCode.trim()) {
      newErrors.countryCode = 'Country code is required';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!dobDD.trim() || !dobMM.trim() || !dobYYYY.trim()) {
      newErrors.dobDD = 'Date of birth is required';
    }
    if (!domDD.trim() || !domMM.trim() || !domYYYY.trim()) {
      newErrors.domDD = 'Date of marriage is required';
    }
    if (!whoFrom.trim()) {
      newErrors.whoFrom = 'Who from is required';
    }

    // Address
    if (!houseNumber.trim()) {
      newErrors.houseNumber = 'House number is required';
    }
    if (!streetName.trim()) {
      newErrors.streetName = 'Street name is required';
    }
    if (!village.trim()) {
      newErrors.village = 'Village is required';
    }
    if (!district.trim()) {
      newErrors.district = 'District is required';
    }
    if (!state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    }

    setErrors(newErrors);

    // Validate tractors
    let tractorErrors = false;
    const updatedTractors = tractors.map(tractor => {
      const tractorErrorsObj: TractorDetails['errors'] = {};

      // Validate tractor images (min 1 required)
      const uploadedTractorImages = (tractor.tractorImages || []).filter(img => img && img.trim() !== '');
      if (uploadedTractorImages.length === 0) {
        tractorErrorsObj.tractorImages = 'At least one tractor image is required';
        tractorErrors = true;
      }

      if (!tractor.modelName.trim()) {
        tractorErrorsObj.modelName = 'Model name is required';
        tractorErrors = true;
      }
      if (!tractor.chassisNumber.trim()) {
        tractorErrorsObj.chassisNumber = 'Chassis number is required';
        tractorErrors = true;
      }
      if (!tractor.engineNumber.trim()) {
        tractorErrorsObj.engineNumber = 'Engine number is required';
        tractorErrors = true;
      }
      if (!tractor.ownerName.trim()) {
        tractorErrorsObj.ownerName = 'Owner name is required';
        tractorErrors = true;
      }
      if (!tractor.registrationNumber.trim()) {
        tractorErrorsObj.registrationNumber = 'Registration number is required';
        tractorErrors = true;
      }
      if (!tractor.purchaseDateDD.trim() || !tractor.purchaseDateMM.trim() || !tractor.purchaseDateYYYY.trim()) {
        tractorErrorsObj.purchaseDateDD = 'Date of purchase is required';
        tractorErrors = true;
      }
      if (!tractor.whoFrom.trim()) {
        tractorErrorsObj.whoFrom = 'Who from is required';
        tractorErrors = true;
      }

      return {
        ...tractor,
        errors: tractorErrorsObj,
      };
    });

    if (tractorErrors) {
      setTractors(updatedTractors);
    }

    return Object.keys(newErrors).length === 0 && !tractorErrors;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // TODO: Submit form data
      Alert.alert('Success', 'Form submitted successfully');
    } else {
      Alert.alert('Error', 'Please fill all required fields');
      scrollViewRef.current?.scrollTo({y: 0, animated: true});
    }
  };

  const renderDateInputs = (
    label1: string,
    label2: string,
    label3: string,
    dd: string,
    mm: string,
    yyyy: string,
    setDD: (val: string) => void,
    setMM: (val: string) => void,
    setYYYY: (val: string) => void,
    error?: string,
  ) => (
    <View>
      <View style={styles.dateRow}>
        <View style={styles.dateInput}>
          <SimpleBoxInput
            label={label1}
            value={dd}
            onChangeText={setDD}
            placeholder="DD"
            keyboardType="numeric"
            maxLength={2}
            error={error ? '' : undefined}
            numberOfLinesLabel={1}
          />
        </View>
        <View style={styles.dateInput}>
          <SimpleBoxInput
            label={label2}
            value={mm}
            onChangeText={setMM}
            placeholder="MM"
            keyboardType="numeric"
            maxLength={2}
            numberOfLinesLabel={1}
          />
        </View>
        <View style={styles.dateInput}>
          <SimpleBoxInput
            label={label3}
            value={yyyy}
            onChangeText={setYYYY}
            placeholder="YYYY"
            keyboardType="numeric"
            maxLength={4}
            numberOfLinesLabel={1}
          />
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  const renderImageUpload = (
    label: string,
    imageUri: string | undefined,
    onPress: () => void,
    fullWidth?: boolean,
  ) => (
    <TouchableOpacity
      style={fullWidth ? styles.imageUploadItemFullWidth : styles.imageUploadItem}
      onPress={onPress}
      activeOpacity={0.7}>
      <View
        style={[
          styles.imageUploadBox,
          imageUri && styles.imageUploadBoxFilled,
        ]}>
        {imageUri ? (
          <Image
            source={{uri: imageUri}}
            style={styles.uploadedImage}
            resizeMode="cover"
          />
        ) : (
          <>
            <Ionicons
              name="cloud-upload-outline"
              size={moderateScale(24)}
              color={colors.textTertiary}
              style={styles.uploadIcon}
            />
            <Text style={styles.uploadLabel}>{label}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add new farmer</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          {/* Personal Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal details</Text>

            {/* Profile Photo */}
            <View style={styles.profilePhotoContainer}>
              <TouchableOpacity
                onPress={() => handleImagePicker('profile')}
                activeOpacity={0.7}
              >
                {profilePhoto ? (
                  <View>
                    <Image
                      source={{ uri: profilePhoto }}
                      style={styles.profilePhoto}
                    />
                    <View style={styles.cameraIcon}>
                      <Ionicons
                        name="camera"
                        size={moderateScale(16)}
                        color={colors.textWhite}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.profilePhotoPlaceholder}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={moderateScale(24)}
                      color={colors.textPrimary}
                    />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleImagePicker('profile')}
                activeOpacity={0.7}
                style={{ marginTop: moderateScale(20) }}
              >
                <Text style={styles.uploadText}>Upload profile photo</Text>
              </TouchableOpacity>
            </View>
            {errors.profilePhoto && (
              <Text style={styles.errorText}>{errors.profilePhoto}</Text>
            )}

            {/* Dealer Name */}
            <SimpleBoxInput
              label="Dealer name"
              value={dealerName}
              onChangeText={() => {}}
              editable={false}
            />

            {/* Category Dropdown */}
            <Dropdown
              label="Select category"
              value={category}
              options={categoryOptions}
              onSelect={value => {
                setCategory(value);
                setSubQuestionAnswers({});
                setErrors({
                  ...errors,
                  category: undefined,
                  selectedSubQuestion: undefined,
                });
              }}
              placeholder="Select category"
              error={errors.category}
            />

            {/* Dynamic Sub-questions */}
            {category &&
              categorySubQuestions[category] &&
              categorySubQuestions[category].map((questionConfig, index) => {
                const questionKey = `${category}_${index}`;
                const currentAnswer = subQuestionAnswers[questionKey] || '';

                const handleAnswerChange = (value: any) => {
                  setSubQuestionAnswers(prev => ({
                    ...prev,
                    [questionKey]: value,
                  }));
                  setErrors({ ...errors, selectedSubQuestion: undefined });
                };

                switch (questionConfig.type) {
                  case 'text':
                    return (
                      <TextInputQuestion
                        key={questionKey}
                        question={questionConfig.question}
                        value={
                          typeof currentAnswer === 'string' ? currentAnswer : ''
                        }
                        onChangeText={handleAnswerChange}
                        placeholder={questionConfig.placeholder}
                        error={
                          errors.selectedSubQuestion && index === 0
                            ? errors.selectedSubQuestion
                            : undefined
                        }
                      />
                    );

                  case 'radio':
                    return (
                      <RadioButtonQuestion
                        key={questionKey}
                        question={questionConfig.question}
                        value={
                          typeof currentAnswer === 'string'
                            ? currentAnswer
                            : null
                        }
                        onChange={handleAnswerChange}
                        options={questionConfig.options}
                        error={
                          errors.selectedSubQuestion && index === 0
                            ? errors.selectedSubQuestion
                            : undefined
                        }
                      />
                    );

                  case 'checkbox':
                    return (
                      <CheckboxQuestion
                        key={questionKey}
                        question={questionConfig.question}
                        selectedValues={
                          Array.isArray(currentAnswer) ? currentAnswer : []
                        }
                        onChange={handleAnswerChange}
                        options={questionConfig.options || []}
                        error={
                          errors.selectedSubQuestion && index === 0
                            ? errors.selectedSubQuestion
                            : undefined
                        }
                      />
                    );

                  case 'file':
                    return (
                      <FileUploadQuestion
                        key={questionKey}
                        question={questionConfig.question}
                        onUpload={(imageUri: string) => {
                          handleAnswerChange(imageUri);
                        }}
                        uploadedFileName={
                          typeof currentAnswer === 'string'
                            ? currentAnswer.split('/').pop() || currentAnswer
                            : undefined
                        }
                        error={
                          errors.selectedSubQuestion && index === 0
                            ? errors.selectedSubQuestion
                            : undefined
                        }
                      />
                    );

                  case 'dropdown':
                    return (
                      <DropdownQuestion
                        key={questionKey}
                        question={questionConfig.question}
                        label={questionConfig.label || 'Select option'}
                        value={
                          typeof currentAnswer === 'string' ? currentAnswer : ''
                        }
                        options={questionConfig.dropdownOptions || []}
                        onSelect={handleAnswerChange}
                        placeholder={questionConfig.placeholder}
                        error={
                          errors.selectedSubQuestion && index === 0
                            ? errors.selectedSubQuestion
                            : undefined
                        }
                      />
                    );

                  default:
                    return null;
                }
              })}

            {/* Personal Info Fields */}
            <SimpleBoxInput
              label="First name"
              value={firstName}
              onChangeText={text => {
                setFirstName(text);
                setErrors({ ...errors, firstName: undefined });
              }}
              placeholder="Enter first name"
              error={errors.firstName}
            />
            <SimpleBoxInput
              label="Middle name"
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Enter middle name"
            />
            <SimpleBoxInput
              label="Last name"
              value={lastName}
              onChangeText={text => {
                setLastName(text);
                setErrors({ ...errors, lastName: undefined });
              }}
              placeholder="Enter last name"
              error={errors.lastName}
            />
            {/* Phone Number with Country Code */}
            <View style={styles.phoneRow}>
              <View style={styles.phoneCodeInput}>
                <SimpleBoxInput
                  label="Code"
                  value={countryCode}
                  onChangeText={text => {
                    setCountryCode(text);
                    setErrors({ ...errors, countryCode: undefined });
                  }}
                  placeholder="+91"
                  keyboardType="phone-pad"
                  error={errors.countryCode}
                />
              </View>
              <View style={styles.phoneNumberInput}>
                <SimpleBoxInput
                  label="Number"
                  value={phoneNumber}
                  onChangeText={text => {
                    setPhoneNumber(text);
                    setErrors({ ...errors, phoneNumber: undefined });
                  }}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  error={errors.phoneNumber}
                />
              </View>
            </View>
            {renderDateInputs(
              'Date',
              'of',
              'birth',
              dobDD,
              dobMM,
              dobYYYY,
              text => {
                setDobDD(text);
                setErrors({ ...errors, dobDD: undefined });
              },
              setDobMM,
              setDobYYYY,
              errors.dobDD,
            )}
            {renderDateInputs(
              'Date',
              'of',
              'marriage',
              domDD,
              domMM,
              domYYYY,
              text => {
                setDomDD(text);
                setErrors({ ...errors, domDD: undefined });
              },
              text => {
                setDomMM(text);
                setErrors({ ...errors, domMM: undefined });
              },
              text => {
                setDomYYYY(text);
                setErrors({ ...errors, domYYYY: undefined });
              },
              errors.domDD,
            )}
            {/* <SimpleBoxInput
              label="Who from"
              value={whoFrom}
              onChangeText={text => {
                setWhoFrom(text);
                setErrors({...errors, whoFrom: undefined});
              }}
              placeholder="Enter who from"
              error={errors.whoFrom} */}
            {/* /> */}
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <SimpleBoxInput
              label="House number / Name"
              value={houseNumber}
              onChangeText={text => {
                setHouseNumber(text);
                setErrors({ ...errors, houseNumber: undefined });
              }}
              placeholder="Enter house number / name"
              error={errors.houseNumber}
            />
            <SimpleBoxInput
              label="Street name"
              value={streetName}
              onChangeText={text => {
                setStreetName(text);
                setErrors({ ...errors, streetName: undefined });
              }}
              placeholder="Enter street name"
              error={errors.streetName}
            />
            <SimpleBoxInput
              label="Landmark"
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Enter landmark"
            />
            <SimpleBoxInput
              label="Village"
              value={village}
              onChangeText={text => {
                setVillage(text);
                setErrors({ ...errors, village: undefined });
              }}
              placeholder="Enter village"
              error={errors.village}
            />
            <SimpleBoxInput
              label="District"
              value={district}
              onChangeText={text => {
                setDistrict(text);
                setErrors({ ...errors, district: undefined });
              }}
              placeholder="Enter district"
              error={errors.district}
            />
            <SimpleBoxInput
              label="State"
              value={state}
              onChangeText={text => {
                setState(text);
                setErrors({ ...errors, state: undefined });
              }}
              placeholder="Enter state"
              error={errors.state}
            />
            <SimpleBoxInput
              label="Pincode"
              value={pincode}
              onChangeText={text => {
                setPincode(text);
                setErrors({ ...errors, pincode: undefined });
              }}
              placeholder="Enter pincode"
              keyboardType="numeric"
              maxLength={6}
              error={errors.pincode}
            />
          </View>

          {/* Tractor Details Section */}
          {tractors.map((tractor, index) => (
            <View key={tractor.id} style={styles.section}>
              <View style={styles.tractorHeader}>
                <Text style={styles.tractorCountText}>
                  Tractor count {index + 1}
                </Text>
                {tractors.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeTractorButton}
                    onPress={() => removeTractor(tractor.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeTractorText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Tractor Images Section */}
              <View style={styles.tractorImagesContainer}>
                {(() => {
                  const firstImage = (tractor.tractorImages || [])[0];
                  const secondImage = (tractor.tractorImages || [])[1];
                  const hasFirstImage = firstImage && firstImage.trim() !== '';
                  const hasSecondImage = secondImage && secondImage.trim() !== '';
                  const uploadedImagesCount = (tractor.tractorImages || []).filter(img => img && img.trim() !== '').length;
                  const totalSlots = (tractor.tractorImages || []).length;
                  
                  // If no images uploaded yet, show full width upload box
                  if (!hasFirstImage) {
                    return (
                      <View>
                        {renderImageUpload(
                          'Upload Tractor image',
                          undefined,
                          () => {
                            ensureFirstTractorImageSlot(tractor.id);
                            handleImagePicker('tractor', tractor.id, 0);
                          },
                          true, // fullWidth
                        )}
                        {tractor.errors.tractorImages && (
                          <Text style={styles.errorText}>{tractor.errors.tractorImages}</Text>
                        )}
                      </View>
                    );
                  }
                  
                  // If first image uploaded, show in row with second upload option or both images
                  return (
                    <View>
                      <View style={styles.tractorImagesRow}>
                        {/* First Uploaded Image */}
                        <View style={styles.tractorImageItem}>
                          {renderImageUpload(
                            'Upload Tractor image',
                            hasFirstImage ? firstImage : undefined,
                            () => {
                              ensureFirstTractorImageSlot(tractor.id);
                              handleImagePicker('tractor', tractor.id, 0);
                            },
                          )}
                          {hasFirstImage && uploadedImagesCount > 1 && (
                            <TouchableOpacity
                              style={[styles.removeTractorButton, {marginTop: moderateScale(4)}]}
                              onPress={() => removeTractorImage(tractor.id, 0)}
                              activeOpacity={0.7}>
                              <Text style={styles.removeTractorText}>Remove</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        
                        {/* Second Upload Option or Second Image */}
                        {hasSecondImage ? (
                          // Show second uploaded image
                          <View style={styles.tractorImageItem}>
                            {renderImageUpload(
                              'Upload Tractor image',
                              hasSecondImage ? secondImage : undefined,
                              () => handleImagePicker('tractor', tractor.id, 1),
                            )}
                            {hasSecondImage && uploadedImagesCount > 1 && (
                              <TouchableOpacity
                                style={[styles.removeTractorButton, {marginTop: moderateScale(4)}]}
                                onPress={() => removeTractorImage(tractor.id, 1)}
                                activeOpacity={0.7}>
                                <Text style={styles.removeTractorText}>Remove</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          // Show second upload option (Add button)
                          <TouchableOpacity
                            style={[styles.tractorImageItem, styles.imageUploadBox]}
                            onPress={() => addTractorImage(tractor.id)}
                            activeOpacity={0.7}>
                            <Ionicons
                              name="add"
                              size={moderateScale(24)}
                              color={colors.textTertiary}
                            />
                            <Text style={styles.uploadLabel}>Upload second image</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {tractor.errors.tractorImages && (
                        <Text style={styles.errorText}>{tractor.errors.tractorImages}</Text>
                      )}
                    </View>
                  );
                })()}
              </View>

              {/* RC Image Upload - Full Width */}
              {/* <View style={{marginBottom: moderateScale(16)}}>
                {renderImageUpload(
                  'Upload RC image',
                  tractor.rcImage,
                  () => handleImagePicker('rc', tractor.id),
                  true, // fullWidth
                )}
              </View> */}

              {/* RC Front and Back Images */}
              <View style={styles.imageUploadContainer}>
                {renderImageUpload('Upload RC front', tractor.rcFront, () =>
                  handleImagePicker('rcFront', tractor.id),
                )}
                {renderImageUpload('Upload RC back', tractor.rcBack, () =>
                  handleImagePicker('rcBack', tractor.id),
                )}
              </View>

              {/* Tractor Fields */}
              <SimpleBoxInput
                label="Enter model name"
                value={tractor.modelName}
                onChangeText={text =>
                  updateTractorField(tractor.id, 'modelName', text)
                }
                placeholder="Enter model name"
                error={tractor.errors.modelName}
              />
              <SimpleBoxInput
                label="Chassis number"
                value={tractor.chassisNumber}
                onChangeText={text =>
                  updateTractorField(tractor.id, 'chassisNumber', text)
                }
                placeholder="Enter chassis number"
                error={tractor.errors.chassisNumber}
              />
              <SimpleBoxInput
                label="Engine number"
                value={tractor.engineNumber}
                onChangeText={text =>
                  updateTractorField(tractor.id, 'engineNumber', text)
                }
                placeholder="Enter engine number"
                error={tractor.errors.engineNumber}
              />
              <SimpleBoxInput
                label="Owner name"
                value={tractor.ownerName}
                onChangeText={text =>
                  updateTractorField(tractor.id, 'ownerName', text)
                }
                placeholder="Enter owner name"
                error={tractor.errors.ownerName}
              />
              <SimpleBoxInput
                label="Registration number"
                value={tractor.registrationNumber}
                onChangeText={text =>
                  updateTractorField(tractor.id, 'registrationNumber', text)
                }
                placeholder="Enter registration number"
                error={tractor.errors.registrationNumber}
              />
              {renderDateInputs(
                'Date',
                'of',
                'purchase',
                tractor.purchaseDateDD,
                tractor.purchaseDateMM,
                tractor.purchaseDateYYYY,
                text => updateTractorField(tractor.id, 'purchaseDateDD', text),
                text => updateTractorField(tractor.id, 'purchaseDateMM', text),
                text =>
                  updateTractorField(tractor.id, 'purchaseDateYYYY', text),
                tractor.errors.purchaseDateDD,
              )}
              <SimpleBoxInput
                label="Who from"
                value={tractor.whoFrom}
                onChangeText={text =>
                  updateTractorField(tractor.id, 'whoFrom', text)
                }
                placeholder="Enter who from"
                error={tractor.errors.whoFrom}
              />
              {/* Add New Tractor Button */}
              <TouchableOpacity
                style={styles.addNewButton}
                onPress={addNewTractor}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={moderateScale(20)}
                  color={colors.primary}
                />
                <Text style={styles.addNewText}>Add new</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        {/* Submit Button */}
        <View style={{padding:moderateScale(14)}}>
          <Button
            title="Send for verification"
            onPress={handleSubmit}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
      />
    </View>
  );
}

