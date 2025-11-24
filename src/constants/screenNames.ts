export const SCREEN_NAMES = {
  Login: 'Login',
  MainTabs: 'MainTabs',
  Home: 'Home',
  Profile: 'Profile',
  ProfileDetails: 'ProfileDetails',
  Farmer: 'Farmer',
  FarmerDetails: 'FarmerDetails',
  Tractors: 'Tractors',
  TractorDetails: 'TractorDetails',
  // Add more screen names here as you add screens
} as const;

export type ScreenName = typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];


