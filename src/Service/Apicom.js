import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../utils/CustomAlertPopup';
import { API_BASE_URL } from './constant';
import { clearSession, clearPendingNavigation } from '../utils/session';
import { navigationRef } from '../navigation/RootNavigator';
import { SCREEN_NAMES } from '../constants/screenNames';
import { CommonActions } from '@react-navigation/native';

// Get auth token from AsyncStorage
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('@auth_token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Save auth token to AsyncStorage
const saveAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('@auth_token', token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

// Clear auth token from AsyncStorage
const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('@auth_token');
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

/**
 * Clear all AsyncStorage values completely
 * This ensures a clean logout for both dealer and farmer roles
 * Clears: auth token, session data, user data, role, profile status, pending navigation, etc.
 * Preserves: language selection, terms acceptance (these are one-time preferences)
 */
const clearAllAsyncStorage = async () => {
  try {
    console.log('[Apicom] Starting comprehensive logout - clearing all AsyncStorage values...');
    
    // Clear auth token
    await clearAuthToken();
    console.log('[Apicom] Auth token cleared');
    
    // Clear pending navigation (if any)
    try {
      await clearPendingNavigation();
      console.log('[Apicom] Pending navigation cleared');
    } catch (err) {
      console.warn('[Apicom] Error clearing pending navigation (non-critical):', err);
    }
    
    // Clear session data (includes user data, role, profile status, farmer profile data, etc.)
    await clearSession();
    console.log('[Apicom] Session data cleared');
    
    // Clear any additional AsyncStorage items that might exist
    // Get all keys and remove them (except language and terms which should persist)
    const allKeys = await AsyncStorage.getAllKeys();
    const keysToKeep = ['@language_selected', '@terms_accepted']; // Persist these one-time preferences
    const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`[Apicom] Removed ${keysToRemove.length} additional AsyncStorage keys:`, keysToRemove);
    }
    
    console.log('[Apicom] All AsyncStorage values cleared successfully - logout complete');
  } catch (error) {
    console.error('[Apicom] Error clearing AsyncStorage:', error);
    throw error;
  }
};

/**
 * Handle 401 Unauthorized - Auto logout and navigate to login
 * Works for both dealer and farmer roles
 */
const handleUnauthorized = async () => {
  try {
    console.log('[Apicom] 401 Unauthorized detected - Auto logging out user...');
    
    // Clear all AsyncStorage values
    await clearAllAsyncStorage();
    
    // Navigate to login screen using navigationRef
    if (navigationRef.current && navigationRef.current.isReady()) {
      console.log('[Apicom] Navigating to login screen...');
      navigationRef.current.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: SCREEN_NAMES.Login }],
        })
      );
      console.log('[Apicom] Successfully navigated to login screen');
    } else {
      console.warn('[Apicom] Navigation ref not ready - user will be logged out on next app open');
    }
  } catch (error) {
    console.error('[Apicom] Error during auto logout:', error);
    // Even if navigation fails, session is cleared so user will be redirected on next app open
  }
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Add auth token to each request if available
axiosInstance.interceptors.request.use(
  async config => {
    const token = await getAuthToken();
    console.log("token ::",token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
      console.log(`[REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) console.log('Request Body:', config.data);
    }

    return config;
  },
  error => {
    console.error('[REQUEST ERROR]', error);
    return Promise.reject(error);
  }
);

// Let common API function handle status-specific logic
axiosInstance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      const { status, data, config } = error.response;

      const isDataEmpty =
        (Array.isArray(data) && data.length === 0) ||
        (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0);

      const isMessageUnhelpful =
        !data?.message ||
        /success|retriev(ed)? successfully|no data found/i.test(data.message);

      if (
        (status === 404 || status === 400) &&
        !isDataEmpty &&
        !isMessageUnhelpful
      ) {
        showAlert({
          title:  'Error',
          message: data?.message || 'Requested resource not found.',
          onConfirm: () => console.log('Update action triggered'),
          yesText: 'Ok',
          noText: '',
        });
      } else if (status === 401) {
        // Auto logout on 401 - don't wait for user confirmation
        // Works for both dealer and farmer roles
        // This handles 401 from any API call: GET, POST, PUT, DELETE
        console.log('[Apicom] 401 Unauthorized response received - auto logging out...');
        console.log('[Apicom] Request that triggered 401:', {
          method: config?.method?.toUpperCase(),
          url: config?.url,
          baseURL: config?.baseURL,
        });
        
        // Automatically logout and navigate to login
        // Call handleUnauthorized without await to avoid blocking, but handle errors
        handleUnauthorized().catch(err => {
          console.error('[Apicom] Error during auto logout:', err);
          // Even if logout fails, session will be cleared on next app open
        });
        
        // Show a brief message to user that session expired
        // Note: Navigation happens in handleUnauthorized, so alert appears briefly before login screen
        showAlert({
          title: 'Session Expired',
          message: 'Your session has expired. Please login again.',
          onConfirm: () => {
            // User already on login screen or will be soon, just close alert
            console.log('[Apicom] User acknowledged session expiry');
          },
          yesText: 'OK',
          noText: '',
        });
      } else if (
        status !== 404 &&
        status !== 400 &&
        status !== 401 &&
        data?.message
      ) {
        // Show fallback alert only if message is meaningful
        showAlert({
          title: 'Error',
          message: data?.message || `${error}`,
          onConfirm: () => console.log(`Something went wrong (Code: ${status})`),
          yesText: 'Ok',
          noText: '',
        });
      } else {
        // Silent fail for uninformative errors (404 not helpful, etc.)
        console.warn(`[Silent Error] ${status} - ${config.url}`);
      }
    } else {
      console.warn('No response received from server:', error.message);
    }

    return Promise.reject(error);
  }
);


export default axiosInstance;
export { getAuthToken, saveAuthToken, clearAuthToken };
