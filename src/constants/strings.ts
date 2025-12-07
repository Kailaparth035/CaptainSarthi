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
  terms: {
    title: 'Terms and conditions',
    subtitle:
      'Please read and accept our terms and conditions before you continue.',
    sectionInterpretation: 'Interpretation',
    interpretationText:
      'The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.',
    sectionDefinitions: 'Definitions',
    definitionPoints: [
      'Affiliate means an entity that controls, is controlled by or is under common control with a party.',
      'Company refers to Captain Tractors Private Limited.',
      'Service refers to the mobile application and related services provided by the Company.',
      'You means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service.',
      'Website refers to Captain Tractors, accessible from https://www.captaintractors.com.',
    ],
    sectionAcknowledgement: 'Acknowledgement',
    acknowledgementText:
      'These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions.',
    checkboxLabel: 'Read and accept our terms',
    checkboxHighlight: 'before you continue.',
    continueButton: 'Continue',
  },
  login: {
    title: 'Login',
    description: 'Enter your mobile number to login.',
    dealerIdLabel: 'Dealer id or mobile number',
    dealerIdPlaceholder: 'Enter user id or mobile number',
    otpLabel: 'Enter OTP',
    otpPlaceholder: 'Enter OTP',
    getOtpButton: 'Get OTP',
    loginButton: 'Login',
    didReciev : `Didn't received?`
  },
  notifications: {
    title: 'Notifications',
    verificationFailed: 'Verification failed',
    firstName: 'First name',
    lastName: 'Last name',
    rejectionReason: 'Rejection reason',
    viewForm: 'View form',
  },
} as const;

export type StringKeyPath = keyof typeof STRINGS;


