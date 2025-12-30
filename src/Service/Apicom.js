import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../utils/CustomAlertPopup';
import { API_BASE_URL } from './constant';
import { clearSession } from '../utils/session';

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

// Reset to login screen
const resetToAuth = async () => {
  try {
    await clearAuthToken();
    await clearSession();
    // Navigation reset will be handled by the component
  } catch (error) {
    console.error('Error resetting auth:', error);
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
        showAlert({
          title: 'Unauthorized',
          message: 'Session expired. Please login again.',
          onConfirm: async () => await resetToAuth(),
          yesText: 'LOGIN',
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
