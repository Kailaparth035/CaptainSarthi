import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthToken } from '../Service/Apicom';

const SESSION_KEY = '@user_session';
const USER_DATA_KEY = '@user_data';
const USER_ROLE_KEY = '@user_role';
const PROFILE_COMPLETED_KEY = '@profile_completed';
const PROFILE_REVIEWED_KEY = '@profile_reviewed';
const TERMS_ACCEPTED_KEY = '@terms_accepted';
const LANGUAGE_SELECTED_KEY = '@language_selected';
const ONBOARDING_SHOWN_KEY = '@onboarding_shown';
const FARMER_PROFILE_DATA_KEY = '@farmer_profile_data';
const PENDING_NAVIGATION_KEY = '@pending_navigation';

export interface UserSession {
  isLoggedIn: boolean;
  timestamp: number;
  mobileNumber?: string;
}

export interface DealerData {
  id: number;
  dealer_id: string;
  name: string;
  email: string;
  phone: string;
}

export interface FarmerData {
  id: number;
  farmer_id?: string;
  name: string;
  email?: string;
  phone: string;
  // Add other farmer fields as needed
}

export interface UserDetails {
  id: number;
  name: string;
  phone: string;
  profile_completed?: boolean;
  // Add other user fields as needed
}

export interface UserData {
  mobileNumber?: string;
  token?: string;
  role?: string;
  user?: UserDetails;
  dealer?: DealerData;
  farmer?: FarmerData;
  // Add other user data fields as needed
}

export interface FarmerProfileData {
  // Personal details
  personal_details?: {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    mobile_no?: string;
    date_of_birth?: string;
    date_of_marriage?: string;
    profile_photo_url?: string;
  };
  // Location details
  location_details?: {
    state_id?: string | number;
    district_id?: string | number;
    village_id?: string | number;
    category_id?: string | number;
    state?: string;
    district?: string;
    village?: string;
    category?: string;
  };
  // Dealership details
  dealership_details?: {
    dealership_name?: string;
    dealership_address?: string;
  };
  // Tractor details
  tractor_details?: {
    tractor_list?: any[];
  };
  // Full API response data
  fullData?: any;
}

/**
 * Save user session to AsyncStorage.
 * Only updates SESSION_KEY. Do not overwrite USER_DATA_KEY here – full login
 * data (user, token, role, etc.) is saved by saveLoginResponse().
 */
export const saveSession = async (mobileNumber?: string): Promise<void> => {
  try {
    const session: UserSession = {
      isLoggedIn: true,
      timestamp: Date.now(),
      mobileNumber,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
};

/**
 * Get user session from AsyncStorage
 */
export const getSession = async (): Promise<UserSession | null> => {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    if (sessionData) {
      return JSON.parse(sessionData) as UserSession;
    }
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Clear user session from AsyncStorage
 * Note: Language selection and Terms acceptance are NOT cleared on logout - 
 * they persist as one-time preferences that should only be shown on first app install
 */
export const clearSession = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.multiRemove([
        SESSION_KEY,
        USER_DATA_KEY,
        USER_ROLE_KEY,
        PROFILE_COMPLETED_KEY,
        PROFILE_REVIEWED_KEY,
        FARMER_PROFILE_DATA_KEY,
        PENDING_NAVIGATION_KEY,
      ]),
      clearAuthToken(),
    ]);
    // Terms acceptance is NOT cleared - it should persist across logins/logouts
    // Language selection is NOT cleared - it should persist across logins/logouts
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
};

/**
 * Check if user is logged in
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const session = await getSession();
    return session?.isLoggedIn === true;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};

/**
 * Save user role separately to AsyncStorage
 */
export const saveUserRole = async (role: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_ROLE_KEY, role);
    console.log('User role saved to AsyncStorage:', role);
  } catch (error) {
    console.error('Error saving user role:', error);
    throw error;
  }
};

