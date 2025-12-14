import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAuthToken } from '../Service/Apicom';

const SESSION_KEY = '@user_session';
const USER_DATA_KEY = '@user_data';
const USER_ROLE_KEY = '@user_role';
const PROFILE_REVIEWED_KEY = '@profile_reviewed';
const TERMS_ACCEPTED_KEY = '@terms_accepted';

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

/**
 * Save user session to AsyncStorage
 */
export const saveSession = async (mobileNumber?: string): Promise<void> => {
  try {
    const session: UserSession = {
      isLoggedIn: true,
      timestamp: Date.now(),
      mobileNumber,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    if (mobileNumber) {
      const userData: UserData = {
        mobileNumber,
      };
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    }
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
 */
export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
    await AsyncStorage.removeItem(USER_ROLE_KEY);
    await clearProfileReviewed();
    await clearTermsAccepted();
    // Also clear auth token
    await clearAuthToken();
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
    
    console.log('Login response saved to AsyncStorage:', {
      role: loginResponse.role,
      hasUser: !!loginResponse.user,
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

