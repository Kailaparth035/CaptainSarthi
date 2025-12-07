import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import { Typography } from '../utils/typography';

export type ToastType = 'success' | 'error';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
  style?: ViewStyle;
}

export default function Toast({
  visible,
  message,
  type = 'success',
  duration = 10000,
  onClose,
  style,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const { moderateScale } = useDeviceMetrics();
  const toastAnimation = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.spring(toastAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();

      // Auto hide after duration
      if (duration > 0) {
        timeoutRef.current = setTimeout(() => {
          hideToast();
        }, duration);
      }
    } else {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, duration]);

  const hideToast = () => {
    Animated.timing(toastAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose?.();
    });
  };

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    hideToast();
  };

  if (!visible) {
    return null;
  }

  const styles = StyleSheet.create({
    toastContainer: {
      position: 'absolute',
      top: insets.top + moderateScale(20),
      left: moderateScale(16),
      right: moderateScale(16),
      backgroundColor: type === 'success' ? '#FFF8E7' : '#FFE7E7',
      borderRadius: moderateScale(12),
      padding: moderateScale(16),
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 1000,
    },
    toastIcon: {
      width: moderateScale(40),
      height: moderateScale(40),
      borderRadius: moderateScale(20),
      backgroundColor: type === 'success' ? colors.primary : colors.statusError,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: moderateScale(12),
    },
    toastText: {
      flex: 1,
      ...Typography.regularMd,
      fontSize: moderateScale(14),
      color: colors.textPrimary,
    },
    closeButton: {
      padding: moderateScale(4),
      marginLeft: moderateScale(8),
    },
  });

  const iconName = type === 'success' ? 'checkmark' : 'close-circle';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        style,
        {
          opacity: toastAnimation,
          transform: [
            {
              translateY: toastAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={styles.toastIcon}>
        <Ionicons
          name={iconName}
          size={moderateScale(20)}
          color={colors.textWhite}
        />
      </View>
      <Text style={styles.toastText}>{message}</Text>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
        <Ionicons
          name="close"
          size={moderateScale(20)}
          color={colors.textPrimary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}






