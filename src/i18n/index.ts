import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import gu from './locales/gu.json';
import hi from './locales/hi.json';

const LANGUAGE_KEY = '@app_language';

// Language detection
const getStoredLanguage = async (): Promise<string> => {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_KEY);
    return language || 'en';
  } catch (error) {
    return 'en';
  }
};

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: {translation: en},
      gu: {translation: gu},
      hi: {translation: hi},
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Function to change language - accepts any language code, falls back to 'en' if not supported
export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
    // i18n will automatically fallback to 'en' if the language is not in resources
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Initialize language on app start
getStoredLanguage().then(language => {
  i18n.changeLanguage(language);
});

export default i18n;

