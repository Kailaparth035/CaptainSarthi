import {Dimensions, PixelRatio, Platform} from 'react-native';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Base dimensions (design reference - typically iPhone 11/12/13)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Scale factor based on screen width
const scale = SCREEN_WIDTH / BASE_WIDTH;
const verticalScale = SCREEN_HEIGHT / BASE_HEIGHT;

// Moderate scale for better control (less aggressive scaling)
const moderateScale = (size: number, factor: number = 0.5) =>
  size + (scale - 1) * size * factor;

/**
 * Responsive width - scales based on screen width
 * @param size - Base width in design (default 375px)
 * @returns Scaled width
 */
export const wp = (size: number): number => {
  return PixelRatio.roundToNearestPixel(size * scale);
};

/**
 * Responsive height - scales based on screen height
 * @param size - Base height in design (default 812px)
 * @returns Scaled height
 */
export const hp = (size: number): number => {
  return PixelRatio.roundToNearestPixel(size * verticalScale);
};

/**
 * Responsive font size - uses moderate scaling for better readability
 * @param size - Base font size
 * @param factor - Scaling factor (0-1), default 0.5
 * @returns Scaled font size
 */
export const fontSize = (size: number, factor: number = 0.5): number => {
  return PixelRatio.roundToNearestPixel(moderateScale(size, factor));
};

/**
 * Responsive spacing (padding/margin) - uses moderate scaling
 * @param size - Base spacing size
 * @param factor - Scaling factor (0-1), default 0.5
 * @returns Scaled spacing
 */
export const spacing = (size: number, factor: number = 0.5): number => {
  return PixelRatio.roundToNearestPixel(moderateScale(size, factor));
};

/**
 * Get screen dimensions
 */
export const getScreenDimensions = () => ({
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale,
  verticalScale,
});

/**
 * Check if device is tablet
 */
export const isTablet = (): boolean => {
  return (
    (SCREEN_WIDTH >= 768 && SCREEN_HEIGHT >= 1024) ||
    (SCREEN_HEIGHT >= 768 && SCREEN_WIDTH >= 1024)
  );
};

/**
 * Check if device is small screen
 */
export const isSmallScreen = (): boolean => {
  return SCREEN_WIDTH < 375;
};

/**
 * Platform-specific spacing adjustments
 */
export const platformSpacing = (size: number): number => {
  const baseSpacing = spacing(size);
  return Platform.select({
    ios: baseSpacing,
    android: baseSpacing * 1.1, // Slightly more spacing on Android
    default: baseSpacing,
  });
};

/**
 * Common spacing presets
 */
export const Spacing = {
  xs: spacing(4),
  sm: spacing(8),
  md: spacing(16),
  lg: spacing(24),
  xl: spacing(32),
  xxl: spacing(48),
};

/**
 * Common font sizes
 */
export const FontSize = {
  xs: fontSize(10),
  sm: fontSize(12),
  md: fontSize(14),
  lg: fontSize(16),
  xl: fontSize(18),
  xxl: fontSize(20),
  xxxl: fontSize(24),
  title: fontSize(28),
  heading: fontSize(32),
};

/**
 * Common border radius
 */
export const BorderRadius = {
  sm: spacing(4),
  md: spacing(8),
  lg: spacing(12),
  xl: spacing(16),
  round: spacing(999),
};

/**
 * Export font families for easy access
 */
export {FontFamilies} from '../assets/fonts';

