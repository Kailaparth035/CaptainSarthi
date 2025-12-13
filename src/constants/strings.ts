// This file is kept for backward compatibility
// All strings should now use i18n translations via useLanguage hook
// Import useLanguage from '../contexts/LanguageContext' and use t() function

import {useLanguage} from '../contexts/LanguageContext';

// Helper function to get translated strings
export const useStrings = () => {
  const {t} = useLanguage();
  
  return {
    appName: t('appName'),
  tabs: {
      Home: t('tabs.Home'),
      Farmer: t('tabs.Farmer'),
      Tractors: t('tabs.Tractors'),
      More: t('tabs.More'),
      Profile: t('tabs.Profile'),
  },
  home: {
      title: t('home.title'),
      welcome: t('home.welcome'),
      greeting: t('home.greeting'),
      activeClients: t('home.activeClients'),
      tractorModels: t('home.tractorModels'),
      syncsPending: t('home.syncsPending'),
      syncNow: t('home.syncNow'),
      clients: t('home.clients'),
      tractors: t('home.tractors'),
      seeAll: t('home.seeAll'),
  },
    farmer: {
      title: t('farmer.title'),
  },
  tractors: {
      title: t('tractors.title'),
      model: t('tractors.model'),
      owner: t('tractors.owner'),
      date: t('tractors.date'),
      aToZ: t('tractors.aToZ'),
      zToA: t('tractors.zToA'),
      newestFirst: t('tractors.newestFirst'),
      oldestFirst: t('tractors.oldestFirst'),
  },
    profile: {
      title: t('profile.title'),
      description: t('profile.description'),
  },
  terms: {
      title: t('terms.title'),
      subtitle: t('terms.subtitle'),
      sectionInterpretation: t('terms.sectionInterpretation'),
      interpretationText: t('terms.interpretationText'),
      sectionDefinitions: t('terms.sectionDefinitions'),
      definitionPoints: {
        affiliate: t('terms.definitionPoints.affiliate'),
        company: t('terms.definitionPoints.company'),
        service: t('terms.definitionPoints.service'),
        you: t('terms.definitionPoints.you'),
        website: t('terms.definitionPoints.website'),
      },
      sectionAcknowledgement: t('terms.sectionAcknowledgement'),
      acknowledgementText: t('terms.acknowledgementText'),
      checkboxLabel: t('terms.checkboxLabel'),
      checkboxHighlight: t('terms.checkboxHighlight'),
      continueButton: t('terms.continueButton'),
  },
  login: {
      title: t('login.title'),
      description: t('login.description'),
      dealerIdLabel: t('login.dealerIdLabel'),
      dealerIdPlaceholder: t('login.dealerIdPlaceholder'),
      mobileNumber: t('login.mobileNumber'),
      enterMobileNumber: t('login.enterMobileNumber'),
      otpLabel: t('login.otpLabel'),
      otpPlaceholder: t('login.otpPlaceholder'),
      getOtpButton: t('login.getOtpButton'),
      loginButton: t('login.loginButton'),
      didReciev: t('login.didReciev'),
      resend: t('login.resend'),
      resendAfter: t('login.resendAfter'),
      pleaseEnterMobileNumber: t('login.pleaseEnterMobileNumber'),
      pleaseEnterValidMobileNumber: t('login.pleaseEnterValidMobileNumber'),
      pleaseEnterOtp: t('login.pleaseEnterOtp'),
      pleaseEnterValidOtp: t('login.pleaseEnterValidOtp'),
      invalidOtp: t('login.invalidOtp'),
  },
  notifications: {
      title: t('notifications.title'),
      verificationFailed: t('notifications.verificationFailed'),
      firstName: t('notifications.firstName'),
      lastName: t('notifications.lastName'),
      rejectionReason: t('notifications.rejectionReason'),
      viewForm: t('notifications.viewForm'),
  },
  };
};

// For direct access without hook (use with caution, prefer useStrings hook)
export const getString = (key: string, fallback?: string) => {
  // This is a placeholder - use useLanguage hook instead
  return fallback || key;
};


