import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import Button from '../components/Button';
import {saveLanguageSelected, getSession, isProfileReviewed, isTermsAccepted, getUserRole, isLoggedIn} from '../utils/session';
import {SCREEN_NAMES} from '../constants/screenNames';
import {isFarmerRole} from '../utils/userRole';
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {ImagePath} from '../assets/images';

type Language = 'en' | 'gu' | 'hi';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  enabled: boolean;
}

type NavigationProp = NativeStackNavigationProp<any>;

export default function LanguageSelectScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation<NavigationProp>();
  const {changeLanguage, t} = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await getData(Apis.GET_LANGUAGES, {});
      if (response?.success && response?.data) {
        const supportedCodes: Language[] = ['en', 'gu', 'hi'];
        const apiLanguages: LanguageOption[] = response.data
          .filter((lang: any) => lang.is_active === true && supportedCodes.includes(lang.code))
          .map((lang: any) => ({
            code: lang.code as Language,
            name: lang.name,
            nativeName: lang.native_name || lang.name,
            enabled: lang.is_active === true,
          }));
        setLanguages(apiLanguages);
        // Set default to first active language or 'en'
        if (apiLanguages.length > 0) {
          const defaultLang = apiLanguages.find(l => l.code === 'en') || apiLanguages[0];
          setSelectedLanguage(defaultLang.code);
        }
      } else {
        // Fallback to default languages if API fails
        setLanguages([
          {code: 'en', name: 'English', nativeName: 'English', enabled: true},
          {code: 'hi', name: 'Hindi', nativeName: 'हिंदी', enabled: true},
          {code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', enabled: true},
        ]);
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      // Fallback to default languages on error
      setLanguages([
        {code: 'en', name: 'English', nativeName: 'English', enabled: true},
        {code: 'hi', name: 'Hindi', nativeName: 'हिंदी', enabled: true},
        {code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', enabled: true},
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Update StatusBar - make it visible with light content
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const handleContinue = async () => {
    // Only continue if language is enabled
    if (languages.find(l => l.code === selectedLanguage)?.enabled) {
      // Save language
      await changeLanguage(selectedLanguage);
      // Mark language as selected
      await saveLanguageSelected();
      
      // Check if user is logged in
      const loggedIn = await isLoggedIn();
      
      if (!loggedIn) {
        // First-time user - navigate to Login
        navigation.replace(SCREEN_NAMES.Login);
      } else {
        // Logged in user - navigate based on role
        const role = await getUserRole();
        const session = await getSession();
        
        if (role === 'farmer' || (session?.mobileNumber && isFarmerRole(session.mobileNumber))) {
          // Farmer role - check if terms have been accepted
          const termsAccepted = await isTermsAccepted();
          if (!termsAccepted) {
            navigation.replace(SCREEN_NAMES.Terms);
          } else {
            // Check if profile has been reviewed
            const profileReviewed = await isProfileReviewed();
            if (profileReviewed) {
              navigation.replace(SCREEN_NAMES.FarmerTabs);
            } else {
              navigation.replace(SCREEN_NAMES.ReviewProfile);
            }
          }
        } else {
          // Dealer role - navigate to MainTabs
          navigation.replace(SCREEN_NAMES.MainTabs);
        }
      }
    }
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
          paddingBottom: moderateScale(12),
          backgroundColor: colors.backgroundLight,
        },
        headerTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingBottom: moderateScale(32),
        },
        languageCard: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginTop: moderateScale(16),
        },
        languageItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: moderateScale(16),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        languageItemLast: {
          borderBottomWidth: 0,
        },
        languageIcon: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
          overflow: 'hidden',
        },
        languageIconImage: {
          width: moderateScale(20),
          height: moderateScale(20),
        },
        languageInfo: {
          flex: 1,
        },
        languageName: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        languageNativeName: {
          ...Typography.regularSm,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
        radioButton: {
          width: moderateScale(24),
          height: moderateScale(24),
          borderRadius: moderateScale(12),
          borderWidth: 2,
          borderColor: colors.borderLight,
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioButtonSelected: {
          borderColor: colors.primary,
        },
        radioButtonInner: {
          width: moderateScale(12),
          height: moderateScale(12),
          borderRadius: moderateScale(6),
          backgroundColor: colors.primary,
        },
        saveButtonContainer: {
          paddingHorizontal: moderateScale(16),
          paddingTop: moderateScale(8),
          paddingBottom: Platform.OS === 'android' ? Math.max(moderateScale(60)) : moderateScale(16),
        },
      }),
    [moderateScale, insets.top, insets.bottom],
  );

  return (
    <View style={dynamicStyles.container}>
      {/* Status Bar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.backgroundLight}
        translucent={false}
      />
      
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>{t('language.title')}</Text>
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{padding: moderateScale(40), alignItems: 'center'}}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          /* Language Selection Card */
          <View style={dynamicStyles.languageCard}>
            {languages.map((language, index) => {
            const isSelected = selectedLanguage === language.code;
            const isLast = index === languages.length - 1;
            
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  dynamicStyles.languageItem,
                  isLast && dynamicStyles.languageItemLast,
                ]}
                onPress={() => {
                  if (language.enabled) {
                    setSelectedLanguage(language.code);
                  }
                }}
                activeOpacity={language.enabled ? 0.7 : 1}
                disabled={!language.enabled}>
                {/* Language Icon */}
                <View style={dynamicStyles.languageIcon}>
                  <Image
                    source={ImagePath.language}
                    style={dynamicStyles.languageIconImage}
                    resizeMode="contain"
                  />
                </View>
                
                {/* Language Name */}
                <View style={dynamicStyles.languageInfo}>
                  <Text style={dynamicStyles.languageName}>{language.name}</Text>
                </View>
                
                {/* Radio Button */}
                <View
                  style={[
                    dynamicStyles.radioButton,
                    isSelected && dynamicStyles.radioButtonSelected,
                  ]}>
                  {isSelected && (
                    <View style={dynamicStyles.radioButtonInner} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={dynamicStyles.saveButtonContainer}>
        <Button
          title={t('common.save')}
          onPress={handleContinue}
          disabled={!languages.find(l => l.code === selectedLanguage)?.enabled}
        />
      </View>
    </View>
  );
}

