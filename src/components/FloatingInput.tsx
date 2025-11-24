import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  I18nManager,
  StyleProp,
  ViewStyle,
  KeyboardTypeOptions,
} from 'react-native';
import { FloatingLabelInput } from 'react-native-floating-label-input';
import colors from '../utils/colors';
import { ImagePath } from '../assets/images';
import useDeviceMetrics from '../utils/responsiveCustom';

type FloatingTextInputProps = {
  isMultiline?: boolean;
  isPasswordField?: boolean;
  isEditable?: boolean;
  isOptional?: boolean;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  value?: string;
  onChangeText?: (text: string) => void;
  label?: string;
  keyboardType?: KeyboardTypeOptions;
  borderColor?: string;
  placeholderText?: string;
  autoFocus?: boolean;
  maxLength?: number;
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
} & React.ComponentProps<typeof FloatingLabelInput>;

const FloatingTextInput: React.FC<FloatingTextInputProps> = ({
  isMultiline = false,
  isPasswordField = false,
  isEditable = true,
  isOptional = false,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  value,
  onChangeText,
  label,
  keyboardType,
  borderColor,
  placeholderText,
  autoFocus,
  maxLength,
  containerStyle,
  error,
  ...props
}) => {
  const { moderateScale } = useDeviceMetrics();
  const [show, setShow] = useState(false);

  const hideShowPassword = (imageName: any) => {
    return <Image style={styles.hideShowPassword} source={imageName} />;
  };

  const togglePasswordVisibility = () => setShow(prev => !prev);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderWidth: 1,
          paddingVertical: Platform.select({
            ios: moderateScale(10),
            android: moderateScale(0),
          }),
          paddingHorizontal: moderateScale(10),
          backgroundColor: colors.white,
          borderColor: error
            ? 'red'
            : borderColor
            ? borderColor
            : colors.bottomBarTextColor,
          borderRadius: moderateScale(8),
        },
        labelStyles: {
          backgroundColor: colors.white,
          paddingHorizontal: moderateScale(5),
        },
        inputStyles: {
          textTransform: 'none',
          textAlignVertical: 'top',
          fontSize: moderateScale(14),
          marginTop: Platform.select({
            ios: moderateScale(10),
            android: moderateScale(9),
          }),
          marginBottom: Platform.select({
            ios: moderateScale(0),
            android: moderateScale(-5),
          }),
          color: colors.black,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        customLabel: {
          fontSize:moderateScale(10),
          textAlignVertical: 'top',
        },
        mainViewContainer: {
          marginTop: moderateScale(marginTop || 0),
          marginLeft: moderateScale(marginLeft || 0),
          marginRight: moderateScale(marginRight || 0),
          marginBottom: moderateScale(marginBottom || 0),
        },
        hideShowPassword: {
          width: 28,
          height: 20,
          tintColor: '#757575',
        },
        requiredAsterisk: {
          color: 'red',
        },
        errorText: {
          color: 'red',
          fontSize: moderateScale(10),
          marginLeft: moderateScale(5),
          marginTop: moderateScale(5),
          textAlign: 'left',
        },
      }),
    [moderateScale, moderateScale, error],
  );

  return (
    <View style={dynamicStyles.mainViewContainer}>
      <FloatingLabelInput
        multiline={isMultiline}
        maxLength={maxLength}
        isFocused={autoFocus}
        editable={isEditable}
        placeholder={placeholderText}
        autoCapitalize="none"
        containerStyles={[dynamicStyles.container, containerStyle]}
        isPassword={isPasswordField}
        customShowPasswordComponent={hideShowPassword(ImagePath.hidePassword)}
        customHidePasswordComponent={hideShowPassword(ImagePath.showPassword)}
        value={value}
        onChangeText={onChangeText}
        label={
          <Text>
            {label}
            {!isOptional && <Text style={dynamicStyles.requiredAsterisk}> *</Text>}
          </Text>
        }
        keyboardType={keyboardType}
        customLabelStyles={dynamicStyles.customLabel}
        inputStyles={dynamicStyles.inputStyles}
        {...props}
      />

      {error && <Text style={dynamicStyles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  hideShowPassword: {
    width: 28,
    height: 20,
    tintColor: '#757575',
  },
});

export default FloatingTextInput;
