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
import { saveSession, saveLoginResponse, isTermsAccepted, isProfileCompleted, getPendingNavigation, clearPendingNavigation, saveTermsAccepted, saveProfileCompleted } from '../utils/session';
import { isFarmerRole } from '../utils/userRole';
import { postData } from '../Service/Apimethod';
import Apis from '../Service/constant';
import { saveAuthToken } from '../Service/Apicom';
import FirebaseService from '../Service/FirebaseService';

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
  const [memberId, setMemberId] = useState<string>('');
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
    // Accept OTP with 4 or 6 digits
    return (trimmed.length === 4 || trimmed.length === 6) && /^\d+$/.test(trimmed);
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

        // Show success message with OTP included
        let message = response?.message || 'OTP sent successfully. Please check your mobile.';
        if (response?.otp) {
          message = `${message} Your OTP is: ${response.otp}`;
        }
        showToastMessage(message, 'success');
        
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

        // Show success message with OTP included
        let message = response?.message || 'OTP resent successfully.';
        if (response?.otp) {
          message = `${message} Your OTP is: ${response.otp}`;
        }
        showToastMessage(message, 'success');
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
      const bodyData = {
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
        
        // Save auth token if provided
        if (token) {
          await saveAuthToken(token);
        }

        // Save complete login response (token + role + user details) to AsyncStorage
        await saveLoginResponse({
          token: token,
          role: role,
          user: user,
          dealer: dealer,
          farmer: farmer,
          mobileNumber: mobileNumber,
        });

        // Save session to AsyncStorage
        await saveSession(mobileNumber);
        
        // Register FCM token after successful login (for both farmers and dealers)
        try {
          // Get FCM device token
          const deviceToken = await FirebaseService.getToken();
          
          if (deviceToken) {
            // Determine device type based on platform
            const deviceType = Platform.OS === 'android' ? 'android' : 'ios';
            
            // Prepare request body
            const fcmBodyData = {
              device_token: deviceToken,
              device_type: deviceType,
            };
            
            // Call appropriate FCM register API based on role
            let fcmResponse;
            if (role === 'farmer') {
              fcmResponse = await postData(Apis.FARMER_FCM_REGISTER, fcmBodyData);
              console.log('[LoginScreen] Farmer FCM token registered successfully after login:', fcmResponse);
            } else if (role === 'dealer') {
              fcmResponse = await postData(Apis.DEALER_FCM_REGISTER, fcmBodyData);
              console.log('[LoginScreen] Dealer FCM token registered successfully after login:', fcmResponse);
            }
            
            if (!fcmResponse) {
              console.log('[LoginScreen] FCM token registration failed or no response');
            }
          } else {
            console.log('[LoginScreen] FCM token not available');
          }
        } catch (fcmError) {
          console.error('[LoginScreen] Error registering FCM token after login:', fcmError);
          // Silently fail - don't block login if FCM registration fails
        }
        
        setLoading(false);
        
        // Show success message with green background
        const successMsg = response?.message || 'Login successful';
        showToastMessage(successMsg, 'success');
        
        // Clear any errors
        setErrors({});
        
        // Navigate to dashboard after a short delay to show the success message
        setTimeout(async () => {
          // First check if language has been selected
          const {isLanguageSelected} = await import('../utils/session');
          const languageSelected = await isLanguageSelected();
          
          if (!languageSelected) {
            // Navigate to language selection screen first
            navigation.replace(SCREEN_NAMES.LanguageSelect);
            return;
          }
          
          // Check for pending navigation (e.g., from notification click)
          const pendingNav = await getPendingNavigation();
          const hasPendingNotificationNav = pendingNav?.action === 'OPEN_NOTIFICATION_DETAIL' && role === 'farmer';
          const hasPendingEventNav = pendingNav?.action === 'OPEN_EVENT_DETAIL' && role === 'farmer';
          
          // Navigate based on role from response
          if (role === 'farmer') {
            // Check profile_completed from API response first
            const isProfileCompleted = user?.profile_completed === true;
            console.log('[LoginScreen] Farmer login - Profile completed from API:', isProfileCompleted, 'Raw value:', user?.profile_completed);
            
            if (isProfileCompleted) {
              // Profile is completed - navigate directly to FarmerTabs (FarmerHomeScreen)
              // Save terms acceptance and profile completion status to prevent showing TermsScreen/ReviewProfileScreen on app restart
              const termsAccepted = await isTermsAccepted();
              if (!termsAccepted) {
                await saveTermsAccepted();
                console.log('[LoginScreen] Terms acceptance saved because profile is completed');
              }
              await saveProfileCompleted(true);
              console.log('[LoginScreen] Profile completed status saved');
              console.log('[LoginScreen] Profile completed - navigating to FarmerTabs');
              navigation.replace(SCREEN_NAMES.FarmerTabs);
              
              // If there's a pending notification navigation, navigate to Notifications screen
              if (hasPendingNotificationNav) {
                console.log('[LoginScreen] Pending notification navigation detected - will navigate to Notifications');
                // Wait a bit for navigation to complete, then navigate to Notifications
                setTimeout(() => {
                  (navigation as any).navigate(SCREEN_NAMES.FarmerTabs, {
                    screen: SCREEN_NAMES.Home,
                    params: {
                      screen: SCREEN_NAMES.Notifications,
                    },
                  });
                  // Clear pending navigation
                  clearPendingNavigation();
                }, 500);
              } else if (hasPendingEventNav && pendingNav?.params?.eventId) {
                // If there's a pending event navigation, navigate to EventDetails screen
                console.log('[LoginScreen] Pending event navigation detected - will navigate to EventDetails with eventId:', pendingNav.params.eventId);
                setTimeout(() => {
                  (navigation as any).navigate(SCREEN_NAMES.FarmerTabs, {
                    screen: SCREEN_NAMES.Events,
                    params: {
                      screen: SCREEN_NAMES.EventDetails,
                      params: {
                        eventId: pendingNav.params.eventId,
                      },
                    },
                  });
                  // Clear pending navigation
                  clearPendingNavigation();
                }, 500);
              }
            } else {
              // Profile not completed - show TermsScreen first, then ReviewProfileScreen in sequence
              // Check if terms have been accepted
              const termsAccepted = await isTermsAccepted();
              if (!termsAccepted) {
                // Show TermsScreen first, which will navigate to ReviewProfileScreen after acceptance
                console.log('[LoginScreen] Profile not completed - navigating to TermsScreen first');
                navigation.replace(SCREEN_NAMES.Terms);
              } else {
                // Terms already accepted, navigate directly to ReviewProfileScreen
                console.log('[LoginScreen] Profile not completed - navigating to ReviewProfileScreen');
                navigation.replace(SCREEN_NAMES.ReviewProfile);
              }
              // Store pending navigation for after profile completion
              if (hasPendingNotificationNav || hasPendingEventNav) {
                console.log('[LoginScreen] Profile not completed - storing pending navigation');
              }
            }
          } else if (role === 'dealer') {
            // Dealer role - navigate to MainTabs (dashboard)
            navigation.replace(SCREEN_NAMES.MainTabs);
            // Clear pending navigation if any (not for dealer)
            if (pendingNav) {
              await clearPendingNavigation();
            }
          } else {
            // Fallback: if role is not provided, use mobile number check
            if (isFarmerRole(mobileNumber)) {
              // Check profile_completed from API response first
              const isProfileCompleted = user?.profile_completed === true;
              console.log('[LoginScreen] Farmer login (fallback) - Profile completed from API:', isProfileCompleted, 'Raw value:', user?.profile_completed);
              
              if (isProfileCompleted) {
                // Profile is completed - navigate directly to FarmerTabs (FarmerHomeScreen)
                // Save terms acceptance and profile completion status to prevent showing TermsScreen/ReviewProfileScreen on app restart
                const termsAccepted = await isTermsAccepted();
                if (!termsAccepted) {
                  await saveTermsAccepted();
                  console.log('[LoginScreen] Terms acceptance saved because profile is completed (fallback)');
                }
                await saveProfileCompleted(true);
                console.log('[LoginScreen] Profile completed status saved (fallback)');
                console.log('[LoginScreen] Profile completed (fallback) - navigating to FarmerTabs');
                navigation.replace(SCREEN_NAMES.FarmerTabs);
                
                // If there's a pending notification navigation, navigate to Notifications screen
                if (hasPendingNotificationNav) {
                  console.log('[LoginScreen] Pending notification navigation detected (fallback) - will navigate to Notifications');
                  setTimeout(() => {
                    (navigation as any).navigate(SCREEN_NAMES.FarmerTabs, {
                      screen: SCREEN_NAMES.Home,
                      params: {
                        screen: SCREEN_NAMES.Notifications,
                      },
                    });
                    clearPendingNavigation();
                  }, 500);
                } else if (hasPendingEventNav && pendingNav?.params?.eventId) {
                  // If there's a pending event navigation, navigate to EventDetails screen
                  console.log('[LoginScreen] Pending event navigation detected (fallback) - will navigate to EventDetails with eventId:', pendingNav.params.eventId);
                  setTimeout(() => {
                    (navigation as any).navigate(SCREEN_NAMES.FarmerTabs, {
                      screen: SCREEN_NAMES.Events,
                      params: {
                        screen: SCREEN_NAMES.EventDetails,
                        params: {
                          eventId: pendingNav.params.eventId,
                        },
                      },
                    });
                    clearPendingNavigation();
                  }, 500);
                }
              } else {
                // Profile not completed - show TermsScreen first, then ReviewProfileScreen in sequence
                // Check if terms have been accepted
                const termsAccepted = await isTermsAccepted();
                if (!termsAccepted) {
                  // Show TermsScreen first, which will navigate to ReviewProfileScreen after acceptance
                  console.log('[LoginScreen] Profile not completed (fallback) - navigating to TermsScreen first');
                  navigation.replace(SCREEN_NAMES.Terms);
                } else {
                  // Terms already accepted, navigate directly to ReviewProfileScreen
                  console.log('[LoginScreen] Profile not completed (fallback) - navigating to ReviewProfileScreen');
                  navigation.replace(SCREEN_NAMES.ReviewProfile);
                }
                // Store pending navigation for after profile completion
                if (hasPendingNotificationNav || hasPendingEventNav) {
                  console.log('[LoginScreen] Profile not completed (fallback) - storing pending navigation');
                }
              }
            } else {
              navigation.replace(SCREEN_NAMES.MainTabs);
              // Clear pending navigation if any (not for farmer)
              if (pendingNav) {
                await clearPendingNavigation();
              }
            }
          }
        }, 1000); // Wait 1 second to show the success message
      } else {
        setLoading(false);
        const errorMsg = response?.message || t('login.invalidOtp');
        setErrors({ ...errors, otp: errorMsg });
        showToastMessage(errorMsg, 'error');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setLoading(false);
      const errorMsg = error?.response?.data?.message || t('login.invalidOtp');
      setErrors({ ...errors, otp: errorMsg });
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
              paddingTop: insets.top + moderateScale(12),
              paddingBottom: insets.bottom + moderateScale(12),
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
              numberOfLinesLabel={1}
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
              numberOfLinesLabel={1}
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
                  ? !isValidOtp() || loading || getOtpLoading
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

