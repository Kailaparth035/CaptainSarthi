import React, {forwardRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TextInputProps,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  TouchableOpacity,
} from 'react-native';
import {Spacing, BorderRadius, FontSize} from '../utils/responsive';
import {Typography} from '../utils/typography';
import {Colors} from '../constants/colors';
import colors from '../utils/colors';

interface OTPInputProps extends TextInputProps {
  label: string;
  error?: string;
  onGetOTP: () => void;
  getOTPLoading?: boolean;
  containerStyle?: object;
}

const OTPInput = forwardRef<TextInput, OTPInputProps>(
  (
    {
      label,
      error,
      containerStyle,
      style,
      onFocus,
      onBlur,
      value,
      onGetOTP,
      getOTPLoading = false,
      placeholder,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={styles.label}>{label}</Text>
        <View
          style={[
            styles.inputContainer,
            error && styles.inputContainerError,
            isFocused && styles.inputContainerFocused,
          ]}>
          <View style={styles.inputRow}>
            <TextInput
              ref={ref}
              style={[styles.input, style]}
              value={value}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={placeholder}
              placeholderTextColor={Colors.input.placeholder}
              {...props}
            />
            <TouchableOpacity
              onPress={onGetOTP}
              disabled={getOTPLoading}
              style={styles.getOtpButton}
              activeOpacity={0.8}>
              <Text style={styles.getOtpButtonText}>
                {getOTPLoading ? '...' : 'Get OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  },
);

OTPInput.displayName = 'OTPInput';

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.regularSm,
    color: colors.black,
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: colors.bottomBarTextColor,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.input.background,
    paddingHorizontal: Spacing.md,
    height: 50,
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderColor: Colors.input.borderFocus,
  },
  inputContainerError: {
    borderColor: Colors.status.error,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  input: {
    ...Typography.regularMd,
    color: colors.black,
    fontSize: FontSize.md,
    padding: 0,
    margin: 0,
    flex: 1,
    marginRight: Spacing.sm,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  getOtpButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.round,
    minWidth: 85,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  getOtpButtonText: {
    ...Typography.mediumSm,
    color: Colors.text.white,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm + 2,
  },
  errorText: {
    ...Typography.regularSm,
    color: Colors.status.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});

export default OTPInput;
