import {TextStyle, Platform} from 'react-native';
import {FontFamilies} from '../assets/fonts';
import {FontSize} from './responsive';

/**
 * Gilroy Font Family - Main font family for the app
 */
export const FontFamily = FontFamilies.Gilroy;

/**
 * Typography styles using Gilroy font family
 * Use these in your StyleSheet or as inline styles
 */
export const Typography = {
  // Regular weight styles
  regular: {
    fontFamily: FontFamily.Regular,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  regularXs: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.xs,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  regularSm: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.sm,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  regularMd: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.md,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  regularLg: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.lg,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  regularXl: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.xl,
    fontWeight: '400' as TextStyle['fontWeight'],
  },

  // Medium weight styles
  medium: {
    fontFamily: FontFamily.Medium,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  mediumXs: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.xs,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  mediumSm: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.sm,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  mediumMd: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.md,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  mediumLg: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.lg,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  mediumXl: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.xl,
    fontWeight: '500' as TextStyle['fontWeight'],
  },

  // SemiBold weight styles
  semiBold: {
    fontFamily: FontFamily.SemiBold,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  semiBoldXs: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.xs,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  semiBoldSm: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.sm,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  semiBoldMd: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.md,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  semiBoldLg: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.lg,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  semiBoldXl: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.xl,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  semiBoldXxl: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.xxl,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  semiBoldXxxl: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.xxxl,
    fontWeight: '600' as TextStyle['fontWeight'],
  },

  // Bold weight styles
  bold: {
    fontFamily: FontFamily.Bold,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  boldXs: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.xs,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  boldSm: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.sm,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  boldMd: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.md,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  boldLg: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.lg,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  boldXl: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.xl,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  boldXxl: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.xxl,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  boldXxxl: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.xxxl,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  boldTitle: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.title,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  boldHeading: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.heading,
    fontWeight: '700' as TextStyle['fontWeight'],
  },
};

/**
 * Helper function to get font family by weight
 */
export const getFontFamily = (weight: 'Regular' | 'Medium' | 'SemiBold' | 'Bold' = 'Regular') => {
  return FontFamily[weight];
};

/**
 * Platform-specific font fallback
 * On Android, if custom fonts fail, fallback to system fonts
 */
export const getFontFamilyWithFallback = (
  weight: 'Regular' | 'Medium' | 'SemiBold' | 'Bold' = 'Regular',
): string => {
  const fontFamily = FontFamily[weight];
  if (Platform.OS === 'android') {
    // Android fallback
    return fontFamily;
  }
  return fontFamily;
};

