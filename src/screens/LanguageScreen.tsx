import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';

type Language = string;

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  enabled: boolean; // Whether this language is currently supported
}

// Use generic navigation type to support both HomeStack and ProfileStack
type NavigationProp = any;

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation<NavigationProp>();
  const {currentLanguage, changeLanguage, t} = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(currentLanguage);
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
        // Show all active languages from API
        const apiLanguages: LanguageOption[] = response.data
          .filter((lang: any) => lang.is_active === true)
          .map((lang: any) => ({
            code: lang.code as Language,
            name: lang.name,
            nativeName: lang.native_name || lang.name,
            enabled: lang.is_active === true,
          }));
        setLanguages(apiLanguages);
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

  // Update StatusBar and bottom bar
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const handleSave = async () => {
    // Only save if language is enabled
    if (languages.find(l => l.code === selectedLanguage)?.enabled) {
      await changeLanguage(selectedLanguage);
      navigation.goBack();
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
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
          paddingBottom: moderateScale(12),
          backgroundColor: colors.backgroundLight,
        },
        backButton: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundWhite,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        headerTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
          marginLeft: moderateScale(10),
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
        languageIconText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          textAlign: 'center',
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
          paddingBottom: moderateScale(16),
          paddingTop: moderateScale(8),
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <View style={dynamicStyles.container}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
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
                {/* Language Icon - Show first two letters in capital */}
                <View style={dynamicStyles.languageIcon}>
                  <Text style={dynamicStyles.languageIconText}>
                    {language.name.substring(0, 2).toUpperCase()}
                  </Text>
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
          title={t('language.save')}
          onPress={handleSave}
          disabled={!languages.find(l => l.code === selectedLanguage)?.enabled}
        />
      </View>
    </View>
  );
}

