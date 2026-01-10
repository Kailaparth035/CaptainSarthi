import React, {useState, useMemo, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useImagePicker} from '../hooks/useImagePicker';
import {useLanguage} from '../contexts/LanguageContext';
import {RootStackParamList} from '../navigation/RootNavigator';
import SimpleBoxInput from '../components/FloatingInput';
import ImagePickerModal from '../components/ImagePickerModal';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';
import Dropdown from '../components/Dropdown';
import SearchableDropdown from '../components/SearchableDropdown';
import Button from '../components/Button';
import Toast, {ToastType} from '../components/Toast';
import {SCREEN_NAMES} from '../constants/screenNames';
import {
  TextInputQuestion,
  RadioButtonQuestion,
  CheckboxQuestion,
  FileUploadQuestion,
  DropdownQuestion,
} from '../components/QuestionComponents';
import {getData, postDataWithImage, putData, putDataWithImage} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {extractDataFromRCImages, extractDataFromRCImage, RCExtractedData} from '../services/OCRService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Category options - will be populated from API
const categoryOptions: {label: string; value: string}[] = [];

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
  vehicleNumber: string;
  chassisNumber: string;
  engineNumber: string;
  ownerName: string;
  purchaseDateDD: string;
  purchaseDateMM: string;
  purchaseDateYYYY: string;
  whoFrom: string;
  errors: {
    modelName?: string;
    vehicleNumber?: string;
    chassisNumber?: string;
    engineNumber?: string;
    ownerName?: string;
    purchaseDateDD?: string;
    purchaseDateMM?: string;
    purchaseDateYYYY?: string;
    purchaseDateError?: string;
    whoFrom?: string;
    tractorImages?: string;
    rcFront?: string;
    rcBack?: string;
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
  const route = useRoute();
  const {t} = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);
  const {pickImage} = useImagePicker();
  
  // Get route params for edit mode
  const routeParams = route.params as {
    farmerId?: string; 
    editMode?: boolean; 
    isEditMode?: boolean;
    rejectedUpdate?: boolean; // New flag for rejected update from notifications
  } | undefined;
  const isEditMode = routeParams?.editMode === true || routeParams?.isEditMode === true;
  const isRejectedUpdate = routeParams?.rejectedUpdate === true; // Third flow: rejected update from notifications
  const farmerId = "SATHI0004";
  console.log("[AddFarmerScreen] Route params:", {
    farmerId,
    isEditMode,
    isRejectedUpdate,
    routeParams,
  });
  
  // Store the numeric ID from API response for update API
  const [farmerNumericId, setFarmerNumericId] = useState<number | null>(null);


  // Refs for form fields to scroll to errors
  const fieldPositions = useRef<Record<string, number>>({});
  const latestErrorsRef = useRef<FormErrors>({});
  const latestTractorsRef = useRef<TractorDetails[]>([]);
  const latestSubQuestionAnswersRef = useRef<Record<string, any>>({});
  const isPrefillingLocationRef = useRef<boolean>(false);
  
  // Refs for date input fields (auto-focus)
  const dobDDRef = useRef<any>(null);
  const dobMMRef = useRef<any>(null);
  const dobYYYYRef = useRef<any>(null);
  const domDDRef = useRef<any>(null);
  const domMMRef = useRef<any>(null);
  const domYYYYRef = useRef<any>(null);
  const purchaseDateRefs = useRef<Record<string, {dd: any, mm: any, yyyy: any}>>({});
  
  // Function to register field position
  const registerFieldPosition = (fieldName: string) => {
    return (event: any) => {
      const {y} = event.nativeEvent.layout;
      fieldPositions.current[fieldName] = y;
    };
  };
  
  // Helper function to validate date
  const isValidDate = (dd: string, mm: string, yyyy: string): boolean => {
    const day = parseInt(dd, 10);
    const month = parseInt(mm, 10);
    const year = parseInt(yyyy, 10);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;
    
    // Check if date is valid (e.g., Feb 30 is invalid)
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  };
  
  // Helper function to compare dates
  const compareDates = (dd1: string, mm1: string, yyyy1: string, dd2: string, mm2: string, yyyy2: string): number => {
    const date1 = new Date(parseInt(yyyy1, 10), parseInt(mm1, 10) - 1, parseInt(dd1, 10));
    const date2 = new Date(parseInt(yyyy2, 10), parseInt(mm2, 10) - 1, parseInt(dd2, 10));
    return date1.getTime() - date2.getTime();
  };

  // Profile photo
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [imagePickerType, setImagePickerType] = useState<'profile' | 'tractor' | 'rc' | 'rcFront' | 'rcBack'>('profile');
  const [currentTractorId, setCurrentTractorId] = useState<string>('');
  
  // Image preview modal state
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewImageInfo, setPreviewImageInfo] = useState<{
    tractorId: string;
    type: 'tractor' | 'rcFront' | 'rcBack';
    imageIndex?: number;
    imageUri: string;
  } | null>(null);

  // Dealer name (from logged in account)
  const [dealerName, setDealerName] = useState('');
  const [dealerNameLoading, setDealerNameLoading] = useState(true);
  
  // Debug: Log dealer name changes
  useEffect(() => {
    console.log('[AddFarmerScreen] Dealer name state updated:', dealerName, 'Loading:', dealerNameLoading);
  }, [dealerName, dealerNameLoading]);
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // OCR processing state
  const [ocrProcessingTractorId, setOcrProcessingTractorId] = useState<string | null>(null);
  const [ocrExtractedData, setOcrExtractedData] = useState<Record<string, RCExtractedData>>({});

  // Helper function to show toast messages
  const showToastMessage = (message: string, type: ToastType = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  // Category
  const [category, setCategory] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<{label: string; value: string}[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [subQuestionAnswers, setSubQuestionAnswers] = useState<
    Record<string, any>
  >({});
  
  // Initialize ref with state
  useEffect(() => {
    latestSubQuestionAnswersRef.current = subQuestionAnswers;
  }, [subQuestionAnswers]);

  // Personal details
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dobDD, setDobDD] = useState('');
  const [dobMM, setDobMM] = useState('');
  const [dobYYYY, setDobYYYY] = useState('');
  const [dobDateError, setDobDateError] = useState<string | undefined>(undefined);
  const [domDD, setDomDD] = useState('');
  const [domMM, setDomMM] = useState('');
  const [domYYYY, setDomYYYY] = useState('');
  const [domDateError, setDomDateError] = useState<string | undefined>(undefined);
  const [whoFrom, setWhoFrom] = useState('');

  // Address
  const [houseNumber, setHouseNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [landmark, setLandmark] = useState('');
  
  // Location dropdowns - using IDs for API calls
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [villageId, setVillageId] = useState('');
  
  // Location options for dropdowns
  const [states, setStates] = useState<{label: string; value: string}[]>([]);
  const [districts, setDistricts] = useState<{label: string; value: string}[]>([]);
  const [villages, setVillages] = useState<{label: string; value: string}[]>([]);
  
  // Loading states for location APIs
  const [statesLoading, setStatesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [villagesLoading, setVillagesLoading] = useState(false);
  
  const [pincode, setPincode] = useState('');

  // Tractors
  const [tractors, setTractors] = useState<TractorDetails[]>([
    {
      id: '1',
      tractorImages: [], // Start with empty array, add first slot when needed
      modelName: '',
      vehicleNumber: '',
      chassisNumber: '',
      engineNumber: '',
      ownerName: '',
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

  // Fetch dealer name from profile API
  const fetchDealerName = async () => {
    try {
      setDealerNameLoading(true);
      console.log('[AddFarmerScreen] Fetching dealer profile...');
      const response = await getData(Apis.DEALER_PROFILE, {});
      
      console.log('[AddFarmerScreen] Profile API response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        const profileData = response.data;
        console.log('[AddFarmerScreen] Profile data:', JSON.stringify(profileData, null, 2));
        
        // Try multiple possible field names for dealer name
        const name = profileData.name || 
                     profileData.dealer_name || 
                     profileData.dealerName ||
                     profileData.full_name ||
                     profileData.first_name ||
                     (profileData.first_name && profileData.last_name 
                       ? `${profileData.first_name} ${profileData.last_name}`.trim()
                       : '') ||
                     'Dealer';
        
        console.log('[AddFarmerScreen] Extracted dealer name:', name);
        setDealerName(name);
      } else if (response?.data) {
        // Handle case where response.data exists but status might not be true
        const profileData = response.data;
        const name = profileData.name || 
                     profileData.dealer_name || 
                     profileData.dealerName ||
                     'Dealer';
        console.log('[AddFarmerScreen] Extracted dealer name (no status check):', name);
        setDealerName(name);
      } else {
        console.warn('[AddFarmerScreen] Failed to fetch dealer profile - unexpected response:', response);
        setDealerName('Dealer'); // Fallback
      }
    } catch (error) {
      console.error('[AddFarmerScreen] Error fetching dealer profile:', error);
      setDealerName('Dealer'); // Fallback
    } finally {
      setDealerNameLoading(false);
    }
  };

  // Fetch dealer name on mount and when screen comes into focus
  useEffect(() => {
    console.log('[AddFarmerScreen] Component mounted - fetching dealer name');
    fetchDealerName();
  }, []);

  // Fetch states on mount
  const fetchStates = async () => {
    try {
      setStatesLoading(true);
      const response = await getData(Apis.GET_STATES, {});
      if (response?.status === true && response?.data) {
        const statesList = response.data.map((item: {id: number; name: string}) => ({
          label: item.name,
          value: item.id.toString(),
        }));
        setStates(statesList);
      }
    } catch (error) {
      console.error('[AddFarmerScreen] Error fetching states:', error);
    } finally {
      setStatesLoading(false);
    }
  };

  // Fetch districts based on selected state
  const fetchDistricts = async (stateIdParam: string) => {
    if (!stateIdParam) {
      setDistricts([]);
      setDistrictId('');
      setVillages([]);
      setVillageId('');
      return;
    }
    try {
      setDistrictsLoading(true);
      const url = `${Apis.GET_DISTRICTS}/${stateIdParam}`;
      const response = await getData(url, {});
      if (response?.status === true && response?.data) {
        const districtsList = response.data.map((item: {id: number; name: string}) => ({
          label: item.name,
          value: item.id.toString(),
        }));
        setDistricts(districtsList);
      } else {
        setDistricts([]);
      }
      // Reset district and village when state changes
      setDistrictId('');
      setVillages([]);
      setVillageId('');
    } catch (error) {
      console.error('[AddFarmerScreen] Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setDistrictsLoading(false);
    }
  };

  // Fetch villages based on selected district
  const fetchVillages = async (districtIdParam: string) => {
    if (!districtIdParam) {
      setVillages([]);
      setVillageId('');
      return;
    }
    try {
      setVillagesLoading(true);
      const url = `${Apis.GET_VILLAGES}/${districtIdParam}`;
      const response = await getData(url, {});
      if (response?.status === true && response?.data) {
        const villagesList = response.data.map((item: {id: number; name: string}) => ({
          label: item.name,
          value: item.id.toString(),
        }));
        setVillages(villagesList);
      } else {
        setVillages([]);
      }
      // Reset village when district changes
      setVillageId('');
    } catch (error) {
      console.error('[AddFarmerScreen] Error fetching villages:', error);
      setVillages([]);
    } finally {
      setVillagesLoading(false);
    }
  };

  // Fetch states on mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch districts when state changes (skip during edit mode prefilling)
  useEffect(() => {
    if (isPrefillingLocationRef.current) {
      return; // Skip during prefilling
    }
    if (stateId) {
      fetchDistricts(stateId);
    } else {
      setDistricts([]);
      setDistrictId('');
      setVillages([]);
      setVillageId('');
    }
  }, [stateId]);

  // Fetch villages when district changes (skip during edit mode prefilling)
  useEffect(() => {
    if (isPrefillingLocationRef.current) {
      return; // Skip during prefilling
    }
    if (districtId) {
      fetchVillages(districtId);
    } else {
      setVillages([]);
      setVillageId('');
    }
  }, [districtId]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('[AddFarmerScreen] Screen focused - fetching dealer name');
      fetchDealerName();
    }, [])
  );

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await getData(Apis.DEALER_CATEGORIES, {});
      
      if (response?.status === true && response?.data) {
        const categories = response.data.map((cat: any) => ({
          label: cat.name || '',
          value: cat.id?.toString() || '',
        }));
        setCategoryOptions(categories);
        console.log('Categories loaded:', categories);
      } else {
        console.warn('Failed to fetch categories:', response);
        showToastMessage('Failed to load categories. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      showToastMessage('Failed to load categories. Please try again.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch questions for selected category
  const fetchQuestions = async (categoryId: string) => {
    if (!categoryId) {
      setQuestions([]);
      return;
    }

    try {
      setQuestionsLoading(true);
      const response = await getData(`${Apis.DEALER_QUESTIONS}/${categoryId}`, {});
      
      if (response?.status === true && response?.data) {
        setQuestions(response.data || []);
        console.log('Questions loaded for category:', categoryId, response.data);
      } else {
        console.warn('Failed to fetch questions:', response);
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Fetch categories on mount and whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('[AddFarmerScreen] Screen focused - fetching latest categories');
      fetchCategories();
    }, [])
  );

  // Fetch farmer details in edit mode or rejected update mode
  const fetchFarmerDetailsForEdit = async () => {
    if ((!isEditMode && !isRejectedUpdate) || !farmerId) return;
    
    try {
      setCategoriesLoading(true);
      const response = await getData(Apis.DEALER_FARMERS, { clientId: farmerId });
      console.log("[AddFarmerScreen] Farmer details API response:", JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        const farmerData = response.data;
        
        // Store farmerId (clientId) for update API - use the original farmerId passed from navigation
        // This is the clientId format like "SATHI0005"
        console.log("Stored farmer ID for update API:", farmerId);
        
        // Also try to extract numeric ID if available
        let numericId = farmerData.id || 
                       farmerData.farmer_id || 
                       (farmerData.farmerId && typeof farmerData.farmerId === 'number' ? farmerData.farmerId : null) ||
                       (farmerData.farmerId && typeof farmerData.farmerId === 'string' && !isNaN(parseInt(farmerData.farmerId)) ? parseInt(farmerData.farmerId) : null);
        
        // If not found in main data, check forms array for farmer_id
        if (!numericId && farmerData.forms && Array.isArray(farmerData.forms) && farmerData.forms.length > 0) {
          numericId = farmerData.forms[0]?.farmer_id || null;
        }
        
        if (numericId) {
          setFarmerNumericId(numericId);
          console.log("Stored farmer numeric ID for update API:", numericId);
        }
        
        // Prefill personal details
        setFirstName(farmerData.firstName || '');
        setMiddleName(farmerData.middleName || '');
        setLastName(farmerData.lastName || '');
        
        // Parse mobile number and country code
        const mobile = farmerData.mobile || '';
        if (mobile.startsWith('+91')) {
          setCountryCode('+91');
          setPhoneNumber(mobile.replace('+91', '').trim());
        } else {
          setCountryCode('+91');
          setPhoneNumber(mobile);
        }
        
        // Parse dates
        if (farmerData.dateOfBirth) {
          const dobDate = new Date(farmerData.dateOfBirth);
          setDobDD(String(dobDate.getDate()).padStart(2, '0'));
          setDobMM(String(dobDate.getMonth() + 1).padStart(2, '0'));
          setDobYYYY(String(dobDate.getFullYear()));
        }
        
        if (farmerData.dateOfMarriage) {
          const domDate = new Date(farmerData.dateOfMarriage);
          setDomDD(String(domDate.getDate()).padStart(2, '0'));
          setDomMM(String(domDate.getMonth() + 1).padStart(2, '0'));
          setDomYYYY(String(domDate.getFullYear()));
        }
        
        // Prefill address
        setHouseNumber(farmerData.houseNumber || farmerData.house_number || '');
        setStreetName(farmerData.streetName || farmerData.street_name || '');
        setLandmark(farmerData.landmark || '');
        setPincode(farmerData.pincode || '');
        
        // Prefill location IDs (state, district, village)
        // API returns: state, district, village (not stateId, districtId, villageId)
        const stateValue = farmerData.state || farmerData.stateId || farmerData.state_id;
        const districtValue = farmerData.district || farmerData.districtId || farmerData.district_id;
        const villageValue = farmerData.village || farmerData.villageId || farmerData.village_id;
        console.log("stateValue ::",stateValue,districtValue,villageValue);
        
        // Set flag to prevent useEffect hooks from interfering
        isPrefillingLocationRef.current = true;
        
        // First, ensure states are loaded
        let currentStatesList = states;
        if (currentStatesList.length === 0) {
          try {
            setStatesLoading(true);
            const statesResponse = await getData(Apis.GET_STATES, {});
            if (statesResponse?.status === true && statesResponse?.data) {
              currentStatesList = statesResponse.data.map((item: {id: number; name: string}) => ({
                label: item.name,
                value: item.id.toString(),
              }));
              setStates(currentStatesList);
            }
          } catch (error) {
            console.error('Error fetching states for edit mode:', error);
          } finally {
            setStatesLoading(false);
          }
        }
        
        // Match state value from API response with states list
        if (stateValue !== undefined && stateValue !== null) {
          const stateIdStr = String(stateValue);
          console.log("stateIdStr ::",stateIdStr);
          
          // Fetch districts for the selected state
          try {
            setDistrictsLoading(true);
            const districtsResponse = await getData(`${Apis.GET_DISTRICTS}/${stateIdStr}`, {});
            console.log("districtsResponse ::",districtsResponse);
            
            if (districtsResponse?.status === true && districtsResponse?.data) {
              const districtsList = districtsResponse.data.map((item: {id: number; name: string}) => ({
                label: item.name,
                value: item.id.toString(),
              }));
              setDistricts(districtsList);
              
              // Match district value from API response
              if (districtValue !== undefined && districtValue !== null) {
                const districtIdStr = String(districtValue);
                console.log("districtIdStr ::",districtIdStr);
                
                // Fetch villages for the selected district
                try {
                  setVillagesLoading(true);
                  const villagesResponse = await getData(`${Apis.GET_VILLAGES}/${districtIdStr}`, {});
                  console.log("villagesResponse ::",villagesResponse);
                  
                  if (villagesResponse?.status === true && villagesResponse?.data) {
                    const villagesList = villagesResponse.data.map((item: {id: number; name: string}) => ({
                      label: item.name,
                      value: item.id.toString(),
                    }));
                    setVillages(villagesList);
                    
                    // Match village value from API response
                    if (villageValue !== undefined && villageValue !== null) {
                      const villageIdStr = String(villageValue);
                      console.log("villageIdStr ::",villageIdStr);
                      setVillageId(villageIdStr);
                    }
                  }
                } catch (error) {
                  console.error('Error fetching villages for edit mode:', error);
                } finally {
                  setVillagesLoading(false);
                }
                
                // Set district ID after villages are loaded
                setDistrictId(districtIdStr);
              }
            }
            
            // Set state ID after districts are loaded
            setStateId(stateIdStr);
          } catch (error) {
            console.error('Error fetching districts for edit mode:', error);
          } finally {
            setDistrictsLoading(false);
          }
        }
        
        // Reset flag after prefilling is complete
        // Use setTimeout to ensure all state updates are processed first
        setTimeout(() => {
          isPrefillingLocationRef.current = false;
        }, 1000);
        
        // Set category and fetch questions
        if (farmerData.categoryId || farmerData.category) {
          const categoryId = String(farmerData.categoryId || farmerData.category);
          setCategory(categoryId);
          // Fetch questions for this category - will be handled by useEffect
          // But we can also fetch immediately to ensure questions are available
          await fetchQuestions(categoryId);
        }
        
        // Prefill profile photo
        if (farmerData.profileImage || farmerData.profile_image) {
          const imageUrl = getImageUrl(farmerData.profileImage || farmerData.profile_image);
          if (imageUrl) {
            setProfilePhoto(imageUrl);
          }
        }
        
        // Prefill question answers if available
        if (farmerData.forms && Array.isArray(farmerData.forms) && farmerData.forms.length > 0) {
          const formData = farmerData.forms[0]?.form_data;
          if (formData?.questions && Array.isArray(formData.questions)) {
            const answers: Record<string, any> = {};
            formData.questions.forEach((q: any, index: number) => {
              const questionKey = `question_${q.id}_${index}`;
              if (q.answers && Array.isArray(q.answers) && q.answers.length > 0) {
                const questionType = q.question_type?.toLowerCase() || 'textbox';
                if (questionType === 'checkbox') {
                  answers[questionKey] = q.answers.map((a: any) => a.answer_text || a.answer);
                } else if (questionType === 'file' || questionType === 'document') {
                  // For file questions, convert URLs to file objects
                  const fileUrls = q.answers
                    .map((a: any) => a.answer_text || a.answer || a.file_url || a.document_url)
                    .filter((url: any) => url && typeof url === 'string');
                  
                  if (fileUrls.length > 0) {
                    answers[questionKey] = fileUrls.map((url: string) => {
                      const fileName = url.split('/').pop() || 'file';
                      return {
                        uri: getImageUrl(url) || url,
                        type: 'image',
                        name: fileName,
                      };
                    });
                  }
                } else {
                  answers[questionKey] = q.answers[0]?.answer_text || q.answers[0]?.answer || '';
                }
              }
            });
            setSubQuestionAnswers(answers);
          }
        } else if (farmerData.questions && Array.isArray(farmerData.questions)) {
          const answers: Record<string, any> = {};
          farmerData.questions.forEach((q: any, index: number) => {
            const questionKey = `question_${q.id}_${index}`;
            if (q.answers && Array.isArray(q.answers) && q.answers.length > 0) {
              const questionType = q.question_type?.toLowerCase() || 'textbox';
              if (questionType === 'checkbox') {
                answers[questionKey] = q.answers.map((a: any) => a.answer_text || a.answer);
              } else if (questionType === 'file' || questionType === 'document') {
                // For file questions, convert URLs to file objects
                const fileUrls = q.answers
                  .map((a: any) => a.answer_text || a.answer || a.file_url || a.document_url)
                  .filter((url: any) => url && typeof url === 'string');
                
                if (fileUrls.length > 0) {
                  answers[questionKey] = fileUrls.map((url: string) => {
                    const fileName = url.split('/').pop() || 'file';
                    return {
                      uri: getImageUrl(url) || url,
                      type: 'image',
                      name: fileName,
                    };
                  });
                }
              } else {
                answers[questionKey] = q.answers[0]?.answer_text || q.answers[0]?.answer || '';
              }
            }
          });
          setSubQuestionAnswers(answers);
        }
        
        // Prefill tractor details if available
        // Check multiple possible locations for tractor data
        const tractorsData = farmerData.tractors || 
                            farmerData.tractor_list || 
                            farmerData.tractorDetails || 
                            (farmerData.tractor_details?.tractor_list) ||
                            [];
        
        console.log("[AddFarmerScreen] Tractor data found:", {
          tractors: farmerData.tractors?.length || 0,
          tractor_list: farmerData.tractor_list?.length || 0,
          tractorDetails: farmerData.tractorDetails?.length || 0,
          tractor_details_tractor_list: farmerData.tractor_details?.tractor_list?.length || 0,
          finalTractorsData: tractorsData.length,
        });
        
        if (Array.isArray(tractorsData) && tractorsData.length > 0) {
          console.log('[AddFarmerScreen] Prefilling tractors:', tractorsData.length);
          const prefilledTractors: TractorDetails[] = tractorsData.map((tractor: any, index: number) => {
            console.log(`[AddFarmerScreen] Processing tractor ${index + 1}:`, {
              tractor_id: tractor.tractor_id || tractor.id,
              model: tractor.model_name || tractor.model,
              vehicle_no: tractor.vehicle_number || tractor.vehicleNo,
            });
            
            // Parse purchase date - check multiple field names
            // Priority: date_of_registration (for purchase date), then date_of_invoice, then other fields
            let purchaseDateDD = '';
            let purchaseDateMM = '';
            let purchaseDateYYYY = '';
            
            // Check date_of_registration first (as per user requirement)
            if (tractor.date_of_registration) {
              const date = new Date(tractor.date_of_registration);
              if (!isNaN(date.getTime())) {
                purchaseDateDD = String(date.getDate()).padStart(2, '0');
                purchaseDateMM = String(date.getMonth() + 1).padStart(2, '0');
                purchaseDateYYYY = String(date.getFullYear());
              }
            } else if (tractor.date_of_invoice || tractor.invoice_date || tractor.purchase_date || tractor.dateOfInvoice) {
              const dateStr = tractor.date_of_invoice || tractor.invoice_date || tractor.purchase_date || tractor.dateOfInvoice;
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                purchaseDateDD = String(date.getDate()).padStart(2, '0');
                purchaseDateMM = String(date.getMonth() + 1).padStart(2, '0');
                purchaseDateYYYY = String(date.getFullYear());
              }
            } else if (tractor.invoice_day && tractor.invoice_month && tractor.invoice_year) {
              purchaseDateDD = String(tractor.invoice_day).padStart(2, '0');
              purchaseDateMM = String(tractor.invoice_month).padStart(2, '0');
              purchaseDateYYYY = String(tractor.invoice_year);
            } else if (tractor.registration_day && tractor.registration_month && tractor.registration_year) {
              purchaseDateDD = String(tractor.registration_day).padStart(2, '0');
              purchaseDateMM = String(tractor.registration_month).padStart(2, '0');
              purchaseDateYYYY = String(tractor.registration_year);
            }
            
            // Get tractor images - check multiple field names and formats
            const tractorImages: string[] = [];
            
            // Priority 1: Check for tractorImages array (exact match from API)
            if (tractor.tractorImages && Array.isArray(tractor.tractorImages)) {
              tractor.tractorImages.forEach((imgUrl: string) => {
                if (imgUrl) {
                  const fullUrl = getImageUrl(imgUrl) || imgUrl;
                  if (fullUrl && !tractorImages.includes(fullUrl)) {
                    tractorImages.push(fullUrl);
                  }
                }
              });
            }
            
            // Priority 2: Check for tractor_images array (alternative format)
            if (tractor.tractor_images && Array.isArray(tractor.tractor_images)) {
              tractor.tractor_images.forEach((img: any) => {
                const imgUrl = typeof img === 'string' ? img : (img.url || img.image_url || img.uri || img);
                if (imgUrl) {
                  const fullUrl = getImageUrl(imgUrl) || imgUrl;
                  if (fullUrl && !tractorImages.includes(fullUrl)) {
                    tractorImages.push(fullUrl);
                  }
                }
              });
            }
            
            // Priority 3: Check for tractor_images_url array
            if (tractor.tractor_images_url && Array.isArray(tractor.tractor_images_url)) {
              tractor.tractor_images_url.forEach((imgUrl: string) => {
                const fullUrl = getImageUrl(imgUrl) || imgUrl;
                if (fullUrl && !tractorImages.includes(fullUrl)) {
                  tractorImages.push(fullUrl);
                }
              });
            }
            
            // Priority 4: Check for single tractor image (tractorImage or tractor_image)
            if (tractor.tractorImage || tractor.tractor_image || tractor.tractor_image_url) {
              const singleImg = tractor.tractorImage || tractor.tractor_image || tractor.tractor_image_url;
              const fullUrl = getImageUrl(singleImg) || singleImg;
              if (fullUrl && !tractorImages.includes(fullUrl)) {
                tractorImages.unshift(fullUrl); // Add to beginning
              }
            }
            
            // Ensure at least one empty slot if no images (for adding new images)
            if (tractorImages.length === 0) {
              tractorImages.push('');
            } else if (tractorImages.length < 2) {
              // If we have 1 image, add an empty slot for second image
              tractorImages.push('');
            }
            
            // Get RC front image - check multiple field names (priority: rcImagesFront from API)
            let rcFront: string | undefined = undefined;
            const rcFrontFields = [
              tractor.rcImagesFront, // Priority 1: exact match from API
              tractor.rc_front_image,
              tractor.rc_front,
              tractor.rc_image_front,
              tractor.rcbook_front,
              tractor.rc_book_front,
              tractor.rc_front_url,
            ];
            
            for (const field of rcFrontFields) {
              if (field) {
                const fullUrl = getImageUrl(field) || field;
                if (fullUrl) {
                  rcFront = fullUrl;
                  break;
                }
              }
            }
            
            // Get RC back image - check multiple field names (priority: rcImagesBack from API)
            let rcBack: string | undefined = undefined;
            const rcBackFields = [
              tractor.rcImagesBack, // Priority 1: exact match from API
              tractor.rc_back_image,
              tractor.rc_back,
              tractor.rc_image_back,
              tractor.rcbook_back,
              tractor.rc_book_back,
              tractor.rc_back_url,
            ];
            
            for (const field of rcBackFields) {
              if (field) {
                const fullUrl = getImageUrl(field) || field;
                if (fullUrl) {
                  rcBack = fullUrl;
                  break;
                }
              }
            }
            
            console.log(`[AddFarmerScreen] Tractor ${index + 1} images:`, {
              tractorImages: tractorImages.length,
              rcFront: rcFront ? 'present' : 'missing',
              rcBack: rcBack ? 'present' : 'missing',
            });
            
            return {
              id: String(index + 1),
              tractorImages: tractorImages,
              rcFront: rcFront,
              rcBack: rcBack,
              modelName: tractor.model_name || tractor.model || tractor.modelName || '',
              vehicleNumber: tractor.vehicle_number || tractor.vehicleNo || tractor.vehicleNumber || '',
              chassisNumber: tractor.chassis_number || tractor.chassisNo || tractor.chassisNumber || '',
              engineNumber: tractor.engine_number || tractor.engineNo || tractor.engineNumber || '',
              ownerName: tractor.ownername || tractor.owner_name || tractor.ownerName || '', // Priority: ownername from API
              purchaseDateDD: purchaseDateDD,
              purchaseDateMM: purchaseDateMM,
              purchaseDateYYYY: purchaseDateYYYY,
              whoFrom: tractor.who_drives || tractor.whoFrom || tractor.whoDrives || '',
              errors: {},
            };
          });
          
          setTractors(prefilledTractors);
          console.log('[AddFarmerScreen] Prefilled tractors:', prefilledTractors.length);
        } else {
          console.log('[AddFarmerScreen] No tractor data found in API response');
        }
      }
    } catch (error) {
      console.error('Error fetching farmer details for edit:', error);
      showToastMessage('Failed to load farmer details. Please try again.', 'error');
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Fetch farmer details when in edit mode or rejected update mode
  useEffect(() => {
    if ((isEditMode || isRejectedUpdate) && farmerId) {
      fetchFarmerDetailsForEdit();
    }
  }, [isEditMode, isRejectedUpdate, farmerId]);

  // Fetch questions when category changes
  useEffect(() => {
    if (category) {
      fetchQuestions(category);
      // Don't clear answers in edit mode if they're already prefilled
      if (!isEditMode) {
        setSubQuestionAnswers({});
      }
    } else {
      setQuestions([]);
      if (!isEditMode) {
        setSubQuestionAnswers({});
      }
    }
  }, [category, isEditMode]);

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
          paddingTop: insets.top + moderateScale(12),
          paddingBottom: moderateScale(12),
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
          marginLeft: moderateScale(10),
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
      setImagePickerVisible(false); // Close picker modal first
      console.log('Opening camera for:', imagePickerType);
      const imageUri = await pickImage('camera', {
        onError: (message) => showToastMessage(message),
      });
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
      showToastMessage('Failed to open camera. Please try again.');
    }
  };

  const handleGalleryPress = async () => {
    try {
      setImagePickerVisible(false); // Close picker modal first
      console.log('Opening gallery for:', imagePickerType);
      const imageUri = await pickImage('gallery', {
        onError: (message) => showToastMessage(message),
      });
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
      showToastMessage('Failed to open gallery. Please try again.');
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
              errors: {
                ...tractor.errors,
                tractorImages: undefined, // Clear error when image is uploaded
              },
            };
          } else {
            // Handle other image types (RC images)
            const fieldName = type === 'rc' ? 'rcImage' : type === 'rcFront' ? 'rcFront' : 'rcBack';
            return {
              ...tractor,
              [fieldName]: imageUri,
              errors: {
                ...tractor.errors,
                // Clear error when image is uploaded
                [fieldName]: undefined,
              },
            };
          }
        }
        return tractor;
      }),
    );
  };

  // Handle opening preview modal for uploaded images
  const handleImagePreview = (
    tractorId: string,
    type: 'tractor' | 'rcFront' | 'rcBack',
    imageUri: string,
    imageIndex?: number,
  ) => {
    setPreviewImageInfo({
      tractorId,
      type,
      imageIndex,
      imageUri,
    });
    setPreviewModalVisible(true);
  };

  // Handle replacing image from preview modal
  const handleReplaceImage = async (imageId: string) => {
    if (!previewImageInfo) return;
    
    // Close preview modal first
    setPreviewModalVisible(false);
    
    // Set up image picker for replacement
    setImagePickerType(previewImageInfo.type);
    setCurrentTractorId(
      previewImageInfo.type === 'tractor' && previewImageInfo.imageIndex !== undefined
        ? `${previewImageInfo.tractorId}-${previewImageInfo.imageIndex}`
        : previewImageInfo.tractorId
    );
    
    // Open image picker
    setImagePickerVisible(true);
  };

  const addTractorImage = (tractorId: string) => {
    setTractors(prev =>
      prev.map(tractor => {
        if (tractor.id === tractorId) {
          const currentImages = tractor.tractorImages || [];
          if (currentImages.length < 2) {
            const newImageIndex = currentImages.length;
            const newImages = [...currentImages, ''];
            // Open image picker for the new slot immediately
            requestAnimationFrame(() => {
              handleImagePicker('tractor', tractorId, newImageIndex);
            });
            return {
              ...tractor,
              tractorImages: newImages,
              errors: {
                ...tractor.errors,
                tractorImages: undefined, // Clear error when adding slot
              },
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
            showToastMessage('At least one tractor image is required');
          }
        }
        return tractor;
      }),
    );
  };

  /**
   * Process RC images with OCR and auto-fill tractor fields
   * This function validates the RC Book, extracts data, and auto-fills form fields
   * Processes both RC front and back images if available, or single image if only one is provided
   * @param tractorId - ID of the tractor to process
   */
  const processRCImagesForOCR = async (tractorId: string) => {
    // Find the tractor
    const tractor = tractors.find(t => t.id === tractorId);
    if (!tractor) {
      console.error('[AddFarmerScreen] Tractor not found:', tractorId);
      return;
    }

    const rcFront = tractor.rcFront?.trim();
    const rcBack = tractor.rcBack?.trim();

    // Validate at least one image exists
    if (!rcFront && !rcBack) {
      console.log('[AddFarmerScreen] At least one RC image required for OCR processing');
      showToastMessage('Please upload at least one RC Book image to extract data', 'error');
      return;
    }

    // Set processing state
    setOcrProcessingTractorId(tractorId);

    try {
      console.log('[AddFarmerScreen] Starting OCR processing for tractor:', tractorId);

      let extractedData: RCExtractedData;

      // Process both images if available (preferred), otherwise process single image
      if (rcFront && rcBack) {
        console.log('[AddFarmerScreen] Processing both RC images (front + back)');
        extractedData = await extractDataFromRCImages(rcFront, rcBack);
      } else if (rcFront) {
        console.log('[AddFarmerScreen] Processing RC front image only');
        extractedData = await extractDataFromRCImage(rcFront);
      } else {
        console.log('[AddFarmerScreen] Processing RC back image only');
        extractedData = await extractDataFromRCImage(rcBack!);
      }

      // Store extracted data for this tractor
      setOcrExtractedData(prev => ({
        ...prev,
        [tractorId]: extractedData,
      }));

      // Auto-fill tractor fields with extracted data
      autoFillTractorFromOCR(tractorId, extractedData);

      // Show success message with extracted fields summary
      const foundFields = [];
      if (extractedData.modelNumber) foundFields.push('Model Name');
      if (extractedData.vehicleNumber) foundFields.push('Vehicle Number');
      if (extractedData.ownerName) foundFields.push('Owner Name');
      if (extractedData.chassisNumber) foundFields.push('Chassis Number');
      if (extractedData.engineNumber) foundFields.push('Engine Number');
      if (extractedData.registrationDate) foundFields.push('Registration Date');

      if (foundFields.length > 0) {
        showToastMessage(
          `Successfully extracted: ${foundFields.join(', ')}`,
          'success',
        );
      } else {
        // No fields extracted - this is not necessarily an error, just informational
        // User can still manually fill the fields
        showToastMessage(
          'RC Book validated. Please review and fill the fields manually if needed.',
          'success',
        );
      }

      console.log('[AddFarmerScreen] OCR processing complete:', extractedData);
    } catch (error: any) {
      console.error('[AddFarmerScreen] Error during OCR processing:', error);
      
      // Show user-friendly error message
      const errorMessage = error?.message || 'Failed to extract data from RC Book images';
      showToastMessage(errorMessage, 'error');

      // Clear processing state
      setOcrProcessingTractorId(null);
    } finally {
      setOcrProcessingTractorId(null);
    }
  };

  /**
   * Auto-fill tractor fields from OCR extracted data
   * Only fills empty fields to preserve user edits
   * @param tractorId - ID of the tractor to auto-fill
   * @param extractedData - Data extracted from OCR
   */
  const autoFillTractorFromOCR = (
    tractorId: string,
    extractedData: RCExtractedData,
  ) => {
    setTractors(prev =>
      prev.map(tractor => {
        if (tractor.id === tractorId) {
          const updates: Partial<TractorDetails> = {};

          // Auto-fill Model Name (only if empty)
          if (extractedData.modelNumber && !tractor.modelName.trim()) {
            updates.modelName = extractedData.modelNumber;
            // Clear error if exists
            if (tractor.errors.modelName) {
              updates.errors = {
                ...(updates.errors || tractor.errors),
                modelName: undefined,
              };
            }
          }

          // Auto-fill Vehicle Number (only if empty)
          if (extractedData.vehicleNumber && !tractor.vehicleNumber.trim()) {
            updates.vehicleNumber = extractedData.vehicleNumber;
            // Clear error if exists
            if (tractor.errors.vehicleNumber) {
              updates.errors = {
                ...(updates.errors || tractor.errors),
                vehicleNumber: undefined,
              };
            }
          }

          // Auto-fill Owner Name (only if empty)
          if (extractedData.ownerName && !tractor.ownerName.trim()) {
            updates.ownerName = extractedData.ownerName;
            // Clear error if exists
            if (tractor.errors.ownerName) {
              updates.errors = {
                ...(updates.errors || tractor.errors),
                ownerName: undefined,
              };
            }
          }

          // Auto-fill Chassis Number (only if empty)
          if (extractedData.chassisNumber && !tractor.chassisNumber.trim()) {
            updates.chassisNumber = extractedData.chassisNumber;
            // Clear error if exists
            if (tractor.errors.chassisNumber) {
              updates.errors = {
                ...(updates.errors || tractor.errors),
                chassisNumber: undefined,
              };
            }
          }

          // Auto-fill Engine Number (only if empty)
          if (extractedData.engineNumber && !tractor.engineNumber.trim()) {
            updates.engineNumber = extractedData.engineNumber;
            // Clear error if exists
            if (tractor.errors.engineNumber) {
              updates.errors = {
                ...(updates.errors || tractor.errors),
                engineNumber: undefined,
              };
            }
          }

          // Auto-fill Registration Date (parse DD/MM/YYYY or DD-MM-YYYY format)
          if (
            extractedData.registrationDate &&
            (!tractor.purchaseDateDD || !tractor.purchaseDateMM || !tractor.purchaseDateYYYY)
          ) {
            // Parse registration date (format: DD/MM/YYYY or DD-MM-YYYY)
            const dateMatch = extractedData.registrationDate.match(
              /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
            );
            if (dateMatch && dateMatch.length >= 4) {
              const day = dateMatch[1].padStart(2, '0');
              const month = dateMatch[2].padStart(2, '0');
              const year = dateMatch[3];

              // Validate date
              const dayNum = parseInt(day, 10);
              const monthNum = parseInt(month, 10);
              const yearNum = parseInt(year, 10);

              if (
                dayNum >= 1 &&
                dayNum <= 31 &&
                monthNum >= 1 &&
                monthNum <= 12 &&
                yearNum >= 1900 &&
                yearNum <= 2100
              ) {
                const testDate = new Date(yearNum, monthNum - 1, dayNum);
                if (
                  testDate.getDate() === dayNum &&
                  testDate.getMonth() === monthNum - 1 &&
                  testDate.getFullYear() === yearNum
                ) {
                  updates.purchaseDateDD = day;
                  updates.purchaseDateMM = month;
                  updates.purchaseDateYYYY = year;
                  // Clear date errors if exists
                  if (tractor.errors.purchaseDateDD || tractor.errors.purchaseDateError) {
                    updates.errors = {
                      ...(updates.errors || tractor.errors),
                      purchaseDateDD: undefined,
                      purchaseDateError: undefined,
                    };
                  }
                }
              }
            }
          }

          // Merge updates
          if (Object.keys(updates).length > 0) {
            return {
              ...tractor,
              ...updates,
              errors: updates.errors || tractor.errors,
            };
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
        vehicleNumber: '',
        chassisNumber: '',
        engineNumber: '',
        ownerName: '',
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
      showToastMessage('At least one tractor is required');
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
              // Clear date error when any date field changes
              purchaseDateError: (field === 'purchaseDateDD' || field === 'purchaseDateMM' || field === 'purchaseDateYYYY') 
                ? undefined 
                : tractor.errors.purchaseDateError,
            },
          };
        }
        return tractor;
      }),
    );
  };
  
  const updateTractorDateError = (tractorId: string, error: string | undefined) => {
    setTractors(prev =>
      prev.map(tractor => {
        if (tractor.id === tractorId) {
          return {
            ...tractor,
            errors: {
              ...tractor.errors,
              purchaseDateError: error,
            },
          };
        }
        return tractor;
      }),
    );
  };

  const validateForm = (): boolean => {
    console.log('=== VALIDATION START ===');
    const newErrors: FormErrors = {};

    // Profile photo - optional (not shown in edit mode)
    if (!isEditMode) {
      console.log('Checking profile photo:', profilePhoto ? '✓ Present' : '○ Optional (not provided)');
    }

    // Category - not required in edit mode
    if (!isEditMode) {
      console.log('Checking category:', category || '✗ Missing');
      if (!category) {
        newErrors.category = 'Category is required';
        console.log('ERROR: Category is required');
      }
    }

    // Sub-questions validation - ALL questions must be answered (skip in edit mode)
    if (!isEditMode) {
      console.log('=== SUB-QUESTIONS VALIDATION ===');
      console.log('Total questions:', questions.length);
      
      // Use ref if available (updated immediately), otherwise fall back to state
      const answersToCheck = Object.keys(latestSubQuestionAnswersRef.current).length > 0 
        ? latestSubQuestionAnswersRef.current 
        : subQuestionAnswers;
      
      console.log('All subQuestionAnswers keys:', Object.keys(answersToCheck));
      console.log('All subQuestionAnswers values:', JSON.stringify(answersToCheck, null, 2));
      
      if (category && questions.length > 0) {
      const unansweredQuestions = questions.filter((question, index) => {
        const questionKey = `question_${question.id}_${index}`;
        const answer = answersToCheck[questionKey];
        
        console.log(`\nChecking Question ${index + 1}:`);
        console.log('  - Question ID:', question.id);
        console.log('  - Question text:', question.question_text);
        console.log('  - Question type:', question.question_type);
        console.log('  - Question key:', questionKey);
        console.log('  - Answer value:', answer);
        console.log('  - Answer type:', typeof answer);
        console.log('  - Is array?', Array.isArray(answer));
        if (Array.isArray(answer)) {
          console.log('  - Array length:', answer.length);
          console.log('  - Array contents:', answer);
        }
        
        let isUnanswered = false;
        
        if (answer === undefined || answer === null) {
          isUnanswered = true;
          console.log('  - Status: ✗ Unanswered (undefined/null)');
        } else if (Array.isArray(answer)) {
          // For arrays, check if it has at least one non-empty element
          // Handle file arrays (objects with uri property) differently from string arrays
          const questionType = question.question_type?.toLowerCase() || 'textbox';
          let nonEmptyItems: any[] = [];
          
          if (questionType === 'file' || questionType === 'document') {
            // For file arrays, check if objects have valid uri
            nonEmptyItems = answer.filter((item: any) => 
              item && typeof item === 'object' && item.uri && item.uri.trim() !== ''
            );
          } else {
            // For other arrays (checkbox, etc.), check strings
            nonEmptyItems = answer.filter((item: any) => {
              if (typeof item === 'string') {
                return item.trim() !== '';
              }
              return item !== null && item !== undefined;
            });
          }
          
          if (nonEmptyItems.length === 0) {
            isUnanswered = true;
            console.log('  - Status: ✗ Unanswered (empty array or all empty items)');
          } else {
            console.log('  - Status: ✓ Answered (array with', nonEmptyItems.length, 'non-empty items)');
          }
        } else if (typeof answer === 'string') {
          const trimmed = answer.trim();
          if (trimmed === '') {
            isUnanswered = true;
            console.log('  - Status: ✗ Unanswered (empty string)');
          } else {
            console.log('  - Status: ✓ Answered (string:', trimmed, ')');
          }
        } else if (typeof answer === 'number') {
          // Numbers are considered answered
          console.log('  - Status: ✓ Answered (number:', answer, ')');
        } else if (typeof answer === 'boolean') {
          // Booleans are considered answered
          console.log('  - Status: ✓ Answered (boolean:', answer, ')');
        } else {
          // For other types, consider it answered
          console.log('  - Status: ✓ Answered (other type:', typeof answer, ', value:', answer, ')');
        }
        
        return isUnanswered;
      });
      
      console.log('\n=== SUB-QUESTIONS VALIDATION RESULT ===');
      console.log('Unanswered questions count:', unansweredQuestions.length);
      console.log('Total questions:', questions.length);
      
      if (unansweredQuestions.length > 0) {
        console.log('Unanswered question IDs:', unansweredQuestions.map(q => q.id));
        console.log('Unanswered question texts:', unansweredQuestions.map(q => q.question_text));
        newErrors.selectedSubQuestion = `Please answer all ${questions.length} sub-question${questions.length > 1 ? 's' : ''}`;
        console.log(`ERROR: ${unansweredQuestions.length} out of ${questions.length} questions are unanswered`);
      } else {
        console.log('✓ All questions answered successfully');
        }
      } else {
        console.log('No questions to validate (category:', category, ', questions.length:', questions.length, ')');
      }
    }

    // Personal details
    console.log('=== PERSONAL DETAILS VALIDATION ===');
    console.log('First name:', firstName || '✗ Missing');
    if (!firstName || !firstName.trim()) {
      newErrors.firstName = 'First name is required';
      console.log('ERROR: First name is required');
    }
    
    console.log('Last name:', lastName || '✗ Missing');
    if (!lastName || !lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      console.log('ERROR: Last name is required');
    }
    
    console.log('Country code:', countryCode || '✗ Missing');
    if (!countryCode || !countryCode.trim()) {
      newErrors.countryCode = 'Country code is required';
      console.log('ERROR: Country code is required');
    }
    
    console.log('Phone number:', phoneNumber || '✗ Missing');
    if (!phoneNumber || !phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
      console.log('ERROR: Phone number is required');
    }
    
    console.log('Date of birth - DD:', dobDD, 'MM:', dobMM, 'YYYY:', dobYYYY);
    if (!dobDD || !dobDD.trim() || !dobMM || !dobMM.trim() || !dobYYYY || !dobYYYY.trim()) {
      newErrors.dobDD = 'Date of birth is required';
      console.log('ERROR: Date of birth is required');
    }
    
    console.log('Date of marriage - DD:', domDD, 'MM:', domMM, 'YYYY:', domYYYY);
    if (!domDD || !domDD.trim() || !domMM || !domMM.trim() || !domYYYY || !domYYYY.trim()) {
      newErrors.domDD = 'Date of marriage is required';
      console.log('ERROR: Date of marriage is required');
    }
    
    // console.log('Who from:', whoFrom || '✗ Missing');
    // if (!whoFrom || !whoFrom.trim()) {
    //   newErrors.whoFrom = 'Who from is required';
    //   console.log('ERROR: Who from is required');
    // }

    // Address
    console.log('=== ADDRESS VALIDATION ===');
    console.log('House number:', houseNumber || '✗ Missing');
    if (!houseNumber || !houseNumber.trim()) {
      newErrors.houseNumber = 'House number is required';
      console.log('ERROR: House number is required');
    }
    
    console.log('Street name:', streetName || '✗ Missing');
    if (!streetName || !streetName.trim()) {
      newErrors.streetName = 'Street name is required';
      console.log('ERROR: Street name is required');
    }
    
    console.log('State ID:', stateId || '✗ Missing');
    if (!stateId || !stateId.trim()) {
      newErrors.state = 'State is required';
      console.log('ERROR: State is required');
    }
    
    console.log('District ID:', districtId || '✗ Missing');
    if (!districtId || !districtId.trim()) {
      newErrors.district = 'District is required';
      console.log('ERROR: District is required');
    }
    
    console.log('Village ID:', villageId || '✗ Missing');
    if (!villageId || !villageId.trim()) {
      newErrors.village = 'Village is required';
      console.log('ERROR: Village is required');
    }
    
    console.log('Pincode:', pincode || '✗ Missing');
    if (!pincode || !pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
      console.log('ERROR: Pincode is required');
    }

    setErrors(newErrors);
    latestErrorsRef.current = newErrors;

    // Validate tractors
    console.log('=== TRACTOR VALIDATION ===');
    console.log('Total tractors:', tractors.length);
    let tractorErrors = false;
    const updatedTractors = tractors.map((tractor, tractorIndex) => {
      console.log(`\n--- Validating Tractor ${tractorIndex + 1} (ID: ${tractor.id}) ---`);
      const tractorErrorsObj: TractorDetails['errors'] = {};

      // Validate tractor images (min 1 required)
      // Filter out empty strings and null/undefined values
      const uploadedTractorImages = (tractor.tractorImages || []).filter(
        img => img && typeof img === 'string' && img.trim() !== ''
      );
      console.log('Tractor images:', uploadedTractorImages.length, 'uploaded out of', (tractor.tractorImages || []).length, 'slots');
      if (uploadedTractorImages.length === 0) {
        tractorErrorsObj.tractorImages = 'At least one tractor image is required';
        tractorErrors = true;
        console.log('ERROR: At least one tractor image is required');
      } else {
        console.log('✓ Tractor images validated');
      }

      console.log('Model name:', tractor.modelName || '✗ Missing');
      if (!tractor.modelName || !tractor.modelName.trim()) {
        tractorErrorsObj.modelName = 'Model name is required';
        tractorErrors = true;
        console.log('ERROR: Model name is required');
      }
      
      console.log('Chassis number:', tractor.chassisNumber || '✗ Missing');
      if (!tractor.chassisNumber || !tractor.chassisNumber.trim()) {
        tractorErrorsObj.chassisNumber = 'Chassis number is required';
        tractorErrors = true;
        console.log('ERROR: Chassis number is required');
      }
      
      console.log('Engine number:', tractor.engineNumber || '✗ Missing');
      if (!tractor.engineNumber || !tractor.engineNumber.trim()) {
        tractorErrorsObj.engineNumber = 'Engine number is required';
        tractorErrors = true;
        console.log('ERROR: Engine number is required');
      }
      
      console.log('Owner name:', tractor.ownerName || '✗ Missing');
      if (!tractor.ownerName || !tractor.ownerName.trim()) {
        tractorErrorsObj.ownerName = 'Owner name is required';
        tractorErrors = true;
        console.log('ERROR: Owner name is required');
      }
      
      console.log('Vehicle number:', tractor.vehicleNumber || '✗ Missing');
      if (!tractor.vehicleNumber || !tractor.vehicleNumber.trim()) {
        tractorErrorsObj.vehicleNumber = 'Vehicle number is required';
        tractorErrors = true;
        console.log('ERROR: Vehicle number is required');
      } else {
        // Validate vehicle number format (e.g., "GJ 27 AJ 9314" or "GJ27AJ9314")
        const vehicleNumberRegex = /^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,2}\s?\d{1,4}$/i;
        if (!vehicleNumberRegex.test(tractor.vehicleNumber.trim())) {
          tractorErrorsObj.vehicleNumber = 'Please enter a valid vehicle number (e.g., GJ 27 AJ 9314)';
          tractorErrors = true;
          console.log('ERROR: Invalid vehicle number format');
        }
      }
      
      console.log('Purchase date - DD:', tractor.purchaseDateDD, 'MM:', tractor.purchaseDateMM, 'YYYY:', tractor.purchaseDateYYYY);
      if (!tractor.purchaseDateDD || !tractor.purchaseDateDD.trim() || 
          !tractor.purchaseDateMM || !tractor.purchaseDateMM.trim() || 
          !tractor.purchaseDateYYYY || !tractor.purchaseDateYYYY.trim()) {
        tractorErrorsObj.purchaseDateDD = 'Date of purchase is required';
        tractorErrors = true;
        console.log('ERROR: Date of purchase is required');
      }
      
      // Validate RC Front image (required)
      console.log('RC Front image:', tractor.rcFront || '✗ Missing');
      if (!tractor.rcFront || !tractor.rcFront.trim()) {
        tractorErrorsObj.rcFront = 'RC book front image is required';
        tractorErrors = true;
        console.log('ERROR: RC book front image is required');
      } else {
        console.log('✓ RC Front image validated');
      }
      
      // Validate RC Back image (required)
      console.log('RC Back image:', tractor.rcBack || '✗ Missing');
      if (!tractor.rcBack || !tractor.rcBack.trim()) {
        tractorErrorsObj.rcBack = 'RC book back image is required';
        tractorErrors = true;
        console.log('ERROR: RC book back image is required');
      } else {
        console.log('✓ RC Back image validated');
      }
      
      // console.log('Who from:', tractor.whoFrom || '✗ Missing');
      // if (!tractor.whoFrom || !tractor.whoFrom.trim()) {
      //   tractorErrorsObj.whoFrom = 'Who from is required';
      //   tractorErrors = true;
      //   console.log('ERROR: Who from is required');
      // }
      
      const hasTractorErrors = Object.keys(tractorErrorsObj).length > 0;
      if (!hasTractorErrors) {
        console.log('✓ Tractor', tractorIndex + 1, 'is valid');
      } else {
        console.log('✗ Tractor', tractorIndex + 1, 'has', Object.keys(tractorErrorsObj).length, 'error(s)');
      }

      return {
        ...tractor,
        errors: tractorErrorsObj,
      };
    });

    if (tractorErrors) {
      setTractors(updatedTractors);
      latestTractorsRef.current = updatedTractors;
    }

    const hasFormErrors = Object.keys(newErrors).length > 0;
    const isValid = !hasFormErrors && !tractorErrors;
    
    // Log validation result for debugging
    console.log('\n=== VALIDATION SUMMARY ===');
    console.log('Form errors count:', Object.keys(newErrors).length);
    if (hasFormErrors) {
      console.log('Form errors:', newErrors);
    }
    console.log('Tractor errors:', tractorErrors ? 'Yes' : 'No');
    if (tractorErrors) {
      console.log('Tractor errors details:', updatedTractors.map(t => ({
        id: t.id,
        errors: t.errors
      })));
    }
    console.log('Overall validation result:', isValid ? '✓ VALID' : '✗ INVALID');
    console.log('=== VALIDATION END ===\n');
    
    return isValid;
  };

  // Handle rejected update farmer (from notifications)
  const handleRejectedUpdate = async () => {
    if (!isRejectedUpdate || !farmerId) {
      console.error('handleRejectedUpdate called but not in rejected update mode or farmerId missing');
      return;
    }
    
    console.log('[AddFarmerScreen] Updating rejected farmer with ID:', farmerId);

    // Small delay to ensure all state updates are complete before validation
    await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
    
    // Validate form for rejected update mode (validate all fields including tractors)
    const isValid = validateForm();
    
    if (!isValid) {
      // Scroll to first error field (same as handleUpdateFarmer)
      setTimeout(() => {
        const currentErrors = latestErrorsRef.current;
        const currentTractors = latestTractorsRef.current;
        
        // Find first error field
        let firstErrorField: string | null = null;
        let firstErrorY = 0;
        
        // Priority order for error fields
        const errorFieldOrder = [
          'firstName',
          'lastName',
          'countryCode',
          'phoneNumber',
          'dobDD',
          'domDD',
          'houseNumber',
          'streetName',
          'village',
          'district',
          'state',
          'pincode',
        ];
        
        // Check form errors in priority order
        for (const fieldName of errorFieldOrder) {
          if (currentErrors[fieldName as keyof FormErrors]) {
            firstErrorField = fieldName;
            firstErrorY = fieldPositions.current[fieldName] || 0;
            break;
          }
        }
        
        // If no form error, check tractor errors
        if (!firstErrorField) {
          const firstTractorError = currentTractors.find(t => 
            Object.values(t.errors).some(err => err)
          );
          if (firstTractorError) {
            const tractorErrorKeys = Object.keys(firstTractorError.errors).filter(
              key => firstTractorError.errors[key as keyof TractorDetails['errors']]
            );
            if (tractorErrorKeys.length > 0) {
              firstErrorField = `tractor_${firstTractorError.id}_${tractorErrorKeys[0]}`;
              firstErrorY = fieldPositions.current[firstErrorField] || 0;
            }
          }
        }
        
        // Scroll to first error field
        if (firstErrorField && firstErrorY > 0) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, firstErrorY - 100),
            animated: true,
          });
        } else {
          scrollViewRef.current?.scrollTo({y: 0, animated: true});
        }
      }, 300);
      return;
    }

    try {
      setSubmitting(true);

      // Format questions array with all question details from API (same as handleUpdateFarmer)
      const questionArray = questions.map((question, index) => {
        const questionKey = `question_${question.id}_${index}`;
        const answer = subQuestionAnswers[questionKey];
        
        const answers: {id: number; answer_text: string}[] = [];
        
        if (answer !== undefined && answer !== null && answer !== '') {
          const questionType = question.question_type?.toLowerCase() || 'textbox';
          
          // Get options from answer_options or options
          const questionOptions = question.answer_options || question.options || [];
          
          // Handle file/document type separately - files are uploaded separately
          if ((questionType === 'file' || questionType === 'document') && Array.isArray(answer)) {
            // For file questions, the files will be uploaded separately with question_docs_{index} key
            const fileCount = answer.filter((file: any) => {
              // Check if it's a new file (local URI) or existing file (URL)
              if (file && typeof file === 'object' && file.uri) {
                return file.uri.startsWith('file://') || file.uri.startsWith('content://');
              }
              return false;
            }).length;
            if (fileCount > 0) {
              answers.push({
                id: question.id || Date.now(),
                answer_text: `${fileCount} file(s) uploaded`,
              });
            }
          } else if (questionType === 'checkbox' && Array.isArray(answer)) {
            // For checkbox questions, each selected option becomes an answer
            answer.forEach((selectedOption: string) => {
              if (selectedOption && selectedOption.trim()) {
                const option = questionOptions.find((opt: any) => 
                  opt.option_text === selectedOption || 
                  opt.text === selectedOption ||
                  opt.value === selectedOption || 
                  opt === selectedOption
                );
                const answerId = option?.id || 
                                option?.option_id || 
                                Date.now();
                
                answers.push({
                  id: answerId,
                  answer_text: selectedOption,
                });
              }
            });
          } else if (questionType === 'radio' && typeof answer === 'string') {
            const option = questionOptions.find((opt: any) => 
              opt.option_text === answer || 
              opt.text === answer ||
              opt.value === answer || 
              opt === answer
            );
            const answerId = option?.id || 
                            option?.option_id || 
                            Date.now();
            
            answers.push({
              id: answerId,
              answer_text: answer,
            });
          } else if (questionType === 'dropdown' && typeof answer === 'string') {
            const option = questionOptions.find((opt: any) => 
              opt.option_text === answer || 
              opt.text === answer ||
              opt.value === answer || 
              opt === answer
            );
            const answerId = option?.id || 
                            option?.option_id || 
                            Date.now();
            
            answers.push({
              id: answerId,
              answer_text: answer,
            });
          } else {
            // For text questions
            const answerText = Array.isArray(answer) 
              ? answer.filter(item => item).join(', ')
              : String(answer).trim();
            
            if (answerText) {
              answers.push({
                id: question.id || Date.now(),
                answer_text: answerText,
              });
            }
          }
        }
        
        return {
          ...question,
          answers: answers,
        };
      });

      // Format tractor details (same as handleUpdateFarmer)
      const tractorDetailsArray = tractors.map(tractor => ({
        model_name: tractor.modelName,
        vehicle_number: tractor.vehicleNumber,
        chassis_number: tractor.chassisNumber,
        engine_number: tractor.engineNumber,
        invoice_day: tractor.purchaseDateDD,
        invoice_month: tractor.purchaseDateMM,
        invoice_year: tractor.purchaseDateYYYY,
        registration_day: tractor.purchaseDateDD,
        registration_month: tractor.purchaseDateMM,
        registration_year: tractor.purchaseDateYYYY,
        who_drives: tractor.whoFrom,
        owner_name: tractor.ownerName || '',
      }));

      // Get names from selected IDs
      const selectedState = states.find(s => s.value === stateId);
      const selectedDistrict = districts.find(d => d.value === districtId);
      const selectedVillage = villages.find(v => v.value === villageId);

      // Prepare the data object according to API structure (same as handleUpdateFarmer but for rejected update)
      const farmerData = {
        farmer_id: farmerId, // Include farmer_id for update
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        mobile_number: phoneNumber.replace(/\s/g, ''),
        mobile_country_code: countryCode,
        dob_day: dobDD,
        dob_month: dobMM,
        dob_year: dobYYYY,
        dom_day: domDD,
        dom_month: domMM,
        dom_year: domYYYY,
        category_id: category || undefined,
        state_id: stateId,
        district_id: districtId,
        village_id: villageId,
        address: {
          house_number: houseNumber,
          street_name: streetName,
          landmark: landmark,
          village: selectedVillage?.label || villageId,
          district: selectedDistrict?.label || districtId,
          state: selectedState?.label || stateId,
          pincode: pincode,
        },
        questions: questionArray,
        tractorDetails: tractorDetailsArray,
      };

      // Create FormData
      const formData = new FormData();
      
      // Add data as JSON string
      formData.append('data', JSON.stringify(farmerData));
      
      // Add profile photo (if it's a new local image)
      if (profilePhoto && (profilePhoto.startsWith('file://') || profilePhoto.startsWith('content://'))) {
        const profileUriParts = profilePhoto.split('.');
        const profileFileExtension = profileUriParts.length > 1 ? profileUriParts[profileUriParts.length - 1].toLowerCase() : 'jpg';
        const profileMimeType = profileFileExtension === 'png' ? 'image/png' : 'image/jpeg';
        const profileFileName = `profile-photo-${Date.now()}.${profileFileExtension}`;
        
        formData.append('profile_photo', {
          uri: profilePhoto,
          type: profileMimeType,
          name: profileFileName,
        } as any);
      }

      // Helper function to append file (image) to FormData
      const appendFile = (key: string, fileUri: string, fileType: 'image', index?: number) => {
        if (!fileUri || fileUri.trim() === '') return;
        
        // Only append new files (local URIs), skip existing URLs
        if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
          return; // Skip existing URLs
        }
        
        const uriParts = fileUri.split('.');
        const fileExtension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
        const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
        const fileName = `${key}-${Date.now()}-${index || 0}.${fileExtension}`;
        
        formData.append(key, {
          uri: fileUri,
          type: mimeType,
          name: fileName,
        } as any);
      };

      // Add question document files with question_docs_{index} key
      questions.forEach((question, questionIndex) => {
        const questionKey = `question_${question.id}_${questionIndex}`;
        const answer = subQuestionAnswers[questionKey];
        const questionType = question.question_type?.toLowerCase() || 'textbox';
        
        // Handle file/document type questions
        if ((questionType === 'file' || questionType === 'document') && Array.isArray(answer)) {
          const validFiles = answer.filter((file: any) => {
            // Only include new files (local URIs)
            return file && file.uri && (file.uri.startsWith('file://') || file.uri.startsWith('content://'));
          });
          validFiles.forEach((file: any, fileIndex: number) => {
            const fileKey = `question_docs_${questionIndex}`;
            appendFile(fileKey, file.uri, file.type || 'image', fileIndex);
          });
        }
      });

      // Add tractor images and RC images with indexed naming
      tractors.forEach((tractor, tractorIndex) => {
        // Add tractor images (min 1, max 2)
        if (tractor.tractorImages && tractor.tractorImages.length > 0) {
          const validImages = tractor.tractorImages.filter(img => img && img.trim() !== '');
          validImages.forEach((imageUri, imageIndex) => {
            let imageKey = '';
            if (tractorIndex === 0) {
              imageKey = 'tractor_images_0';
            } else if (tractorIndex === 1) {
              imageKey = 'tractor_images_1';
            } else {
              imageKey = `tractor_images_${tractorIndex}`;
            }
            appendFile(imageKey, imageUri, 'image', imageIndex);
          });
        }

        // Add RC front image
        if (tractor.rcFront && tractor.rcFront.trim() !== '') {
          appendFile(`tractor_rc_front_${tractorIndex}`, tractor.rcFront, 'image');
        }

        // Add RC back image
        if (tractor.rcBack && tractor.rcBack.trim() !== '') {
          appendFile(`tractor_rc_back_${tractorIndex}`, tractor.rcBack, 'image');
        }
      });

      console.log('[AddFarmerScreen] Updating rejected farmer data:', farmerData, null, 2);
      console.log('', farmerId);

      // Call rejected update API - Use PUT method with form-data (as shown in Postman image)
      // This matches the Postman structure: PUT /api/dealer/v1/farmer/update with form-data
      // The data includes farmer_id and all form fields like add farmer API
      const response = await putDataWithImage(Apis.DEALER_UPDATE_FARMER_V1, formData);
      
      console.log('[AddFarmerScreen] Rejected update API Response:', JSON.stringify(response, null, 2));

      // Check if response exists and has status
      if (response && response.status === true) {
        // Show success toast
        const successMessage = response?.message || 'Update request sent for verification. Check notifications for update.';
        showToastMessage(successMessage, 'success');
        
        // Navigate back after a short delay to allow toast to be visible
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        // Extract error message from various possible response structures
        let errorMessage = '';
        if (response) {
          errorMessage = response?.message || 
                        response?.data?.message || 
                        response?.error?.message ||
                        response?.error ||
                        (typeof response === 'string' ? response : '');
        }
        
        // Show error message from API response or fallback
        const finalErrorMessage = errorMessage || 'Failed to update rejected farmer. Please try again.';
        console.log('[AddFarmerScreen] Showing error toast with API message:', finalErrorMessage);
        showToastMessage(finalErrorMessage, 'error');
      }
    } catch (error: any) {
      console.error('[AddFarmerScreen] Error updating rejected farmer:', error);
      
      // Extract error message from various possible error structures
      let errorMessage = '';
      if (error?.response?.data) {
        errorMessage = error.response.data.message || 
                      error.response.data.error?.message ||
                      error.response.data.error ||
                      '';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show error message from API response or fallback
      const finalErrorMessage = errorMessage || 'Failed to update rejected farmer. Please try again.';
      console.log('[AddFarmerScreen] Showing error toast with API message:', finalErrorMessage);
      showToastMessage(finalErrorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update farmer in edit mode (from farmer list) - Simple form with PUT API
  const handleUpdateFarmer = async () => {
    if (!isEditMode || isRejectedUpdate || !farmerId) {
      console.error('handleUpdateFarmer called but not in edit mode or farmerId missing');
      return;
    }
    
    // Use numeric ID if available, otherwise try to parse farmerId
    const updateId = farmerNumericId || (farmerId && !isNaN(parseInt(farmerId)) ? parseInt(farmerId) : null);
    
    if (!updateId) {
      console.error('No valid numeric ID available for update API');
      showToastMessage('Invalid farmer ID. Please try again.', 'error');
      return;
    }
    
    console.log('[AddFarmerScreen] Updating farmer with ID:', updateId);

    // Small delay to ensure all state updates are complete before validation
    await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
    
    // Validate form for edit mode (only personal details and address, no tractors/category)
    const newErrors: FormErrors = {};

    // Personal details validation
    if (!firstName || !firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName || !lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!countryCode || !countryCode.trim()) {
      newErrors.countryCode = 'Country code is required';
    }
    if (!phoneNumber || !phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (!dobDD || !dobDD.trim() || !dobMM || !dobMM.trim() || !dobYYYY || !dobYYYY.trim()) {
      newErrors.dobDD = 'Date of birth is required';
    }
    if (!domDD || !domDD.trim() || !domMM || !domMM.trim() || !domYYYY || !domYYYY.trim()) {
      newErrors.domDD = 'Date of marriage is required';
    }

    // Address validation
    if (!houseNumber || !houseNumber.trim()) {
      newErrors.houseNumber = 'House number is required';
    }
    if (!streetName || !streetName.trim()) {
      newErrors.streetName = 'Street name is required';
    }
    if (!stateId || !stateId.trim()) {
      newErrors.state = 'State is required';
    }
    if (!districtId || !districtId.trim()) {
      newErrors.district = 'District is required';
    }
    if (!villageId || !villageId.trim()) {
      newErrors.village = 'Village is required';
    }
    if (!pincode || !pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    }

    setErrors(newErrors);
    latestErrorsRef.current = newErrors;

    const hasFormErrors = Object.keys(newErrors).length > 0;
    
    if (hasFormErrors) {
      // Scroll to first error field
      setTimeout(() => {
        const currentErrors = latestErrorsRef.current;
        const errorFieldOrder = [
          'firstName',
          'lastName',
          'countryCode',
          'phoneNumber',
          'dobDD',
          'domDD',
          'houseNumber',
          'streetName',
          'village',
          'district',
          'state',
          'pincode',
        ];
        
        for (const fieldName of errorFieldOrder) {
          if (currentErrors[fieldName as keyof FormErrors]) {
            const firstErrorY = fieldPositions.current[fieldName] || 0;
            if (firstErrorY > 0) {
              scrollViewRef.current?.scrollTo({
                y: Math.max(0, firstErrorY - 100),
                animated: true,
              });
            }
            break;
          }
        }
      }, 300);
      return;
    }

    try {
      setSubmitting(true);

      // Prepare update data - Simple structure for edit from farmer list (PUT API)
      const updateData = {
        farmer_id: updateId,
        changes: {
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName,
          mobile_country_code: countryCode,
          mobile: phoneNumber.replace(/\s/g, ''),
          date_of_birth: `${dobDD}/${dobMM}/${dobYYYY}`,
          date_of_marriage: `${domDD}/${domMM}/${domYYYY}`,
          house_number: houseNumber,
          street_name: streetName,
          landmark: landmark,
          state: stateId,
          district: districtId,
          village: villageId,
          pincode: pincode,
        },
      };
      
      console.log('[AddFarmerScreen] Updating farmer data (simple edit):', JSON.stringify(updateData, null, 2));
      
      // Upload profile photo separately if it's a new image
      if (profilePhoto && (profilePhoto.startsWith('file://') || profilePhoto.startsWith('content://'))) {
        const profileUriParts = profilePhoto.split('.');
        const profileFileExtension = profileUriParts.length > 1 ? profileUriParts[profileUriParts.length - 1].toLowerCase() : 'jpg';
        const profileMimeType = profileFileExtension === 'png' ? 'image/png' : 'image/jpeg';
        const profileFileName = `profile-photo-${Date.now()}.${profileFileExtension}`;
        
        const imageFormData = new FormData();
        imageFormData.append('image', {
          uri: profilePhoto,
          type: profileMimeType,
          name: profileFileName,
        } as any);
        
        // Upload profile image first
        const imageResponse = await postDataWithImage(Apis.DEALER_PROFILE_IMAGE, imageFormData);
        if (imageResponse?.status !== true) {
          showToastMessage('Failed to upload profile image. Please try again.', 'error');
          setSubmitting(false);
          return;
        }
      }
      
      // Call update API (PUT request with simple structure)
      const response = await putData(Apis.DEALER_UPDATE_FARMER, updateData);
      
      console.log('[AddFarmerScreen] Update API Response:', JSON.stringify(response, null, 2));

      // Check if response exists and has status
      if (response && response.status === true) {
        // Show success toast
        const successMessage = response?.message || 'Update request sent for verification. Check notifications for update.';
        showToastMessage(successMessage, 'success');
        
        // Navigate back after a short delay to allow toast to be visible
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        // Extract error message from various possible response structures
        let errorMessage = '';
        if (response) {
          errorMessage = response?.message || 
                        response?.data?.message || 
                        response?.error?.message ||
                        response?.error ||
                        (typeof response === 'string' ? response : '');
        }
        
        // Show error message from API response or fallback
        const finalErrorMessage = errorMessage || 'Failed to update farmer. Please try again.';
        console.log('[AddFarmerScreen] Showing error toast with API message:', finalErrorMessage);
        showToastMessage(finalErrorMessage, 'error');
      }
    } catch (error: any) {
      console.error('[AddFarmerScreen] Error updating farmer:', error);
      
      // Extract error message from various possible error structures
      let errorMessage = '';
      if (error?.response?.data) {
        errorMessage = error.response.data.message || 
                      error.response.data.error?.message ||
                      error.response.data.error ||
                      '';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show error message from API response or fallback
      const finalErrorMessage = errorMessage || 'Failed to update farmer. Please try again.';
      console.log('[AddFarmerScreen] Showing error toast with API message:', finalErrorMessage);
      showToastMessage(finalErrorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    // Small delay to ensure all state updates are complete before validation
    await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
    
    // Validate form - this sets errors in state
    const isValid = validateForm();
    
    if (!isValid) {
      // Wait for state to update, then find first error field and scroll to it
      setTimeout(() => {
        const currentErrors = latestErrorsRef.current;
        const currentTractors = latestTractorsRef.current;
        
        // Find first error field
        let firstErrorField: string | null = null;
        let firstErrorY = 0;
        
        // Priority order for error fields
        const errorFieldOrder = [
          'profilePhoto',
          'category',
          'selectedSubQuestion',
          'firstName',
          'lastName',
          'countryCode',
          'phoneNumber',
          'dobDD',
          'domDD',
          'houseNumber',
          'streetName',
          'village',
          'district',
          'state',
          'pincode',
        ];
        
        // Check form errors in priority order
        for (const fieldName of errorFieldOrder) {
          if (currentErrors[fieldName as keyof FormErrors]) {
            firstErrorField = fieldName;
            firstErrorY = fieldPositions.current[fieldName] || 0;
            break;
          }
        }
        
        // If no form error, check tractor errors
        if (!firstErrorField) {
          const firstTractorError = currentTractors.find(t => 
            Object.values(t.errors).some(err => err)
          );
          if (firstTractorError) {
            const tractorErrorKeys = Object.keys(firstTractorError.errors).filter(
              key => firstTractorError.errors[key as keyof TractorDetails['errors']]
            );
            if (tractorErrorKeys.length > 0) {
              firstErrorField = `tractor_${firstTractorError.id}_${tractorErrorKeys[0]}`;
              firstErrorY = fieldPositions.current[firstErrorField] || 0;
            }
          }
        }
        
        // Scroll to first error field
        if (firstErrorField && firstErrorY > 0) {
          console.log(`Scrolling to error field: ${firstErrorField} at position: ${firstErrorY}`);
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, firstErrorY - 100), // Offset by 100px to show field clearly
            animated: true,
          });
        } else {
          // Fallback: scroll to top if field position not found
          console.log('Field position not found, scrolling to top');
          scrollViewRef.current?.scrollTo({y: 0, animated: true});
        }
      }, 300);
      return;
    }

    // Profile photo is now optional, so we don't require it
    try {
      setSubmitting(true);

      // Format questions array with all question details from API: { ...allQuestionDetails, answers: [{ id, answer_text }] }
      const questionArray = questions.map((question, index) => {
        const questionKey = `question_${question.id}_${index}`;
        const answer = subQuestionAnswers[questionKey];
        
        const answers: {id: number; answer_text: string}[] = [];
        
        if (answer !== undefined && answer !== null && answer !== '') {
          const questionType = question.question_type?.toLowerCase() || 'textbox';
          
          // Get options from answer_options or options
          const questionOptions = question.answer_options || question.options || [];
          
          // Handle file/document type separately - files are uploaded separately
          if ((questionType === 'file' || questionType === 'document') && Array.isArray(answer)) {
            // For file questions, the files will be uploaded separately with question_docs_{index} key
            // We still need to include a placeholder answer or the file count
            const fileCount = answer.filter((file: any) => file && file.uri && file.uri.trim() !== '').length;
            if (fileCount > 0) {
              answers.push({
                id: question.id || Date.now(),
                answer_text: `${fileCount} file(s) uploaded`,
              });
            }
          } else if (questionType === 'checkbox' && Array.isArray(answer)) {
            // For checkbox questions, each selected option becomes an answer
            answer.forEach((selectedOption: string) => {
              if (selectedOption && selectedOption.trim()) {
                // Find the answer option ID from question options
                const option = questionOptions.find((opt: any) => 
                  opt.option_text === selectedOption || 
                  opt.text === selectedOption ||
                  opt.value === selectedOption || 
                  opt === selectedOption
                );
                // Use option ID if available, otherwise use a generated ID
                const answerId = option?.id || 
                                option?.option_id || 
                                Date.now(); // Fallback to timestamp
                
                answers.push({
                  id: answerId,
                  answer_text: selectedOption,
                });
              }
            });
          } else if (questionType === 'radio' && typeof answer === 'string') {
            // For radio questions, single answer
            const option = questionOptions.find((opt: any) => 
              opt.option_text === answer || 
              opt.text === answer ||
              opt.value === answer || 
              opt === answer
            );
            const answerId = option?.id || 
                            option?.option_id || 
                            Date.now();
            
            answers.push({
              id: answerId,
              answer_text: answer,
            });
          } else if (questionType === 'dropdown' && typeof answer === 'string') {
            // For dropdown questions, similar to radio
            const option = questionOptions.find((opt: any) => 
              opt.option_text === answer || 
              opt.text === answer ||
              opt.value === answer || 
              opt === answer
            );
            const answerId = option?.id || 
                            option?.option_id || 
                            Date.now();
            
            answers.push({
              id: answerId,
              answer_text: answer,
            });
          } else {
            // For text questions, use the text as answer_text
            // For text inputs, we might not have answer option IDs, so use question ID or generate one
            const answerText = Array.isArray(answer) 
              ? answer.filter(item => item).join(', ')
              : String(answer).trim();
            
            if (answerText) {
              // For text questions, use question ID as answer ID or generate one
              answers.push({
                id: question.id || Date.now(),
                answer_text: answerText,
              });
            }
          }
        }
        
        // Return all question details from API along with answers
        return {
          ...question, // Include all question properties from API (id, question_text, question_type, answer_options, category_id, etc.)
          answers: answers,
        };
      });

      // Format tractor details
      // Use purchase date values for registration date fields
      const tractorDetailsArray = tractors.map(tractor => ({
        model_name: tractor.modelName,
        vehicle_number: tractor.vehicleNumber,
        chassis_number: tractor.chassisNumber,
        engine_number: tractor.engineNumber,
        invoice_day: tractor.purchaseDateDD,
        invoice_month: tractor.purchaseDateMM,
        invoice_year: tractor.purchaseDateYYYY,
        registration_day: tractor.purchaseDateDD, // Use purchase date for registration
        registration_month: tractor.purchaseDateMM, // Use purchase date for registration
        registration_year: tractor.purchaseDateYYYY, // Use purchase date for registration
        who_drives: tractor.whoFrom,
        owner_name: tractor.ownerName || '', // Ensure owner_name is always passed, use empty string if not provided
      }));

      // Get names from selected IDs
      const selectedState = states.find(s => s.value === stateId);
      const selectedDistrict = districts.find(d => d.value === districtId);
      const selectedVillage = villages.find(v => v.value === villageId);

      // Prepare the data object according to API structure
      const farmerData = {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        mobile_number: phoneNumber.replace(/\s/g, ''), // Remove spaces from phone number
        mobile_country_code: countryCode,
        dob_day: dobDD,
        dob_month: dobMM,
        dob_year: dobYYYY,
        dom_day: domDD,
        dom_month: domMM,
        dom_year: domYYYY,
        dealer_name: dealerName,
        category_id: category,
        Address: {
          house_number: houseNumber,
          street_name: streetName,
          landmark: landmark,
          village: selectedVillage?.label || villageId,
          district: selectedDistrict?.label || districtId,
          state: selectedState?.label || stateId,
          pincode: pincode,
        },
        question: questionArray,
        tractorDetails: tractorDetailsArray,
      };

      // Create FormData
      const formData = new FormData();
      
      // Add data as JSON string
      formData.append('data', JSON.stringify(farmerData));
      
      // Add profile photo (optional)
      if (profilePhoto) {
        const profileUriParts = profilePhoto.split('.');
        const profileFileExtension = profileUriParts.length > 1 ? profileUriParts[profileUriParts.length - 1].toLowerCase() : 'jpg';
        const profileMimeType = profileFileExtension === 'png' ? 'image/png' : 'image/jpeg';
        const profileFileName = `profile-photo-${Date.now()}.${profileFileExtension}`;
        
        formData.append('profile_photo', {
          uri: profilePhoto,
          type: profileMimeType,
          name: profileFileName,
        } as any);
      }

      // Helper function to append file (image) to FormData
      const appendFile = (key: string, fileUri: string, fileType: 'image', index?: number) => {
        console.log("file upload key and value:", key, fileUri, fileType, index);
        
        if (!fileUri || fileUri.trim() === '') return;
        
        const uriParts = fileUri.split('.');
        const fileExtension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
        
        let mimeType: string;
        mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
        
        const fileName = `${key}-${Date.now()}-${index || 0}.${fileExtension}`;
        
        formData.append(key, {
          uri: fileUri,
          type: mimeType,
          name: fileName,
        } as any);
      };

      // Add question document files with question_docs_{index} key
      questions.forEach((question, questionIndex) => {
        const questionKey = `question_${question.id}_${questionIndex}`;
        const answer = subQuestionAnswers[questionKey];
        const questionType = question.question_type?.toLowerCase() || 'textbox';
        
        // Handle file/document type questions
        if ((questionType === 'file' || questionType === 'document') && Array.isArray(answer)) {
          const validFiles = answer.filter((file: any) => file && file.uri && file.uri.trim() !== '');
          validFiles.forEach((file: any, fileIndex: number) => {
            const fileKey = `question_docs_${questionIndex}`;
            appendFile(fileKey, file.uri, file.type || 'image', fileIndex);
          });
        }
      });

      // Add tractor images and RC images with indexed naming
      tractors.forEach((tractor, tractorIndex) => {
        // Add tractor images (min 1, max 2)
        if (tractor.tractorImages && tractor.tractorImages.length > 0) {
          const validImages = tractor.tractorImages.filter(img => img && img.trim() !== '');
          validImages.forEach((imageUri, imageIndex) => {
            // When tractor count is 1 (tractorIndex = 0):
            //   First image: Tackertar_0
            //   Second image: Tackertar_0
            // When tractor count is 2 (tractorIndex = 1):
            //   First image: Tackertar_1
            //   Second image: Tackertar_2
            let imageKey = '';
            if (tractorIndex === 0) {
              // First tractor: both images use Tackertar_0
              imageKey = 'tractor_images_0';
            } else if (tractorIndex === 1) {
              // Second tractor: first image uses Tackertar_1, second uses Tackertar_2
              imageKey =  'tractor_images_1' ;
            } else {
              // Fallback for any additional tractors (shouldn't happen based on current logic)
              imageKey = `tractor_images_${tractorIndex}`;
            }
            appendFile(imageKey, imageUri, 'image', imageIndex);
          });
        }

        // Add RC front image
        if (tractor.rcFront && tractor.rcFront.trim() !== '') {
          appendFile(`tractor_rc_front_${tractorIndex}`, tractor.rcFront, 'image');
        }

        // Add RC back image
        if (tractor.rcBack && tractor.rcBack.trim() !== '') {
          appendFile(`tractor_rc_back_${tractorIndex}`, tractor.rcBack, 'image');
        }
      });

      console.log('Submitting farmer data:', JSON.stringify(farmerData, null, 2));
      console.log('Tractor details with owner names:', JSON.stringify(tractorDetailsArray.map(t => ({ model: t.model_name, owner_name: t.owner_name })), null, 2));
      console.log('Profile photo URI:', JSON.stringify(formData));

      // Add mode: Call add API
      const response = await postDataWithImage(Apis.DEALER_ADD_FARMER, formData);

      console.log('API Response:', JSON.stringify(response, null, 2));

      // Check if response exists and has status
      if (response && response.status === true) {
        // Show success toast
        const successMessage = response?.message || 'Sent for verification check notifications for update';
        showToastMessage(successMessage, 'success');
        
        // Navigate back after a short delay to allow toast to be visible
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        // Extract error message from various possible response structures
        let errorMessage = '';
        if (response) {
          // Try different possible response structures - prioritize message field
          errorMessage = response?.message || 
                        response?.data?.message || 
                        response?.error?.message ||
                        response?.error ||
                        (typeof response === 'string' ? response : '');
        }
        
        // Show error message from API response or fallback
        const finalErrorMessage = errorMessage || 'Failed to add farmer. Please try again.';
        console.log('Showing error toast with API message:', finalErrorMessage);
        showToastMessage(finalErrorMessage, 'error');
      }
    } catch (error: any) {
      console.error('Error submitting farmer:', error);
      
      // Extract error message from various possible error structures
      let errorMessage = '';
      if (error?.response?.data) {
        errorMessage = error.response.data.message || 
                      error.response.data.error?.message ||
                      error.response.data.error ||
                      '';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Show error message from API response or fallback
      const finalErrorMessage = errorMessage || 'Failed to add farmer. Please try again.';
      console.log('Showing error toast with API message:', finalErrorMessage);
      showToastMessage(finalErrorMessage, 'error');
    } finally {
      setSubmitting(false);
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
    ddRef?: any,
    mmRef?: any,
    yyyyRef?: any,
    dateType?: 'dob' | 'dom' | 'purchase' | 'registration',
    dateError?: string | undefined,
    setDateError?: (error: string | undefined) => void,
    required?: boolean,
  ) => {
    // Helper function to validate date whenever any part changes
    const validateDate = (day: string, month: string, year: string) => {
      // Only validate if we have all three parts
      if (!day || !month || !year || year.length < 4) {
        if (setDateError) {
          setDateError(undefined);
        }
        return;
      }
      
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(year, 10);
      
      if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
        return;
      }
      
      const currentDate = new Date();
      const currentDD = String(currentDate.getDate()).padStart(2, '0');
      const currentMM = String(currentDate.getMonth() + 1).padStart(2, '0');
      const currentYYYY = String(currentDate.getFullYear());
      
      // Validate month first
      if (monthNum < 1 || monthNum > 12) {
        if (setDateError) {
          setDateError('Invalid month. Please enter a value between 01 and 12');
        }
        return;
      }
      
      // Validate date format
      if (!isValidDate(day, month, year)) {
        if (setDateError) {
          setDateError('Invalid date. Please enter a valid date');
        }
        return;
      }
      
      // Date validation based on type
      if (dateType === 'dob') {
        // Birth date must be less than current date
        if (compareDates(day, month, year, currentDD, currentMM, currentYYYY) >= 0) {
          if (setDateError) {
            setDateError('Date of birth must be before today\'s date');
          }
        } else {
          if (setDateError) {
            setDateError(undefined);
          }
        }
      } else if (dateType === 'dom') {
        // Marriage date must be between birth date and current date
        if (dobDD && dobMM && dobYYYY) {
          if (compareDates(day, month, year, dobDD, dobMM, dobYYYY) < 0) {
            if (setDateError) {
              setDateError('Date of marriage must be after date of birth');
            }
          } else if (compareDates(day, month, year, currentDD, currentMM, currentYYYY) >= 0) {
            if (setDateError) {
              setDateError('Date of marriage must be before today\'s date');
            }
          } else {
            if (setDateError) {
              setDateError(undefined);
            }
          }
        } else {
          // If birth date not set yet, just check it's before current date
          if (compareDates(day, month, year, currentDD, currentMM, currentYYYY) >= 0) {
            if (setDateError) {
              setDateError('Date of marriage must be before today\'s date');
            }
          } else {
            if (setDateError) {
              setDateError(undefined);
            }
          }
        }
      } else if (dateType === 'purchase') {
        // Purchase date should be reasonable (not in future, not too old)
        if (compareDates(day, month, year, currentDD, currentMM, currentYYYY) > 0) {
          if (setDateError) {
            setDateError('Purchase date cannot be in the future');
          }
        } else {
          if (setDateError) {
            setDateError(undefined);
          }
        }
      } else if (dateType === 'registration') {
        // Registration date should be reasonable (not in future)
        if (compareDates(day, month, year, currentDD, currentMM, currentYYYY) > 0) {
          if (setDateError) {
            setDateError('Registration date cannot be in the future');
          }
        } else {
          if (setDateError) {
            setDateError(undefined);
          }
        }
      }
    };
    
    const handleDDChange = (text: string) => {
      // Only allow numbers
      const numericText = text.replace(/[^0-9]/g, '');
      setDD(numericText);
      
      // Auto-focus to MM when DD reaches maxLength
      if (numericText.length === 2 && mmRef?.current) {
        mmRef.current.focus();
      }
      
      // Re-validate date if MM and YYYY are already filled
      if (mm && mm.length === 2 && yyyy && yyyy.length === 4) {
        // Use the new DD value directly for validation
        validateDate(numericText, mm, yyyy);
      } else {
        // Clear error if date is incomplete
        if (setDateError) {
          setDateError(undefined);
        }
      }
    };
    
    const handleMMChange = (text: string) => {
      // Only allow numbers
      const numericText = text.replace(/[^0-9]/g, '');
      setMM(numericText);
      
      // Validate month (1-12) immediately
      if (numericText.length === 2) {
        const month = parseInt(numericText, 10);
        if (month < 1 || month > 12) {
          if (setDateError) {
            setDateError('Invalid month. Please enter a value between 01 and 12');
          }
        } else {
          // Auto-focus to YYYY when MM reaches maxLength
          if (yyyyRef?.current) {
            yyyyRef.current.focus();
          }
        }
      }
      
      // Re-validate date if DD and YYYY are already filled
      if (dd && dd.length === 2 && yyyy && yyyy.length === 4) {
        // Use the new MM value directly for validation
        validateDate(dd, numericText, yyyy);
      } else if (numericText.length < 2) {
        // Clear error if month is incomplete
        if (setDateError) {
          setDateError(undefined);
        }
      }
    };
    
    const handleYYYYChange = (text: string) => {
      // Only allow numbers
      const numericText = text.replace(/[^0-9]/g, '');
      setYYYY(numericText);
      
      // Clear error when user is still typing (less than 4 digits)
      if (numericText.length < 4) {
        if (setDateError) {
          setDateError(undefined);
        }
        return;
      }
      
      // Validate and check date constraints when YYYY is complete
      if (numericText.length === 4 && dd && mm) {
        // Use setTimeout to ensure state is updated
        setTimeout(() => {
          validateDate(dd, mm, numericText);
        }, 0);
      }
    };
    
    return (
      <View>
        <View style={styles.dateRow}>
          <View style={styles.dateInput}>
            <SimpleBoxInput
              ref={ddRef}
              label={label1}
              value={dd}
              onChangeText={handleDDChange}
              placeholder={t('addFarmer.dd')}
              keyboardType="numeric"
              maxLength={2}
              error={error ? '' : undefined}
              numberOfLinesLabel={1}
              returnKeyType="next"
              onSubmitEditing={() => mmRef?.current?.focus()}
              required={required}
            />
          </View>
          <View style={styles.dateInput}>
            <SimpleBoxInput
              ref={mmRef}
              label={label2}
              value={mm}
              onChangeText={handleMMChange}
              placeholder={t('addFarmer.mm')}
              keyboardType="numeric"
              maxLength={2}
              numberOfLinesLabel={1}
              returnKeyType="next"
              onSubmitEditing={() => yyyyRef?.current?.focus()}
            />
          </View>
          <View style={styles.dateInput}>
            <SimpleBoxInput
              ref={yyyyRef}
              label={label3}
              value={yyyy}
              onChangeText={handleYYYYChange}
              placeholder={t('addFarmer.yyyy')}
              keyboardType="numeric"
              maxLength={4}
              numberOfLinesLabel={1}
              returnKeyType="done"
            />
          </View>
        </View>
        {(error || dateError) && (
          <Text style={styles.errorText}>{error || dateError}</Text>
        )}
      </View>
    );
  };

  const renderImageUpload = (
    label: string,
    imageUri: string | undefined,
    onPress: () => void,
    fullWidth?: boolean,
    onImagePress?: () => void, // Callback when clicking on uploaded image
  ) => (
    <TouchableOpacity
      style={fullWidth ? styles.imageUploadItemFullWidth : styles.imageUploadItem}
      onPress={imageUri && onImagePress ? onImagePress : onPress}
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
        <Text style={styles.headerTitle}>
          {isRejectedUpdate ? 'Update rejected farmer' : isEditMode ? 'Edit farmer' : 'Add new farmer'}
        </Text>
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
            <Text style={styles.sectionTitle}>{t('addFarmer.personalDetails')}</Text>

            {/* Profile Photo - Hidden in edit mode (from farmer list), but shown in rejected update */}
            {!isEditMode && !isRejectedUpdate && (
              <>
                <View 
                  style={styles.profilePhotoContainer}
                  onLayout={registerFieldPosition('profilePhoto')}
                >
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
                    <Text style={styles.uploadText}>{t('addFarmer.uploadProfilePhoto')}</Text>
                  </TouchableOpacity>
                </View>
                {errors.profilePhoto && (
                  <Text style={styles.errorText}>{errors.profilePhoto}</Text>
                )}
              </>
            )}

            {/* Dealer Name */}
            <SimpleBoxInput
                label={t('addFarmer.dealerName')}
              value={dealerNameLoading ? 'Loading...' : dealerName || ''}
              onChangeText={() => {}}
              editable={false}
              numberOfLinesLabel={1}
            />

            {/* Category Dropdown - Hidden in edit mode (from farmer list), but shown in rejected update */}
            {!isEditMode && !isRejectedUpdate && (
              <View onLayout={registerFieldPosition('category')}>
                <Dropdown
                  label={t('addFarmer.selectCategory')}
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
                  placeholder={categoriesLoading ? t('addFarmer.loadingCategories') : t('addFarmer.selectCategory')}
                  error={errors.category}
                  required={true}
                />
                {categoriesLoading && (
                  <View style={{marginTop: moderateScale(8), alignItems: 'center'}}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                )}
              </View>
            )}

            {/* Dynamic Sub-questions from API - Hidden in edit mode (from farmer list), but shown in rejected update */}
            {(!isEditMode || isRejectedUpdate) && (
            <>
              {questionsLoading && (
                <View style={{marginVertical: moderateScale(20), alignItems: 'center'}}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{marginTop: moderateScale(8), fontSize: moderateScale(12), color: colors.textTertiary}}>
                    Loading questions...
                  </Text>
                </View>
              )}
              
              {category && !questionsLoading && questions.length > 0 && questions.map((question, index) => {
              const questionKey = `question_${question.id}_${index}`;
              const currentAnswer = subQuestionAnswers[questionKey];

              const handleAnswerChange = (value: any) => {
                console.log(`[Answer Changed] Question Key: ${questionKey}, Question ID: ${question.id}, Value:`, value, 'Type:', typeof value);
                setSubQuestionAnswers(prev => {
                  const updated = {
                    ...prev,
                    [questionKey]: value,
                  };
                  // Update ref immediately for validation
                  latestSubQuestionAnswersRef.current = updated;
                  console.log(`[Answer Stored] Updated subQuestionAnswers:`, updated);
                  return updated;
                });
                setErrors({ ...errors, selectedSubQuestion: undefined });
              };

              // Map API question_type to component type
              const questionType = question.question_type?.toLowerCase() || 'textbox';
              
              switch (questionType) {
                case 'textbox':
                case 'text':
                  return (
                    <View 
                      key={questionKey}
                      onLayout={index === 0 ? registerFieldPosition('selectedSubQuestion') : undefined}
                    >
                      <TextInputQuestion
                        question={question.question_text || ''}
                        value={
                          typeof currentAnswer === 'string' ? currentAnswer : ''
                        }
                        onChangeText={handleAnswerChange}
                        placeholder={t('addFarmer.yourAnswerHere')}
                        error={
                          errors.selectedSubQuestion && index === 0
                            ? errors.selectedSubQuestion
                            : undefined
                        }
                        required={true}
                        editable={true}
                      />
                    </View>
                  );

                case 'radio':
                  // Get options from question.answer_options or question.options
                  const radioOptions = question.answer_options?.map((opt: any) => 
                    opt.option_text || opt.text || opt.value || opt
                  ) || question.options?.map((opt: any) => 
                    opt.option_text || opt.text || opt.value || opt
                  ) || ['Yes', 'No'];
                  
                  return (
                    <RadioButtonQuestion
                      key={questionKey}
                      question={question.question_text || ''}
                      value={
                        typeof currentAnswer === 'string'
                          ? currentAnswer
                          : null
                      }
                      onChange={handleAnswerChange}
                      options={radioOptions}
                      error={
                        errors.selectedSubQuestion && index === 0
                          ? errors.selectedSubQuestion
                          : undefined
                      }
                      required={true}
                      disabled={false}
                    />
                  );

                case 'checkbox':
                  // Get options from question.answer_options or question.options
                  const checkboxOptions = question.answer_options?.map((opt: any) => 
                    opt.option_text || opt.text || opt.value || opt
                  ) || question.options?.map((opt: any) => 
                    opt.option_text || opt.text || opt.value || opt
                  ) || ['Option 1', 'Option 2', 'Option 3'];
                  
                  return (
                    <CheckboxQuestion
                      key={questionKey}
                      question={question.question_text || ''}
                      selectedValues={
                        Array.isArray(currentAnswer) ? currentAnswer : []
                      }
                      onChange={handleAnswerChange}
                      options={checkboxOptions}
                      error={
                        errors.selectedSubQuestion && index === 0
                          ? errors.selectedSubQuestion
                          : undefined
                      }
                      required={true}
                      disabled={false}
                    />
                  );

                case 'file':
                case 'document':
                  // Determine max documents (from API or default to 5)
                  const maxDocs = question?.max_documents > 0 ? question.max_documents : 5;
                  
                  // Convert currentAnswer to FileItem array format
                  let currentFiles: Array<{uri: string; type: 'image'; name: string}> = [];
                  if (currentAnswer) {
                    if (Array.isArray(currentAnswer)) {
                      currentFiles = currentAnswer;
                    } else if (typeof currentAnswer === 'string') {
                      // Legacy format: single file URI string
                      const fileName = currentAnswer.split('/').pop() || 'file';
                      currentFiles = [{
                        uri: currentAnswer,
                        type: 'image',
                        name: fileName,
                      }];
                    }
                  }
                  
                  return (
                    <FileUploadQuestion
                      key={questionKey}
                      question={(question.question_text || '') + (maxDocs > 0 ? ` (maximum ${maxDocs} upload)` : '')}
                      onUpload={(files: Array<{uri: string; type: 'image'; name: string}>) => {
                        handleAnswerChange(files);
                      }}
                      uploadedFiles={currentFiles}
                      error={
                        errors.selectedSubQuestion && index === 0
                          ? errors.selectedSubQuestion
                          : undefined
                      }
                      required={true}
                      maxDocuments={maxDocs}
                      onError={(message) => showToastMessage(message)}
                    />
                  );

                case 'dropdown':
                  // Get options from question.answer_options or question.options
                  const dropdownOptions = question.answer_options?.map((opt: any) => ({
                    label: opt.option_text || opt.text || opt.value || opt,
                    value: opt.option_text || opt.text || opt.value || opt,
                  })) || question.options?.map((opt: any) => ({
                    label: opt.option_text || opt.text || opt.value || opt,
                    value: opt.option_text || opt.text || opt.value || opt,
                  })) || [];
                  
                  return (
                    <DropdownQuestion
                      key={questionKey}
                      question={question.question_text || ''}
                      label="Select option"
                      value={
                        typeof currentAnswer === 'string' ? currentAnswer : ''
                      }
                      options={dropdownOptions}
                      onSelect={handleAnswerChange}
                      placeholder="Select option"
                      error={
                        errors.selectedSubQuestion && index === 0
                          ? errors.selectedSubQuestion
                          : undefined
                      }
                      required={true}
                    />
                  );

                default:
                  return (
                    <TextInputQuestion
                      key={questionKey}
                      question={question.question_text || ''}
                      value={
                        typeof currentAnswer === 'string' ? currentAnswer : ''
                      }
                      onChangeText={handleAnswerChange}
                      placeholder="Your answer here"
                      error={
                        errors.selectedSubQuestion && index === 0
                          ? errors.selectedSubQuestion
                          : undefined
                      }
                      required={true}
                    />
                  );
              }
            })}

              {category && !questionsLoading && questions.length === 0 && (
                <View style={{marginVertical: moderateScale(20), alignItems: 'center'}}>
                  <Text style={{fontSize: moderateScale(14), color: colors.textTertiary}}>
                    No questions available for this category.
                  </Text>
                </View>
              )}
            </>
            )}

            {/* Personal Info Fields */}
            <View onLayout={registerFieldPosition('firstName')}>
              <SimpleBoxInput
                label={t('addFarmer.firstName')}
                value={firstName}
                onChangeText={text => {
                  setFirstName(text);
                  setErrors({ ...errors, firstName: undefined });
                }}
                placeholder={t('addFarmer.enterFirstName')}
                error={errors.firstName}
                numberOfLinesLabel={1}
                required={true}
              />
            </View>
            <SimpleBoxInput
              label={t('addFarmer.middleName')}
              value={middleName}
              onChangeText={setMiddleName}
              placeholder={t('addFarmer.enterMiddleName')}
              numberOfLinesLabel={1}
            />
            <View onLayout={registerFieldPosition('lastName')}>
              <SimpleBoxInput
                label={t('addFarmer.lastName')}
                value={lastName}
                onChangeText={text => {
                  setLastName(text);
                  setErrors({ ...errors, lastName: undefined });
                }}
                placeholder={t('addFarmer.enterLastName')}
                error={errors.lastName}
                numberOfLinesLabel={1}
                required={true}
              />
            </View>
            {/* Phone Number with Country Code */}
            <View style={styles.phoneRow}>
              <View 
                style={styles.phoneCodeInput}
                onLayout={registerFieldPosition('countryCode')}
              >
                <SimpleBoxInput
                  label={t('addFarmer.phoneCode')}
                  value={countryCode}
                  onChangeText={text => {
                    setCountryCode(text);
                    setErrors({ ...errors, countryCode: undefined });
                  }}
                  placeholder="+91"
                  keyboardType="phone-pad"
                  error={errors.countryCode}
                  numberOfLinesLabel={1}
                  required={true}
                />
              </View>
              <View 
                style={styles.phoneNumberInput}
                onLayout={registerFieldPosition('phoneNumber')}
              >
                <SimpleBoxInput
                  label={t('addFarmer.phoneNumber')}
                  value={phoneNumber}
                  onChangeText={text => {
                    setPhoneNumber(text);
                    setErrors({ ...errors, phoneNumber: undefined });
                  }}
                  placeholder={t('addFarmer.phonePlaceholder')}
                  keyboardType="phone-pad"
                  error={errors.phoneNumber}
                  numberOfLinesLabel={1}
                  maxLength={10}
                  required={true}
                />
              </View>
            </View>
            <View onLayout={registerFieldPosition('dobDD')}>
              {renderDateInputs(
                t('reviewProfile.date'),
                t('reviewProfile.of'),
                t('reviewProfile.birth'),
                dobDD,
                dobMM,
                dobYYYY,
                text => {
                  setDobDD(text);
                  setErrors({ ...errors, dobDD: undefined });
                },
                text => {
                  setDobMM(text);
                  setErrors({ ...errors, dobDD: undefined });
                },
                text => {
                  setDobYYYY(text);
                  setErrors({ ...errors, dobDD: undefined });
                },
                errors.dobDD,
                dobDDRef,
                dobMMRef,
                dobYYYYRef,
                'dob',
                dobDateError,
                setDobDateError,
                true, // required
              )}
            </View>
            <View onLayout={registerFieldPosition('domDD')}>
              {renderDateInputs(
                t('reviewProfile.date'),
                t('reviewProfile.of'),
                t('reviewProfile.marriage'),
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
                domDDRef,
                domMMRef,
                domYYYYRef,
                'dom',
                domDateError,
                setDomDateError,
                true, // required
              )}
            </View>
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
            <Text style={styles.sectionTitle}>{t('addFarmer.address')}</Text>
            <View onLayout={registerFieldPosition('houseNumber')}>
              <SimpleBoxInput
                label={t('addFarmer.houseNumber')}
                value={houseNumber}
                onChangeText={text => {
                  setHouseNumber(text);
                  setErrors({ ...errors, houseNumber: undefined });
                }}
                placeholder={t('addFarmer.enterHouseNumber')}
                error={errors.houseNumber}
                numberOfLinesLabel={1}
                required={true}
              />
            </View>
            <View onLayout={registerFieldPosition('streetName')}>
              <SimpleBoxInput
                label={t('addFarmer.streetName')}
                value={streetName}
                onChangeText={text => {
                  setStreetName(text);
                  setErrors({ ...errors, streetName: undefined });
                }}
                placeholder={t('addFarmer.enterStreetName')}
                error={errors.streetName}
                numberOfLinesLabel={1}
                required={true}
              />
            </View>
            <SimpleBoxInput
              label={t('addFarmer.landmark')}
              value={landmark}
              onChangeText={setLandmark}
              placeholder={t('addFarmer.enterLandmark')}
              numberOfLinesLabel={1}
            />
            <View onLayout={registerFieldPosition('state')}>
              <SearchableDropdown
                label={t('addFarmer.state')}
                value={stateId}
                options={states}
                onSelect={(value) => {
                  setStateId(value);
                  setErrors({ ...errors, state: undefined });
                }}
                placeholder={t('addFarmer.selectState')}
                error={errors.state}
                loading={statesLoading}
                required={true}
              />
            </View>
            <View onLayout={registerFieldPosition('district')}>
              <SearchableDropdown
                label={t('addFarmer.district')}
                value={districtId}
                options={districts}
                onSelect={(value) => {
                  setDistrictId(value);
                  setErrors({ ...errors, district: undefined });
                }}
                placeholder={stateId ? t('addFarmer.selectDistrict') : t('addFarmer.selectStateFirst')}
                error={errors.district}
                loading={districtsLoading}
                required={true}
              />
            </View>
            <View onLayout={registerFieldPosition('village')}>
              <SearchableDropdown
                label={t('addFarmer.village')}
                value={villageId}
                options={villages}
                onSelect={(value) => {
                  setVillageId(value);
                  setErrors({ ...errors, village: undefined });
                }}
                placeholder={districtId ? t('addFarmer.selectVillage') : t('addFarmer.selectDistrictFirst')}
                error={errors.village}
                loading={villagesLoading}
                required={true}
              />
            </View>
            <View onLayout={registerFieldPosition('pincode')}>
              <SimpleBoxInput
                label={t('addFarmer.pincode')}
                value={pincode}
                onChangeText={text => {
                  setPincode(text);
                  setErrors({ ...errors, pincode: undefined });
                }}
                placeholder={t('addFarmer.enterPincode')}
                keyboardType="numeric"
                maxLength={6}
                error={errors.pincode}
                numberOfLinesLabel={1}
                required={true}
              />
            </View>
          </View>

          {/* Tractor Details Section - Hidden in edit mode (from farmer list), but shown in rejected update */}
          {(!isEditMode || isRejectedUpdate) && tractors.map((tractor, index) => (
            <View key={tractor.id} style={styles.section}>
              <View style={styles.tractorHeader}>
                <Text style={styles.tractorCountText}>
                  {t('addFarmer.tractorCount')} {index + 1}
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
              <View 
                style={styles.tractorImagesContainer}
                onLayout={registerFieldPosition(`tractor_${tractor.id}_tractorImages`)}
              >
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
                          t('addFarmer.uploadTractorImage'),
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
                            t('addFarmer.uploadTractorImage'),
                            hasFirstImage ? firstImage : undefined,
                            () => {
                              ensureFirstTractorImageSlot(tractor.id);
                              handleImagePicker('tractor', tractor.id, 0);
                            },
                            false,
                            hasFirstImage ? () => handleImagePreview(tractor.id, 'tractor', firstImage, 0) : undefined,
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
                              t('addFarmer.uploadTractorImage'),
                              hasSecondImage ? secondImage : undefined,
                              () => handleImagePicker('tractor', tractor.id, 1),
                              false,
                              hasSecondImage ? () => handleImagePreview(tractor.id, 'tractor', secondImage, 1) : undefined,
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
                            onPress={() => {
                              // Ensure second slot exists, then open picker
                              const currentImages = tractor.tractorImages || [];
                              if (currentImages.length < 2) {
                                // Add slot and open picker
                                addTractorImage(tractor.id);
                              } else {
                                // If slot exists but empty, just open picker
                                handleImagePicker('tractor', tractor.id, 1);
                              }
                            }}
                            activeOpacity={0.7}>
                            <Ionicons
                              name="add"
                              size={moderateScale(24)}
                              color={colors.textTertiary}
                            />
                            <Text style={styles.uploadLabel}>{t('addFarmer.uploadSecondImage')}</Text>
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
                {/* RC Front Image with OCR Loading Overlay */}
                <View style={{flex: 1, marginRight: moderateScale(8)}}>
                  {renderImageUpload(
                    t('addFarmer.uploadRcFront'),
                    tractor.rcFront,
                    () => handleImagePicker('rcFront', tractor.id),
                    false,
                    tractor.rcFront ? () => handleImagePreview(tractor.id, 'rcFront', tractor.rcFront!) : undefined,
                  )}
                  {/* OCR Loading Overlay */}
                  {ocrProcessingTractorId === tractor.id && tractor.rcFront && (
                    <View
                      style={[
                        styles.imageUploadBox,
                        {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          zIndex: 10,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}>
                      <ActivityIndicator size="small" color={colors.textWhite} />
                      <Text
                        style={[
                          Typography.regularSm,
                          {
                            color: colors.textWhite,
                            marginTop: moderateScale(8),
                            fontSize: moderateScale(12),
                            textAlign: 'center',
                          },
                        ]}>
                        Processing...
                      </Text>
                    </View>
                  )}
                </View>
                {/* RC Back Image with OCR Loading Overlay */}
                <View style={{flex: 1, marginLeft: moderateScale(8)}}>
                  {renderImageUpload(
                    t('addFarmer.uploadRcBack'),
                    tractor.rcBack,
                    () => handleImagePicker('rcBack', tractor.id),
                    false,
                    tractor.rcBack ? () => handleImagePreview(tractor.id, 'rcBack', tractor.rcBack!) : undefined,
                  )}
                  {/* OCR Loading Overlay */}
                  {ocrProcessingTractorId === tractor.id && tractor.rcBack && (
                    <View
                      style={[
                        styles.imageUploadBox,
                        {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          zIndex: 10,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}>
                      <ActivityIndicator size="small" color={colors.textWhite} />
                      <Text
                        style={[
                          Typography.regularSm,
                          {
                            color: colors.textWhite,
                            marginTop: moderateScale(8),
                            fontSize: moderateScale(12),
                            textAlign: 'center',
                          },
                        ]}>
                        Processing...
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {/* RC Image Error Messages */}
              {(tractor.errors.rcFront || tractor.errors.rcBack) && (
                <View style={{flexDirection: 'row', marginTop: moderateScale(-8), marginBottom: moderateScale(8)}}>
                  <View style={{flex: 1}}>
                    {tractor.errors.rcFront && (
                      <Text style={styles.errorText}>{tractor.errors.rcFront}</Text>
                    )}
                  </View>
                  <View style={{flex: 1}}>
                    {tractor.errors.rcBack && (
                      <Text style={styles.errorText}>{tractor.errors.rcBack}</Text>
                    )}
                  </View>
                </View>
              )}
              {/* Extract from RC Button - Show when at least one RC image uploaded and not currently processing */}
              {((tractor.rcFront && tractor.rcFront.trim()) || (tractor.rcBack && tractor.rcBack.trim())) &&
                ocrProcessingTractorId !== tractor.id && (
                  <TouchableOpacity
                    style={[
                      styles.addNewButton,
                      {
                        backgroundColor: colors.primary + '20',
                        paddingVertical: moderateScale(12),
                        paddingHorizontal: moderateScale(16),
                        borderRadius: moderateScale(8),
                        marginTop: moderateScale(8),
                        alignSelf: 'center',
                      },
                    ]}
                    onPress={() => processRCImagesForOCR(tractor.id)}
                    activeOpacity={0.7}
                    disabled={ocrProcessingTractorId !== null}>
                    <Ionicons
                      name="scan-outline"
                      size={moderateScale(20)}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.addNewText,
                        {
                          marginLeft: moderateScale(8),
                        },
                      ]}>
                      Extract Data from RC Book
                    </Text>
                  </TouchableOpacity>
                )}
              {/* OCR Processing Indicator */}
              {ocrProcessingTractorId === tractor.id && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: moderateScale(12),
                    paddingVertical: moderateScale(8),
                    backgroundColor: colors.primary + '15',
                    borderRadius: moderateScale(8),
                  }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text
                    style={[
                      Typography.regularMd,
                      {
                        fontSize: moderateScale(14),
                        color: colors.primary,
                        marginLeft: moderateScale(8),
                      },
                    ]}>
                    Extracting data from RC Book...
                  </Text>
                </View>
              )}

              {/* Tractor Fields */}
              <View onLayout={registerFieldPosition(`tractor_${tractor.id}_modelName`)}>
                <SimpleBoxInput
                  label={t('addFarmer.modelName')}
                  value={tractor.modelName}
                  onChangeText={text =>
                    updateTractorField(tractor.id, 'modelName', text)
                  }
                  placeholder={t('addFarmer.enterModelName')}
                  error={tractor.errors.modelName}
                  numberOfLinesLabel={1}
                  required={true}
                />
                {/* Auto-fill indicator */}
                {ocrExtractedData[tractor.id]?.modelNumber &&
                  tractor.modelName === ocrExtractedData[tractor.id].modelNumber && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: moderateScale(-4),
                        marginBottom: moderateScale(4),
                      }}>
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(14)}
                        color={colors.statusSuccess}
                      />
                      <Text
                        style={[
                          Typography.regularSm,
                          {
                            fontSize: moderateScale(11),
                            color: colors.statusSuccess,
                            marginLeft: moderateScale(4),
                          },
                        ]}>
                        Auto-filled from RC Book
                      </Text>
                    </View>
                  )}
              </View>
              <View onLayout={registerFieldPosition(`tractor_${tractor.id}_vehicleNumber`)}>
                <SimpleBoxInput
                  label={t('addFarmer.vehicleNumber')}
                  value={tractor.vehicleNumber}
                  onChangeText={text =>
                    updateTractorField(tractor.id, 'vehicleNumber', text)
                  }
                  placeholder={t('addFarmer.enterVehicleNumber')}
                  error={tractor.errors.vehicleNumber}
                  numberOfLinesLabel={1}
                  required={true}
                />
                {/* Auto-fill indicator */}
                {ocrExtractedData[tractor.id]?.vehicleNumber &&
                  tractor.vehicleNumber === ocrExtractedData[tractor.id].vehicleNumber && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: moderateScale(-4),
                        marginBottom: moderateScale(4),
                      }}>
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(14)}
                        color={colors.statusSuccess}
                      />
                      <Text
                        style={[
                          Typography.regularSm,
                          {
                            fontSize: moderateScale(11),
                            color: colors.statusSuccess,
                            marginLeft: moderateScale(4),
                          },
                        ]}>
                        Auto-filled from RC Book
                      </Text>
                    </View>
                  )}
              </View>
              <View onLayout={registerFieldPosition(`tractor_${tractor.id}_ownerName`)}>
                <SimpleBoxInput
                  label={t('addFarmer.ownerName')}
                  value={tractor.ownerName}
                  onChangeText={text =>
                    updateTractorField(tractor.id, 'ownerName', text)
                  }
                  placeholder={t('addFarmer.enterOwnerName')}
                  error={tractor.errors.ownerName}
                  numberOfLinesLabel={1}
                  required={true}
                />
                {/* Auto-fill indicator */}
                {ocrExtractedData[tractor.id]?.ownerName &&
                  tractor.ownerName === ocrExtractedData[tractor.id].ownerName && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: moderateScale(-4),
                        marginBottom: moderateScale(4),
                      }}>
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(14)}
                        color={colors.statusSuccess}
                      />
                      <Text
                        style={[
                          Typography.regularSm,
                          {
                            fontSize: moderateScale(11),
                            color: colors.statusSuccess,
                            marginLeft: moderateScale(4),
                          },
                        ]}>
                        Auto-filled from RC Book
                      </Text>
                    </View>
                  )}
              </View>
              <View onLayout={registerFieldPosition(`tractor_${tractor.id}_chassisNumber`)}>
                <SimpleBoxInput
                  label={t('addFarmer.chassisNumber')}
                  value={tractor.chassisNumber}
                  onChangeText={text =>
                    updateTractorField(tractor.id, 'chassisNumber', text)
                  }
                  placeholder={t('addFarmer.enterChassisNumber')}
                  error={tractor.errors.chassisNumber}
                  numberOfLinesLabel={1}
                  required={true}
                />
                {/* Auto-fill indicator */}
                {ocrExtractedData[tractor.id]?.chassisNumber &&
                  tractor.chassisNumber === ocrExtractedData[tractor.id].chassisNumber && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: moderateScale(-4),
                        marginBottom: moderateScale(4),
                      }}>
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(14)}
                        color={colors.statusSuccess}
                      />
                      <Text
                        style={[
                          Typography.regularSm,
                          {
                            fontSize: moderateScale(11),
                            color: colors.statusSuccess,
                            marginLeft: moderateScale(4),
                          },
                        ]}>
                        Auto-filled from RC Book
                      </Text>
                    </View>
                  )}
              </View>
              <View onLayout={registerFieldPosition(`tractor_${tractor.id}_engineNumber`)}>
                <SimpleBoxInput
                  label={t('addFarmer.engineNumber')}
                  value={tractor.engineNumber}
                  onChangeText={text =>
                    updateTractorField(tractor.id, 'engineNumber', text)
                  }
                  placeholder={t('addFarmer.enterEngineNumber')}
                  error={tractor.errors.engineNumber}
                  numberOfLinesLabel={1}
                  required={true}
                />
                {/* Auto-fill indicator */}
                {ocrExtractedData[tractor.id]?.engineNumber &&
                  tractor.engineNumber === ocrExtractedData[tractor.id].engineNumber && (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: moderateScale(-4),
                        marginBottom: moderateScale(4),
                      }}>
                      <Ionicons
                        name="checkmark-circle"
                        size={moderateScale(14)}
                        color={colors.statusSuccess}
                      />
                      <Text
                        style={[
                          Typography.regularSm,
                          {
                            fontSize: moderateScale(11),
                            color: colors.statusSuccess,
                            marginLeft: moderateScale(4),
                          },
                        ]}>
                        Auto-filled from RC Book
                      </Text>
                    </View>
                  )}
              </View>
              <View onLayout={registerFieldPosition(`tractor_${tractor.id}_purchaseDateDD`)}>
                {(() => {
                  // Initialize refs for this tractor if not exists
                  if (!purchaseDateRefs.current[tractor.id]) {
                    purchaseDateRefs.current[tractor.id] = {
                      dd: { current: null },
                      mm: { current: null },
                      yyyy: { current: null },
                    };
                  }
                  const refs = purchaseDateRefs.current[tractor.id];
                  
                  return renderDateInputs(
                    t('reviewProfile.date'),
                    t('reviewProfile.of'),
                    t('addFarmer.purchaseDate'),
                    tractor.purchaseDateDD,
                    tractor.purchaseDateMM,
                    tractor.purchaseDateYYYY,
                    text => updateTractorField(tractor.id, 'purchaseDateDD', text),
                    text => updateTractorField(tractor.id, 'purchaseDateMM', text),
                    text => updateTractorField(tractor.id, 'purchaseDateYYYY', text),
                    tractor.errors.purchaseDateDD,
                    refs.dd,
                    refs.mm,
                    refs.yyyy,
                    'purchase',
                    tractor.errors.purchaseDateError,
                    (error) => updateTractorDateError(tractor.id, error),
                    true, // required
                  );
                })()}
                {/* Auto-fill indicator for Registration Date (Purchase Date) */}
                {ocrExtractedData[tractor.id]?.registrationDate &&
                  tractor.purchaseDateDD &&
                  tractor.purchaseDateMM &&
                  tractor.purchaseDateYYYY && (
                    // Check if the current date matches the extracted date
                    (() => {
                      const extractedDate = ocrExtractedData[tractor.id].registrationDate;
                      const dateMatch = extractedDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                      if (dateMatch && dateMatch.length >= 4) {
                        const day = dateMatch[1].padStart(2, '0');
                        const month = dateMatch[2].padStart(2, '0');
                        const year = dateMatch[3];
                        const isMatching =
                          tractor.purchaseDateDD === day &&
                          tractor.purchaseDateMM === month &&
                          tractor.purchaseDateYYYY === year;
                        if (isMatching) {
                          return (
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: moderateScale(-4),
                                marginBottom: moderateScale(4),
                              }}>
                              <Ionicons
                                name="checkmark-circle"
                                size={moderateScale(14)}
                                color={colors.statusSuccess}
                              />
                              <Text
                                style={[
                                  Typography.regularSm,
                                  {
                                    fontSize: moderateScale(11),
                                    color: colors.statusSuccess,
                                    marginLeft: moderateScale(4),
                                  },
                                ]}>
                                Auto-filled from RC Book
                              </Text>
                            </View>
                          );
                        }
                      }
                      return null;
                    })()
                  )}
              </View>
              <View onLayout={registerFieldPosition(`tractor_${tractor.id}_whoFrom`)}>
                <SimpleBoxInput
                  label={t('addFarmer.whoDrives')}
                  value={tractor.whoFrom}
                  onChangeText={text =>
                    updateTractorField(tractor.id, 'whoFrom', text)
                  }
                  placeholder={t('addFarmer.whoDrivesPlaceholder')}
                  error={tractor.errors.whoFrom}
                  numberOfLinesLabel={1}
                  required={true}
                />
              </View>
              {/* Add New Tractor Button - Only show on last tractor */}
              {index === tractors.length - 1 && (
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
                  <Text style={styles.addNewText}>{t('addFarmer.addNewTractor')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          )}
        </ScrollView>
        {/* Submit Button */}
        <View style={{padding:moderateScale(14)}}>
          <Button
            title={
              isRejectedUpdate 
                ? 'Update rejected form' 
                : isEditMode 
                  ? 'Update for verification' 
                  : t('addFarmer.sendForVerification')
            }
            onPress={
              isRejectedUpdate 
                ? handleRejectedUpdate 
                : isEditMode 
                  ? handleUpdateFarmer 
                  : handleSubmit
            }
            loading={submitting}
            disabled={submitting}
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

      {/* Image Preview Modal */}
      {previewImageInfo && (
        <ImagePreviewModal
          visible={previewModalVisible}
          images={[
            {
              id: previewImageInfo.imageIndex !== undefined
                ? `${previewImageInfo.tractorId}-${previewImageInfo.imageIndex}`
                : previewImageInfo.tractorId,
              uri: previewImageInfo.imageUri,
              placeholder: 'Image preview',
            },
          ]}
          initialIndex={0}
          onClose={() => setPreviewModalVisible(false)}
          onReplaceImage={handleReplaceImage}
        />
      )}

      {/* Toast Notification */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        duration={3000}
        onClose={hideToast}
      />
    </View>
  );
}
