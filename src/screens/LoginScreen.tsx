import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Image,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import FloatingInput from '../components/FloatingInput';
import OTPInput from '../components/OTPInput';
import Button from '../components/Button';
import { Spacing, FontSize, spacing } from '../utils/responsive';
import { Typography, FontFamily } from '../utils/typography';
import { Colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { SCREEN_NAMES } from '../constants/screenNames';
import { RootStackParamList } from '../navigation/RootNavigator';
import { ImagePath } from '../assets/images';
import FloatingTextInput from '../components/FloatingInput';
import colors from '../utils/colors';
import { useDynamicStatusBar } from '../hooks/useDynamicStatusBar';
import FloatingSimpleInput from '../components/FloatingInput';
import SimpleBoxInput from '../components/FloatingInput';
import useDeviceMetrics from '../utils/responsiveCustom';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast, { ToastType } from '../components/Toast';
import { saveSession, isProfileReviewed, isTermsAccepted } from '../utils/session';
import { isFarmerRole } from '../utils/userRole';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { moderateScale } = useDeviceMetrics();
  const { t } = useLanguage();
  const [dealerId, setDealerId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [getOtpLoading, setGetOtpLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [errors, setErrors] = useState<{ dealerId?: string; otp?: string }>({});
  const dealerIdInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update StatusBar and bottom bar to match screen background color (white for login)
  useDynamicStatusBar({
    backgroundColor: Colors.background.white,
    bottomBarColor: Colors.background.white,
  });

  // Timer effect for OTP resend
  useEffect(() => {
    if (otpRequested && timer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [otpRequested, timer]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: Colors.background.white,
        },
        scrollContent: {
          flexGrow: 1,
        },
        logoContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: moderateScale(40),
          marginBottom: moderateScale(30),
        },
        topLogo: {
          height: moderateScale(100),
          width: moderateScale(180),
        },
        formContainer: {
          backgroundColor: Colors.background.white,
          marginHorizontal: moderateScale(20),
          paddingVertical: moderateScale(20),
          marginBottom: moderateScale(20),
        },
        title: {
          ...Typography.boldXxxl,
          textAlign: 'center',
          marginBottom: moderateScale(8),
          color: Colors.text.primary,
          fontSize: moderateScale(24),
        },
        description: {
          textAlign: 'center',
          color: Colors.text.tertiary,
          marginBottom: moderateScale(24),
          fontSize: moderateScale(14),
          lineHeight: moderateScale(20),
        },
        otpDescription: {
          textAlign: 'center',
          color: colors.light_text,
          marginBottom: moderateScale(16),
          fontSize: moderateScale(14),
          marginTop: moderateScale(8),
        },
        resendContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: moderateScale(8),
          marginBottom: moderateScale(16),
        },
        resendText: {
          fontSize: moderateScale(14),
          color: colors.light_orenge,
        },
        resendTextActive: {
          color: colors.primary,
          fontFamily: FontFamily.Bold,
          fontSize: moderateScale(14),
        },
        resendTextDisabled: {
          color: colors.textTertiary,
          fontSize: moderateScale(14),
        },
        loginButton: {
          marginTop: moderateScale(24),
          width: '100%',
          backgroundColor: colors.primary,
          borderRadius: moderateScale(30),
          paddingVertical: moderateScale(14),
        },
        loginButtonText: {
          color: colors.textWhite,
          fontSize: moderateScale(16),
          fontFamily: FontFamily.SemiBold,
        },
        footerLogoContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          // marginTop: 'auto',
          // paddingTop: moderateScale(20),
          paddingBottom: moderateScale(20),
        },
        footerLogo: {
          height: moderateScale(84),
          width: moderateScale(152),
        },
      }),
    [moderateScale],
  );

  const isValidMobileNumber = () => {
    const trimmed = dealerId.trim();
    return trimmed.length === 10 && /^\d+$/.test(trimmed);
  };

  const isValidOtp = () => {
    const trimmed = otp.trim();
    return trimmed.length === 6 && /^\d+$/.test(trimmed);
  };

  const validateForm = () => {
    const newErrors: { dealerId?: string; otp?: string } = {};

    if (!dealerId.trim()) {
      newErrors.dealerId = t('login.pleaseEnterMobileNumber');
    } else if (dealerId.trim().length != 10) {
      newErrors.dealerId = t('login.pleaseEnterValidMobileNumber');
    }

    if (otpRequested) {
      if (!otp.trim()) {
        newErrors.otp = t('login.pleaseEnterOtp');
      } else if (otp.trim().length != 6) {
        newErrors.otp = t('login.pleaseEnterValidOtp');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateOtp = (): string => {
    // Generate random 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const showToastMessage = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  const handleGetOtp = () => {
    if (isValidMobileNumber()) {
      setGetOtpLoading(true);
      
      // Generate OTP
      const newOtp = generateOtp();
      setGeneratedOtp(newOtp);
      
      // Simulate API call delay
      setTimeout(() => {
        setGetOtpLoading(false);
        setOtpRequested(true);
        setTimer(30);
        setCanResend(false);
        
        // Show toast with OTP
        showToastMessage(`Sent for verification. Your OTP is: ${newOtp}. Check notifications for update.`);
        
        // Focus on OTP input
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 100);
      }, 500);
    }
  };

  const handleResendOtp = () => {
    if (canResend && isValidMobileNumber()) {
      setGetOtpLoading(true);
      
      // Generate new OTP
      const newOtp = generateOtp();
      setGeneratedOtp(newOtp);
      
      // Reset timer
      setTimer(30);
      setCanResend(false);
      
      // Simulate API call delay
      setTimeout(() => {
        setGetOtpLoading(false);
        
        // Show toast with new OTP
        showToastMessage(`Sent for verification. Your OTP is: ${newOtp}. Check notifications for update.`);
      }, 500);
    }
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();

    if (!validateForm()) {
      return;
    }

    // Verify OTP
    if (otp.trim() !== generatedOtp) {
      const errorMsg = t('login.invalidOtp');
      setErrors({ ...errors, otp: errorMsg });
      showToastMessage(errorMsg, 'error');
      return;
    }

    setLoading(true);
    const mobileNumber = dealerId.trim();
    
    // TODO: Implement login API call
    setTimeout(async () => {
      try {
        // Save session to AsyncStorage
        await saveSession(mobileNumber);
        setLoading(false);
        
        // Navigate based on user role
        if (isFarmerRole(mobileNumber)) {
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
      } catch (error) {
        console.error('Error saving session:', error);
        setLoading(false);
        showToastMessage('Login successful but failed to save session', 'error');
      }
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + moderateScale(20),
              paddingBottom: insets.bottom + moderateScale(20),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={ImagePath.gujratiLogo}
              style={styles.topLogo}
              resizeMode="contain"
            />
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.description}>{t('login.description')}</Text>
            <SimpleBoxInput
              ref={dealerIdInputRef}
              label={t('login.mobileNumber')}
              placeholder={t('login.enterMobileNumber')}
              value={dealerId}
              onChangeText={text => {
                // Only allow numeric characters
                const numericText = text.replace(/[^0-9]/g, '');
                setDealerId(numericText);
                if (errors.dealerId) {
                  setErrors({ ...errors, dealerId: undefined });
                }
              }}
              keyboardType="number-pad"
              returnKeyType="next"
              error={errors.dealerId}
              maxLength={10}
            />
            <SimpleBoxInput
              label={t('login.otpPlaceholder')}
              ref={otpInputRef}
              placeholder={t('login.otpPlaceholder')}
              value={otp}
              onChangeText={text => {
                // Only allow numeric characters
                const numericText = text.replace(/[^0-9]/g, '');
                setOtp(numericText);
                if (errors.otp) {
                  setErrors({ ...errors, otp: undefined });
                }
              }}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              error={errors.otp}
              maxLength={6}
              editable={otpRequested}
            />
            <View style={styles.resendContainer}>
              {otpRequested ? (
                <>
                  <Text
                    style={[
                      styles.otpDescription,
                      { marginBottom: 0, marginTop: 0 },
                    ]}
                  >
                    {t('login.didReciev')}
                  </Text>
                  {canResend ? (
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={getOtpLoading}
                      activeOpacity={0.7}
                      style={{ opacity: getOtpLoading ? 0.5 : 1 }}
                    >
                      <Text style={styles.resendTextActive}> {t('login.resend')} </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity disabled={true} activeOpacity={1}>
                      <Text style={styles.resendTextDisabled}>
                        {' '}
                        {t('login.resendAfter')} {formatTimer(timer)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <Text style={styles.resendTextDisabled}>
                  {t('login.didReciev')} {t('login.resend')}
                </Text>
              )}
            </View>
            <Button
              title={
                otpRequested
                  ? t('login.loginButton')
                  : t('login.getOtpButton')
              }
              onPress={otpRequested ? handleLogin : handleGetOtp}
              loading={otpRequested ? loading : getOtpLoading}
              style={styles.loginButton}
              textStyle={styles.loginButtonText}
              disabled={
                otpRequested
                  ? !isValidOtp() || loading
                  : !isValidMobileNumber() || getOtpLoading
              }
            />
          </View>

          {/* Footer Logo */}
          <View style={styles.footerLogoContainer}>
            <Image
              source={ImagePath.captainEnglishLogo}
              style={styles.footerLogo}
              resizeMode="contain"
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Toast Notification */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        duration={10000}
        onClose={hideToast}
      />
    </KeyboardAvoidingView>
  );
}

