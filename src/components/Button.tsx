import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {Spacing, BorderRadius, FontSize} from '../utils/responsive';
import {Typography} from '../utils/typography';
import {Colors} from '../constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.button, styles.primaryButton];
      case 'secondary':
        return [styles.button, styles.secondaryButton];
      case 'outline':
        return [styles.button, styles.outlineButton];
      default:
        return [styles.button, styles.primaryButton];
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return [styles.buttonText, styles.primaryText];
      case 'secondary':
        return [styles.buttonText, styles.secondaryText];
      case 'outline':
        return [styles.buttonText, styles.outlineText];
      default:
        return [styles.buttonText, styles.primaryText];
    }
  };

  return (
    <TouchableOpacity
      style={[
        ...getButtonStyle(),
        isDisabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator color={Colors.text.white} size="small" />
      ) : (
        <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: Spacing.xl + Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.button.secondary,
  },
  outlineButton: {
    backgroundColor: Colors.button.outline,
    borderWidth: 1,
    borderColor: Colors.button.outlineBorder,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    ...Typography.semiBoldMd,
    fontSize: FontSize.md,
  },
  primaryText: {
    color: Colors.text.white,
  },
  secondaryText: {
    color: Colors.text.white,
  },
  outlineText: {
    color: Colors.button.outlineText,
  },
});

