import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  Platform,
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
import {saveTermsAccepted} from '../utils/session';
import {SCREEN_NAMES} from '../constants/screenNames';
import {ImagePath} from '../assets/images';

type NavigationProp = NativeStackNavigationProp<any>;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation<NavigationProp>();
  const {t} = useLanguage();
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Update StatusBar
  useDynamicStatusBar({
    backgroundColor: 'transparent',
    bottomBarColor: 'transparent',
  });

  const handleGetStarted = async () => {
    if (termsAccepted) {
      // Save terms acceptance
      await saveTermsAccepted();
      // Navigate to language selection screen first
      navigation.replace(SCREEN_NAMES.LanguageSelect);
    }
  };

  const handleTermsPress = (e: any) => {
    e.stopPropagation();
    // Navigate to terms screen
    navigation.navigate(SCREEN_NAMES.Terms);
  };

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
        },
        backgroundImage: {
          flex: 1,
          width: '100%',
          height: '100%',
        },
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          justifyContent: 'flex-end',
          paddingTop: insets.top,
          paddingBottom: insets.bottom + moderateScale(12),
        },
        contentContainer: {
          paddingHorizontal: moderateScale(24),
          paddingBottom: moderateScale(40),
        },
        logoContainer: {
          alignItems: 'center',
          marginBottom: moderateScale(24),
        },
        logo: {
          width: moderateScale(200),
          height: moderateScale(120),
          resizeMode: 'contain',
        },
        getStartedButton: {
          width: '100%',
          marginBottom: moderateScale(20),
        },
        termsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: moderateScale(16),
        },
        checkbox: {
          width: moderateScale(20),
          height: moderateScale(20),
          borderRadius: moderateScale(4),
          borderWidth: 2,
          borderColor: colors.textWhite,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(8),
        },
        checkboxInner: {
          width: moderateScale(12),
          height: moderateScale(12),
          borderRadius: moderateScale(2),
          backgroundColor: colors.primary,
        },
        termsText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textWhite,
          flex: 1,
          flexWrap: 'wrap',
        },
        termsLink: {
          color: colors.primary,
          textDecorationLine: 'underline',
        },
      }),
    [moderateScale, insets.top, insets.bottom, termsAccepted],
  );

  return (
    <View style={dynamicStyles.container}>
      <ImageBackground
        source={ImagePath.onboardingScreen} // You may need to add the actual background image
        style={dynamicStyles.backgroundImage}
        resizeMode="cover">
        <View style={dynamicStyles.overlay}>
          

          {/* Bottom Content */}
          <View style={dynamicStyles.contentContainer}>

            {/* Logo */}
          <View style={dynamicStyles.logoContainer}>
            <Image
              source={ImagePath.captainLogo}
              style={dynamicStyles.logo}
              resizeMode="contain"
            />
          </View>
            {/* Get Started Button */}
            <Button
              title={t('onboarding.getStarted') || 'Get started'}
              onPress={handleGetStarted}
              disabled={!termsAccepted}
              style={dynamicStyles.getStartedButton}
            />

            {/* Terms & Conditions */}
            <View style={dynamicStyles.termsContainer}>
              <TouchableOpacity
                onPress={() => setTermsAccepted(!termsAccepted)}
                activeOpacity={0.7}
                style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={dynamicStyles.checkbox}>
                  {termsAccepted && (
                    <Ionicons
                      name="checkmark"
                      size={moderateScale(14)}
                      color={colors.primary}
                    />
                  )}
                </View>
                <Text style={dynamicStyles.termsText}>
                  {t('onboarding.agreeTerms') || 'Agree our '}
                  <Text
                    style={dynamicStyles.termsLink}
                    onPress={handleTermsPress}>
                    {t('onboarding.termsConditions') || 'terms & conditions'}
                  </Text>
                  {' '}
                  {t('onboarding.beforeContinue') || 'before you continue.'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

