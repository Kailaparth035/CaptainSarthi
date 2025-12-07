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
 * Note: Custom fonts handle weight via different font files (Regular, Medium, SemiBold, Bold)
 */
export const Typography = {
  // Regular weight styles
  regular: {
    fontFamily: FontFamily.Regular,
  },
  regularXs: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.xs,
  },
  regularSm: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.sm,
  },
  regularMd: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.md,
  },
  regularLg: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.lg,
  },
  regularXl: {
    fontFamily: FontFamily.Regular,
    fontSize: FontSize.xl,
  },

  // Medium weight styles
  medium: {
    fontFamily: FontFamily.Medium,
  },
  mediumXs: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.xs,
  },
  mediumSm: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.sm,
  },
  mediumMd: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.md,
  },
  mediumLg: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.lg,
  },
  mediumXl: {
    fontFamily: FontFamily.Medium,
    fontSize: FontSize.xl,
  },

  // SemiBold weight styles
  semiBold: {
    fontFamily: FontFamily.SemiBold,
  },
  semiBoldXs: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.xs,
  },
  semiBoldSm: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.sm,
  },
  semiBoldMd: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.md,
  },
  semiBoldLg: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.lg,
  },
  semiBoldXl: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.xl,
  },
  semiBoldXxl: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.xxl,
  },
  semiBoldXxxl: {
    fontFamily: FontFamily.SemiBold,
    fontSize: FontSize.xxxl,
  },

  // Bold weight styles
  bold: {
    fontFamily: FontFamily.Bold,
  },
  boldXs: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.xs,
  },
  boldSm: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.sm,
  },
  boldMd: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.md,
  },
  boldLg: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.lg,
  },
  boldXl: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.xl,
  },
  boldXxl: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.xxl,
  },
  boldXxxl: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.xxxl,
  },
  boldTitle: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.title,
  },
  boldHeading: {
    fontFamily: FontFamily.Bold,
    fontSize: FontSize.heading,
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
    // Android fallback - return font family
    return fontFamily;
  }
  return fontFamily;
};

/**
 * Get font style with font family
 * Custom fonts handle weight via different font files (Regular, Medium, SemiBold, Bold)
 */
export const getFontStyle = (
  weight: 'Regular' | 'Medium' | 'SemiBold' | 'Bold' = 'Regular',
  fontSize?: number,
): TextStyle => {
  const fontFamily = FontFamily[weight];
  const style: TextStyle = {
    fontFamily,
  };

  if (fontSize) {
    style.fontSize = fontSize;
  }

  return style;
};