/**
 * Get user role from AsyncStorage
 */
export const getUserRole = async (): Promise<string | null> => {
  try {
    const role = await AsyncStorage.getItem(USER_ROLE_KEY);
    return role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Save profile completed status separately to AsyncStorage
 */
export const saveProfileCompleted = async (completed: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROFILE_COMPLETED_KEY, completed ? 'true' : 'false');
    console.log('Profile completed status saved to AsyncStorage:', completed);
  } catch (error) {
    console.error('Error saving profile completed status:', error);
    throw error;
  }
};

/**
 * Get profile completed status from AsyncStorage
 */
export const isProfileCompleted = async (): Promise<boolean> => {
  try {
    const completed = await AsyncStorage.getItem(PROFILE_COMPLETED_KEY);
    return completed === 'true';
  } catch (error) {
    console.error('Error getting profile completed status:', error);
    return false;
  }
};

/**
 * Clear profile completed status (on logout)
 */
export const clearProfileCompleted = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PROFILE_COMPLETED_KEY);
  } catch (error) {
    console.error('Error clearing profile completed status:', error);
    throw error;
  }
};

/**
 * Save complete login response (token + role + user details) to AsyncStorage
 */
export const saveLoginResponse = async (loginResponse: {
  token?: string;
  role?: string;
  user?: UserDetails;
  dealer?: DealerData;
  farmer?: FarmerData;
  mobileNumber?: string;
}): Promise<void> => {
  try {
    const userData: UserData = {
      mobileNumber: loginResponse.mobileNumber,
      token: loginResponse.token,
      role: loginResponse.role,
      user: loginResponse.user,
      dealer: loginResponse.dealer,
      farmer: loginResponse.farmer,
    };
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    
    // Save role separately
    if (loginResponse.role) {
      await saveUserRole(loginResponse.role);
    }
    
    // Save profile_completed separately if available
    if (loginResponse.user?.profile_completed !== undefined) {
      await saveProfileCompleted(loginResponse.user.profile_completed);
    }
    
    console.log('Login response saved to AsyncStorage:', {
      role: loginResponse.role,
      hasUser: !!loginResponse.user,
      profileCompleted: loginResponse.user?.profile_completed,
      hasDealer: !!loginResponse.dealer,
      hasFarmer: !!loginResponse.farmer,
    });
  } catch (error) {
    console.error('Error saving login response:', error);
    throw error;
  }
};

/**
 * Get user data from AsyncStorage
 */
export const getUserData = async (): Promise<UserData | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    if (userData) {
      return JSON.parse(userData) as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Check if profile has been reviewed
 */
export const isProfileReviewed = async (): Promise<boolean> => {
  try {
    const reviewed = await AsyncStorage.getItem(PROFILE_REVIEWED_KEY);
    return reviewed === 'true';
  } catch (error) {
    console.error('Error checking profile review status:', error);
    return false;
  }
};

/**
 * Save profile reviewed status
 */
export const saveProfileReviewed = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROFILE_REVIEWED_KEY, 'true');
  } catch (error) {
    console.error('Error saving profile review status:', error);
    throw error;
  }
};

/**
 * Clear profile reviewed status (on logout)
 */
export const clearProfileReviewed = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PROFILE_REVIEWED_KEY);
  } catch (error) {
    console.error('Error clearing profile review status:', error);
    throw error;
  }
};

/**
 * Check if terms have been accepted
 */
export const isTermsAccepted = async (): Promise<boolean> => {
  try {
    const accepted = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
    return accepted === 'true';
  } catch (error) {
    console.error('Error checking terms acceptance status:', error);
    return false;
  }
};

/**
 * Save terms accepted status
 */
export const saveTermsAccepted = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(TERMS_ACCEPTED_KEY, 'true');
  } catch (error) {
    console.error('Error saving terms acceptance status:', error);
    throw error;
  }
};

