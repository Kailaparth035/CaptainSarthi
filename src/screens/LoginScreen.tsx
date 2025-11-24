import React, {useState, useRef} from 'react';
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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import FloatingInput from '../components/FloatingInput';
import OTPInput from '../components/OTPInput';
import Button from '../components/Button';
import {Spacing, FontSize, spacing} from '../utils/responsive';
import {Typography} from '../utils/typography';
import {Colors} from '../constants/colors';
import {STRINGS} from '../constants/strings';
import {SCREEN_NAMES} from '../constants/screenNames';
import {RootStackParamList} from '../navigation/RootNavigator';
import { ImagePath } from '../assets/images';
import FloatingTextInput from '../components/FloatingInput';
import colors from '../utils/colors';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({navigation}: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [dealerId, setDealerId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [getOtpLoading, setGetOtpLoading] = useState(false);
  const [errors, setErrors] = useState<{dealerId?: string; otp?: string}>({});
  const dealerIdInputRef = useRef<TextInput>(null);
  const otpInputRef = useRef<TextInput>(null);

  const validateForm = () => {
    const newErrors: {dealerId?: string; otp?: string} = {};
    
    if (!dealerId.trim()) {
      newErrors.dealerId = 'Please enter dealer ID or mobile number';
    } else if (dealerId.trim().length < 10) {
      newErrors.dealerId = 'Please enter a valid dealer ID or mobile number';
    }

    if (!otp.trim()) {
      newErrors.otp = 'Please enter OTP';
    } else if (otp.trim().length < 4) {
      newErrors.otp = 'Please enter a valid OTP';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetOTP = async () => {
    Keyboard.dismiss();
    if (!dealerId.trim()) {
      setErrors({dealerId: 'Please enter dealer ID or mobile number first'});
      dealerIdInputRef.current?.focus();
      return;
    }

    setGetOtpLoading(true);
    setErrors({...errors, dealerId: undefined});
    // TODO: Implement OTP API call
    setTimeout(() => {
      setGetOtpLoading(false);
    console.log('Get OTP for:', dealerId);
    }, 1500);
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    // TODO: Implement login API call
    setTimeout(() => {
      setLoading(false);
      // Navigate to main app after successful login
      navigation.replace(SCREEN_NAMES.MainTabs);
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
              paddingTop: Spacing.lg,
              paddingBottom: insets.bottom + Spacing.xs,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={ImagePath.gujratiLogo}
              style={{ height: spacing(104), width: spacing(190) }}
            />
          </View>
          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>{STRINGS.login.title}</Text>
            <Text style={styles.description}>{STRINGS.login.description}</Text>
            <FloatingTextInput
              isPasswordField={false}
              value={dealerId}
              onChangeText={text => {
                setDealerId(text);
                if (errors.dealerId) {
                  setErrors({ ...errors, dealerId: undefined });
                }
              }}
              label={STRINGS.login.dealerIdPlaceholder}
              error={errors.dealerId}
            />

            <OTPInput
              ref={otpInputRef}
              label=""
              placeholder={STRINGS.login.otpPlaceholder}
              value={otp}
              onChangeText={text => {
                setOtp(text);
                if (errors.otp) {
                  setErrors({ ...errors, otp: undefined });
                }
              }}
              onGetOTP={handleGetOTP}
              getOTPLoading={getOtpLoading}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              error={errors.otp}
              maxLength={6}
            />
            <Text style={styles.otpDescription}>{STRINGS.login.didReciev}<Text style={{color:colors.light_orenge}}> Resend </Text>after 00:30</Text>

            <Button
              title={STRINGS.login.loginButton}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
          </View>

          {/* Footer Logo */}
          <View style={{ alignItems: 'center', justifyContent: 'center',marginTop: 30 }}>
            <Image
              source={ImagePath.captainEnglishLogo}
              style={{ height: spacing(84), width: spacing(152) }}
            />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.white,
  },
  scrollContent: {    
    // flexGrow: 1,
    // paddingBottom: Spacing.xl,
  },
  logoText: {
    ...Typography.semiBoldMd,
    color: Colors.logo.text,
    fontSize: FontSize.md,
  },
  formContainer: {
    backgroundColor: Colors.background.white,
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
    paddingTop:Spacing.xl + Spacing.lg,
  },
  title: {
    ...Typography.boldXxxl,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.text.primary,
    fontSize: FontSize.heading,
  },
  description: {    
    textAlign: 'center',
    color: Colors.text.tertiary,
    marginBottom: Spacing.xl,
    lineHeight: FontSize.md * 1.5,
  },
  otpDescription: {    
    textAlign: 'center',
    color: colors.light_text,
    marginBottom: Spacing.md,
    fontSize:FontSize.md,
  },
  loginButton: {
    marginTop: Spacing.xl,
    width: '100%',
    borderRadius:Spacing.xl
  },
  footerContainer: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  footerLogo: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  footerLogoEmblem: {
    width: spacing(60),
    height: spacing(60),
    borderRadius: spacing(30),
    backgroundColor: '#1e3a8a',
    borderWidth: 3,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  footerLogoEmblemText: {
    ...Typography.boldXxl,
    color: '#cbd5e1',
    fontSize: FontSize.xxxl,
  },
  footerLogoText: {
    ...Typography.boldXl,
    color: Colors.logo.captainText,
    letterSpacing: 1,
  },
  footerLogoSubtext: {
    ...Typography.mediumSm,
    color: Colors.logo.tractorsText,
    marginTop: Spacing.xs,
  },
});

