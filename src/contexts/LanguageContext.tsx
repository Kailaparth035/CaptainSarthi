import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {changeLanguage} from '../i18n';

type Language = string;

interface LanguageContextType {
  currentLanguage: Language;
  currentLanguageId: number | null;
  changeLanguage: (lang: Language, languageId?: number | null) => Promise<void>;
  t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = '@app_language';
const LANGUAGE_ID_KEY = '@app_language_id';

export function LanguageProvider({children}: {children: ReactNode}) {
  const {t, i18n} = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [currentLanguageId, setCurrentLanguageId] = useState<number | null>(null);

  useEffect(() => {
    // Load saved language on mount
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        const savedLanguageIdRaw = await AsyncStorage.getItem(LANGUAGE_ID_KEY);
        const savedLanguageId = savedLanguageIdRaw ? Number(savedLanguageIdRaw) : null;

        if (savedLanguageIdRaw && !Number.isNaN(savedLanguageId)) {
          setCurrentLanguageId(savedLanguageId);
        }
        if (savedLanguage) {
          setCurrentLanguage(savedLanguage as Language);
          await changeLanguage(savedLanguage as Language);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();
  }, []);

  const handleChangeLanguage = async (lang: Language, languageId?: number | null) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      if (typeof languageId === 'number' && !Number.isNaN(languageId)) {
        await AsyncStorage.setItem(LANGUAGE_ID_KEY, String(languageId));
        setCurrentLanguageId(languageId);
      }
      await changeLanguage(lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        currentLanguageId,
        changeLanguage: handleChangeLanguage,
        t,
      }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