/**
 * Clear terms accepted status (on logout)
 */
export const clearTermsAccepted = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TERMS_ACCEPTED_KEY);
  } catch (error) {
    console.error('Error clearing terms acceptance status:', error);
    throw error;
  }
};

/**
 * Check if language has been selected
 */
export const isLanguageSelected = async (): Promise<boolean> => {
  try {
    const selected = await AsyncStorage.getItem(LANGUAGE_SELECTED_KEY);
    return selected === 'true';
  } catch (error) {
    console.error('Error checking language selection status:', error);
    return false;
  }
};

/**
 * Save language selected status
 */
export const saveLanguageSelected = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_SELECTED_KEY, 'true');
  } catch (error) {
    console.error('Error saving language selection status:', error);
    throw error;
  }
};

/**
 * Clear language selected status (on logout)
 */
export const clearLanguageSelected = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LANGUAGE_SELECTED_KEY);
  } catch (error) {
    console.error('Error clearing language selection status:', error);
    throw error;
  }
};

/**
 * Check if onboarding has been shown
 */
export const isOnboardingShown = async (): Promise<boolean> => {
  try {
    const shown = await AsyncStorage.getItem(ONBOARDING_SHOWN_KEY);
    return shown === 'true';
  } catch (error) {
    console.error('Error checking onboarding shown status:', error);
    return false;
  }
};

/**
 * Save onboarding shown status
 */
export const saveOnboardingShown = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
    console.log('Onboarding shown status saved to AsyncStorage');
  } catch (error) {
    console.error('Error saving onboarding shown status:', error);
    throw error;
  }
};

/**
 * Save farmer profile data to AsyncStorage
 */
export const saveFarmerProfileData = async (profileData: FarmerProfileData): Promise<void> => {
  try {
    await AsyncStorage.setItem(FARMER_PROFILE_DATA_KEY, JSON.stringify(profileData));
    console.log('[session] Farmer profile data saved to AsyncStorage');
  } catch (error) {
    console.error('Error saving farmer profile data:', error);
    throw error;
  }
};

/**
 * Get farmer profile data from AsyncStorage
 */
export const getFarmerProfileData = async (): Promise<FarmerProfileData | null> => {
  try {
    const profileData = await AsyncStorage.getItem(FARMER_PROFILE_DATA_KEY);
    if (profileData) {
      return JSON.parse(profileData) as FarmerProfileData;
    }
    return null;
  } catch (error) {
    console.error('Error getting farmer profile data:', error);
    return null;
  }
};

/**
 * Clear farmer profile data (on logout)
 */
export const clearFarmerProfileData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FARMER_PROFILE_DATA_KEY);
  } catch (error) {
    console.error('Error clearing farmer profile data:', error);
    throw error;
  }
};

/**
 * Save pending navigation intent (e.g., from notification click)
 */
export const savePendingNavigation = async (navigationData: {action: string; screen?: string; params?: any}): Promise<void> => {
  try {
    await AsyncStorage.setItem(PENDING_NAVIGATION_KEY, JSON.stringify(navigationData));
    console.log('Pending navigation saved:', navigationData);
  } catch (error) {
    console.error('Error saving pending navigation:', error);
    throw error;
  }
};

/**
 * Get pending navigation intent
 */
export const getPendingNavigation = async (): Promise<{action: string; screen?: string; params?: any} | null> => {
  try {
    const navigationData = await AsyncStorage.getItem(PENDING_NAVIGATION_KEY);
    if (navigationData) {
      return JSON.parse(navigationData);
    }
    return null;
  } catch (error) {
    console.error('Error getting pending navigation:', error);
    return null;
  }
};

/**
 * Clear pending navigation intent
 */
export const clearPendingNavigation = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PENDING_NAVIGATION_KEY);
    console.log('Pending navigation cleared');
  } catch (error) {
    console.error('Error clearing pending navigation:', error);
    throw error;
  }
};

