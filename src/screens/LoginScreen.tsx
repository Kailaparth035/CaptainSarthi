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
  useWindowDimensions,
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
import {
  saveSession,
  saveLoginResponse,
  isTermsAccepted,
  getPendingNavigation,
  clearPendingNavigation,
  saveTermsAccepted,
  saveProfileCompleted,
  isLanguageSelected,
  UserDetails,
} from '../utils/session';
import { isFarmerRole } from '../utils/userRole';
import { postData } from '../Service/Apimethod';
import Apis from '../Service/constant';
import { saveAuthToken } from '../Service/Apicom';
import FirebaseService from '../Service/FirebaseService';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
type LoginMode = 'otp' | 'password';

/** Navigate to the correct screen immediately after login — no artificial delay. */
async function navigateAfterLogin(
  navigation: LoginScreenProps['navigation'],
  role: string,
  user: UserDetails | undefined,
  mobileNumber: string,
): Promise<void> {
  const languageSelected = await isLanguageSelected();
  if (!languageSelected) {
    navigation.replace(SCREEN_NAMES.LanguageSelect);
    return;
  }

  const pendingNav = await getPendingNavigation();
  const hasPendingNotificationNav =
    pendingNav?.action === 'OPEN_NOTIFICATION_DETAIL' && role === 'farmer';
  const hasPendingEventNav =
    pendingNav?.action === 'OPEN_EVENT_DETAIL' && role === 'farmer';

  const navigateToPendingEvent = (eventId: string) => {
    setTimeout(() => {
      (navigation as any).navigate(SCREEN_NAMES.FarmerTabs, {
        screen: SCREEN_NAMES.Events,
        params: {
          screen: SCREEN_NAMES.EventDetails,
          params: {eventId},
        },
      });
      clearPendingNavigation();
    }, 300);
  };

  const handleFarmerNavigation = async () => {
    const isProfileCompletedFlag = user?.profile_completed === true;

    if (isProfileCompletedFlag) {
      const termsAccepted = await isTermsAccepted();
      if (!termsAccepted) {
        await saveTermsAccepted();
      }
      await saveProfileCompleted(true);
      navigation.replace(SCREEN_NAMES.FarmerTabs);

      if (hasPendingNotificationNav && pendingNav?.params?.eventId) {
        navigateToPendingEvent(String(pendingNav.params.eventId));
      } else if (hasPendingEventNav && pendingNav?.params?.eventId) {
        navigateToPendingEvent(String(pendingNav.params.eventId));
      }
      return;
    }

    const termsAccepted = await isTermsAccepted();
    if (!termsAccepted) {
      navigation.replace(SCREEN_NAMES.Terms);
    } else {
      navigation.replace(SCREEN_NAMES.ReviewProfile);
    }
  };

  if (role === 'farmer') {
    await handleFarmerNavigation();
  } else if (role === 'dealer') {
    navigation.replace(SCREEN_NAMES.MainTabs);
    if (pendingNav) {
      await clearPendingNavigation();
    }
  } else if (isFarmerRole(mobileNumber)) {
    await handleFarmerNavigation();
  } else {
    navigation.replace(SCREEN_NAMES.MainTabs);
    if (pendingNav) {
      await clearPendingNavigation();
    }
  }
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { moderateScale } = useDeviceMetrics();
  const {height: screenHeight} = useWindowDimensions();
  const { t, currentLanguage } = useLanguage();
  const isCompactLayout = screenHeight < 700;
  const [dealerId, setDealerId] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState<LoginMode>('otp');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [getOtpLoading, setGetOtpLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [errors, setErrors] = useState<{
    dealerId?: string;
    otp?: string;
    password?: string;
  }>({});
  const [memberId, setMemberId] = useState<string>('');
  const dealerIdInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update StatusBar and bottom bar to match screen background color (white for login)
  useDynamicStatusBar({
    backgroundColor: Colors.background.white,
    bottomBarColor: Colors.background.white,
  });

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true),
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false),
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
          justifyContent: 'space-between',
        },
        logoContainer: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: moderateScale(isCompactLayout ? 8 : 16),
          marginBottom: moderateScale(isCompactLayout ? 12 : 16),
        },
        topLogo: {
          height: moderateScale(isCompactLayout ? 78 : 90),
          width: moderateScale(isCompactLayout ? 150 : 165),
        },
        formContainer: {
          backgroundColor: Colors.background.white,
          marginHorizontal: moderateScale(20),
          paddingVertical: moderateScale(isCompactLayout ? 4 : 8),
          marginBottom: moderateScale(isCompactLayout ? 4 : 8),
        },
        title: {
          ...Typography.boldXxxl,
          textAlign: 'center',
          marginBottom: moderateScale(6),
          color: Colors.text.primary,
          fontSize: moderateScale(isCompactLayout ? 22 : 24),
        },
        description: {
          textAlign: 'center',
          color: Colors.text.tertiary,
          marginBottom: moderateScale(isCompactLayout ? 14 : 18),
          fontSize: moderateScale(14),
          lineHeight: moderateScale(20),
        },
        otpDescription: {
          textAlign: 'center',
          color: colors.light_text,
          marginBottom: moderateScale(10),
          fontSize: moderateScale(14),
          marginTop: moderateScale(8),
        },
        resendContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: moderateScale(4),
          marginBottom: moderateScale(8),
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
          marginTop: moderateScale(isCompactLayout ? 14 : 18),
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
          paddingBottom: moderateScale(isCompactLayout ? 4 : 8),
        },
        footerLogo: {
          height: moderateScale(isCompactLayout ? 62 : 70),
          width: moderateScale(isCompactLayout ? 122 : 132),
        },
        passwordInputContainer: {
          position: 'relative',
        },
        passwordVisibilityButton: {
          position: 'absolute',
          right: moderateScale(14),
          top: moderateScale(28),
          padding: moderateScale(4),
          zIndex: 2,
        },
        switchModeButton: {
          alignSelf: 'center',
          marginTop: moderateScale(10),
          paddingVertical: moderateScale(4),
          paddingHorizontal: moderateScale(8),
        },
        switchModeText: {
          color: colors.primary,
          fontFamily: FontFamily.SemiBold,
          fontSize: moderateScale(14),
        },
      }),
    [moderateScale, isCompactLayout],
  );

  const isValidMobileNumber = () => {
    const trimmed = dealerId.trim();
    return trimmed.length === 10 && /^\d+$/.test(trimmed);
  };

  const isValidOtp = () => {
    const trimmed = otp.trim();
    // Accept OTP with 4 or 6 digits
    return (trimmed.length === 4 || trimmed.length === 6) && /^\d+$/.test(trimmed);
  };

  const switchLoginMode = (nextMode: LoginMode) => {
    if (nextMode === loginMode) {
      return;
    }

    setLoginMode(nextMode);
    setOtp('');
    setPassword('');
    setOtpRequested(false);
    setGeneratedOtp('');
    setCanResend(false);
    setTimer(30);
    setErrors({});
    setLoading(false);
    setGetOtpLoading(false);

    setTimeout(() => {
      if (nextMode === 'password') {
        passwordInputRef.current?.focus();
      } else {
        dealerIdInputRef.current?.focus();
      }
    }, 100);
  };

  const validateForm = () => {
    const newErrors: {dealerId?: string; otp?: string; password?: string} = {};

    if (!dealerId.trim()) {
      newErrors.dealerId = t('login.pleaseEnterMobileNumber');
    } else if (dealerId.trim().length != 10) {
      newErrors.dealerId = t('login.pleaseEnterValidMobileNumber');
    }

    if (loginMode === 'password') {
      if (!password) {
        newErrors.password = t('login.pleaseEnterPassword');
      }
    } else if (otpRequested) {
      if (!otp.trim()) {
        newErrors.otp = t('login.pleaseEnterOtp');
      } else if (otp.trim().length !== 4 && otp.trim().length !== 6) {
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

  const handleGetOtp = async () => {
    if (!isValidMobileNumber()) {
      return;
    }

    setGetOtpLoading(true);
    const mobileNumber = dealerId.trim();

    try {
      // Prepare JSON body for send-otp API
      const bodyData = {
        phone: mobileNumber,
      };

      // Use common send-otp API for both dealer and farmer
      const response = await postData(Apis.SEND_OTP, bodyData);

      // Strictly check if response is successful - only proceed if success is true or status is true
      const isSuccess = response && (response?.success === true || response?.status === true);
      
      if (isSuccess) {
        // Only execute these processes if success is true
        setGetOtpLoading(false);
        setOtpRequested(true);
        setTimer(30);
        setCanResend(false);
        
        // Store member_id if provided
        if (response?.data?.member_id) {
          setMemberId(response.data.member_id);
        }

        const apiOtp = response?.otp;
        console.log("apiOtp ::;",apiOtp);
        
        // const toastMsg =
        //   apiOtp != null && String(apiOtp).trim()
        //     ? `${t('login.yourOtpIs')} ${String(apiOtp).trim()}`
        //     : t('login.otpSentSuccess');
        showToastMessage(t('login.otpSentSuccess'), 'success');
        
        // Focus on OTP input
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 100);
      } else {
        // If success is false, don't execute any further process
        console.log('Send OTP failed response:', response);
        
        setGetOtpLoading(false);
        // Don't set otpRequested - keep it false so timer doesn't start
        // Don't start timer
        // Don't enable login button
        const errorMsg = response?.message || 'Failed to send OTP. Please try again.';
        showToastMessage(errorMsg, 'error');
        setErrors({ ...errors, dealerId: errorMsg });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setGetOtpLoading(false);
      const errorMsg = 'Failed to send OTP. Please try again.';
      showToastMessage(errorMsg, 'error');
      setErrors({ ...errors, dealerId: errorMsg });
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || !isValidMobileNumber()) {
      return;
    }

    setGetOtpLoading(true);
    const mobileNumber = dealerId.trim();

    try {
      // Prepare JSON body for send-otp API
      const bodyData = {
        phone: mobileNumber,
      };

      // Use common send-otp API for both dealer and farmer
      const response = await postData(Apis.SEND_OTP, bodyData);

      // Strictly check if response is successful - only proceed if success is true or status is true
      const isSuccess = response && (response?.success === true || response?.status === true);
      
      if (isSuccess) {
        // Only start timer if success is true
        setGetOtpLoading(false);
        setTimer(30);
        setCanResend(false);
        
        // Store member_id if provided
        if (response?.data?.member_id) {
          setMemberId(response.data.member_id);
        }

        const apiOtp = response?.otp;
        // const toastMsg =
        //   apiOtp != null && String(apiOtp).trim()
        //     ? `${t('login.yourOtpIs')} ${String(apiOtp).trim()}`
        //     : t('login.otpResentSuccess');
        showToastMessage(t('login.otpSentSuccess'), 'success');
      } else {
        // If success is false, don't start timer
        setGetOtpLoading(false);
        const errorMsg = response?.message || 'Failed to resend OTP. Please try again.';
        showToastMessage(errorMsg, 'error');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setGetOtpLoading(false);
      const errorMsg = 'Failed to resend OTP. Please try again.';
      showToastMessage(errorMsg, 'error');
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

    setLoading(true);
    const mobileNumber = dealerId.trim();

    try {
      // Prepare JSON body for login API
      const bodyData =
        loginMode === 'password'
          ? {
              phone: mobileNumber,
              password,
            }
          : {
              phone: mobileNumber,
              otp: otp.trim(),
            };

      // Use common login API for both dealer and farmer
      const response = await postData(Apis.LOGIN, bodyData);

      // Check if response exists and is successful
      // The handleApiResponse returns data directly, so response is the data object
      if (response && (response?.success === true || response?.token || response?.role || response?.user)) {
        console.log('Login response:', response);
        
        // Extract token, role, user, dealer, and farmer data from response
        const token = response?.token;
        let role = response?.role; // "farmer" or "dealer"
        const user = response?.user; // { id, name, phone, profile_completed }
        const dealer = response?.dealer;
        const farmer = response?.farmer;
        
        // Extract profile_completed from API response (inside user object)
        const profileCompleted = user?.profile_completed ?? false;
        console.log('[LoginScreen] Profile completed from API:', profileCompleted);
        
        // If role is not in response, determine from mobile number (fallback)
        if (!role) {
          role = isFarmerRole(mobileNumber) ? 'farmer' : 'dealer';
          console.log('[LoginScreen] Role not in response, using mobile number fallback:', role);
        }
        
        console.log('[LoginScreen] Login successful - Role:', role, 'Token:', token ? 'Present' : 'Missing', 'Profile Completed:', profileCompleted);
        
        await Promise.all([
          token ? saveAuthToken(token) : Promise.resolve(),
          saveLoginResponse({
            token: token,
            role: role,
            user: user,
            dealer: dealer,
            farmer: farmer,
            mobileNumber: mobileNumber,
          }),
          saveSession(mobileNumber),
        ]);

        // Do not await — FCM can take 10+ seconds on iPad/iOS before retries finish
        FirebaseService.registerFcmAfterLogin(role);

        setErrors({});
        showToastMessage(response?.message || 'Login successful', 'success');

        await navigateAfterLogin(navigation, role, user, mobileNumber);
        setLoading(false);
      } else {
        setLoading(false);
        const errorMsg =
          response?.message ||
          (loginMode === 'password'
            ? t('login.invalidPassword')
            : t('login.invalidOtp'));
        setErrors({...errors, [loginMode === 'password' ? 'password' : 'otp']: errorMsg});
        showToastMessage(errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setLoading(false);
      const errorMsg =
        error?.response?.data?.message ||
        (loginMode === 'password'
          ? t('login.invalidPassword')
          : t('login.invalidOtp'));
      setErrors({...errors, [loginMode === 'password' ? 'password' : 'otp']: errorMsg});
      showToastMessage(errorMsg, 'error');
    }
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
              paddingTop: insets.top + moderateScale(isCompactLayout ? 6 : 8),
              paddingBottom: insets.bottom + moderateScale(isCompactLayout ? 6 : 8),
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={isKeyboardVisible}
          bounces={isKeyboardVisible}
          overScrollMode="never"
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Image
              source={
                currentLanguage === 'en'
                  ? ImagePath.Mainlogo_english
                  : currentLanguage === 'hi'
                  ? ImagePath.Mainlogo_hindi
                  : ImagePath.gujratiLogo
              }
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
              numberOfLinesLabel={1}
            />
            {loginMode === 'otp' ? (
              <>
                <SimpleBoxInput
                  label={t('login.otpPlaceholder')}
                  ref={otpInputRef}
                  placeholder={t('login.otpPlaceholder')}
                  value={otp}
                  onChangeText={text => {
                    const numericText = text.replace(/[^0-9]/g, '');
                    setOtp(numericText);
                    if (errors.otp) {
                      setErrors({...errors, otp: undefined});
                    }
                  }}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  error={errors.otp}
                  maxLength={6}
                  editable={otpRequested}
                  numberOfLinesLabel={1}
                />
                <View style={styles.resendContainer}>
                  {otpRequested ? (
                    <>
                      <Text
                        style={[
                          styles.otpDescription,
                          {marginBottom: 0, marginTop: 0},
                        ]}>
                        {t('login.didReciev')}
                      </Text>
                      {canResend ? (
                        <TouchableOpacity
                          onPress={handleResendOtp}
                          disabled={getOtpLoading}
                          activeOpacity={0.7}
                          style={{opacity: getOtpLoading ? 0.5 : 1}}>
                          <Text style={styles.resendTextActive}>
                            {' '}
                            {t('login.resend')}{' '}
                          </Text>
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
              </>
            ) : (
              <View style={styles.passwordInputContainer}>
                <SimpleBoxInput
                  ref={passwordInputRef}
                  label={t('login.password')}
                  placeholder={t('login.enterPassword')}
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({...errors, password: undefined});
                    }
                  }}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  error={errors.password}
                  style={{paddingRight: moderateScale(42)}}
                  numberOfLinesLabel={1}
                />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={
                    isPasswordVisible
                      ? t('login.hidePassword')
                      : t('login.showPassword')
                  }
                  onPress={() => setIsPasswordVisible(current => !current)}
                  style={styles.passwordVisibilityButton}>
                  <Ionicons
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={moderateScale(20)}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>
            )}
            <Button
              title={
                loginMode === 'password'
                  ? t('login.loginButton')
                  : otpRequested
                  ? t('login.loginButton')
                  : t('login.getOtpButton')
              }
              onPress={
                loginMode === 'password'
                  ? handleLogin
                  : otpRequested
                  ? handleLogin
                  : handleGetOtp
              }
              loading={loginMode === 'password' || otpRequested ? loading : getOtpLoading}
              style={styles.loginButton}
              textStyle={styles.loginButtonText}
              disabled={
                loginMode === 'password'
                  ? !isValidMobileNumber() || !password || loading
                  : otpRequested
                  ? !isValidOtp() || loading || getOtpLoading
                  : !isValidMobileNumber() || getOtpLoading
              }
            />
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() =>
                switchLoginMode(loginMode === 'otp' ? 'password' : 'otp')
              }
              style={styles.switchModeButton}>
              <Text style={styles.switchModeText}>
                {loginMode === 'otp'
                  ? t('login.loginWithPassword')
                  : t('login.loginWithOtp')}
              </Text>
            </TouchableOpacity>
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
