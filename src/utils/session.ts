import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@user_session';
const USER_DATA_KEY = '@user_data';
const PROFILE_REVIEWED_KEY = '@profile_reviewed';
const TERMS_ACCEPTED_KEY = '@terms_accepted';

export interface UserSession {
  isLoggedIn: boolean;
  timestamp: number;
  mobileNumber?: string;
}

export interface UserData {
  mobileNumber: string;
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
    await clearProfileReviewed();
    await clearTermsAccepted();
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

