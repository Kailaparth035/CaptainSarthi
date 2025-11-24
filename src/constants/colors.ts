/**
 * Central color palette for the application
 * All colors used throughout the app should be defined here
 */

export const Colors = {
  // Primary Colors
  primary: '#F59E0B', // Orange - Main brand color
  primaryDark: '#D97706',
  primaryLight: '#FCD34D',

  // Text Colors
  text: {
    primary: '#1e293b',
    secondary: '#334155',
    tertiary: '#64748b',
    light: '#94a3b8',
    white: '#ffffff',
  },

  // Background Colors
  background: {
    white: '#ffffff',
    light: '#f1f5f9',
    gray: '#f8fafc',
  },

  // Border Colors
  border: {
    default: '#e2e8f0',
    light: '#f1f5f9',
    dark: '#cbd5e1',
    focus: '#F59E0B', // Orange border on focus
  },

  // Status Colors
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },

  // Button Colors
  button: {
    primary: '#F59E0B',
    primaryText: '#ffffff',
    secondary: '#64748b',
    secondaryText: '#ffffff',
    outline: 'transparent',
    outlineText: '#F59E0B',
    outlineBorder: '#F59E0B',
  },

  // Input Colors
  input: {
    background: '#ffffff',
    border: '#e2e8f0',
    borderFocus: '#F59E0B',
    text: '#1e293b',
    placeholder: '#94a3b8',
    label: '#64748b',
    error: '#ef4444',
  },

  // Logo Colors
  logo: {
    border: '#F59E0B',
    text: '#1e293b',
    captainText: '#F59E0B',
    tractorsText: '#64748b',
  },
} as const;

export type ColorKey = keyof typeof Colors;

