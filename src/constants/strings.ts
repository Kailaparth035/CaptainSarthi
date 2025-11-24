// Central place for strings. Replace with i18n later if needed.
export const STRINGS = {
  appName: 'Farmer',
  tabs: {
    Home: 'Home',
    Farmer: 'Farmer',
    Tractors: 'Tractors',
    More: 'More',
    Profile: 'Profile',
  },
  home: {
    title: 'Home',
    welcome: 'Welcome to Farmer app.',
  },
  Farmer: {
    title: 'Farmer',
  },
  tractors: {
    title: 'Tractors',
  },
  Profile: {
    title: 'Profile',
    description: 'App Profile will appear here.',
  },
  login: {
    title: 'Login',
    description: 'Enter your dealer id or mobile number to login.',
    dealerIdLabel: 'Dealer id or mobile number',
    dealerIdPlaceholder: 'Enter user id or mobile number',
    otpLabel: 'Enter OTP',
    otpPlaceholder: 'Enter OTP',
    getOtpButton: 'Get OTP',
    loginButton: 'Login',
    didReciev : 'Didn’t received?'
  },
} as const;

export type StringKeyPath = keyof typeof STRINGS;


