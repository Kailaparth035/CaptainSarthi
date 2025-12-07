export const SCREEN_NAMES = {
  Login: 'Login',
  MainTabs: 'MainTabs',
  FarmerTabs: 'FarmerTabs',
  Terms: 'Terms',
  Home: 'Home',
  Profile: 'Profile',
  ProfileDetails: 'ProfileDetails',
  Farmer: 'Farmer',
  FarmerDetails: 'FarmerDetails',
  AddFarmer: 'AddFarmer',
  Tractors: 'Tractors',
  TractorDetails: 'TractorDetails',
  Notifications: 'Notifications',
  // Farmer-specific screens
  ReviewProfile: 'ReviewProfile',
  FarmerHome: 'FarmerHome',
  Events: 'Events',
  History: 'History',
  Stories: 'Stories',
  StoryDetails: 'StoryDetails',
  FarmerTractors: 'FarmerTractors',
  FarmerTractorDetails: 'FarmerTractorDetails',
  FarmerProfile: 'FarmerProfile',
  FarmerProfileDetails: 'FarmerProfileDetails',
  EventDetails: 'EventDetails',
  // Add more screen names here as you add screens
} as const;

export type ScreenName = typeof SCREEN_NAMES[keyof typeof SCREEN_NAMES];


