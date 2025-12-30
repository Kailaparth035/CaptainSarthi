import React, { useState, useEffect } from 'react';
import {NavigationContainer, Theme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import TabNavigator from './TabNavigator';
import FarmerTabNavigator from './FarmerTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import TermsScreen from '../screens/TermsScreen';
import {SCREEN_NAMES} from '../constants/screenNames';
import {isLoggedIn, getSession, isTermsAccepted, getUserRole, getUserData, isLanguageSelected} from '../utils/session';
import {isFarmerRole} from '../utils/userRole';
import ReviewProfileScreen from '../screens/ReviewProfileScreen';
import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import colors from '../utils/colors';

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  LanguageSelect: undefined;
  Terms: undefined;
  MainTabs: undefined;
  FarmerTabs: undefined;
  ReviewProfile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();


export default function RootNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<string>(SCREEN_NAMES.Login);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // First check if terms have been accepted (onboarding)
      const termsAccepted = await isTermsAccepted();
      if (!termsAccepted) {
        console.log('[RootNavigator] Terms not accepted - navigating to Onboarding');
        setInitialRoute(SCREEN_NAMES.Onboarding);
        setIsLoading(false);
        return;
      }

      // Check if language has been selected (for first-time users)
      const languageSelected = await isLanguageSelected();
      if (!languageSelected) {
        console.log('[RootNavigator] Language not selected - navigating to LanguageSelect');
        setInitialRoute(SCREEN_NAMES.LanguageSelect);
        setIsLoading(false);
        return;
      }

      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        // First, try to get role from AsyncStorage (most reliable)
        const storedRole = await getUserRole();
        const userData = await getUserData();
        const session = await getSession();
        
        console.log('[RootNavigator] Session check:', {
          storedRole,
          userDataRole: userData?.role,
          mobileNumber: session?.mobileNumber,
        });
        
        // Determine role: prefer stored role, fallback to userData role, then mobile number check
        let role: string | null = storedRole || userData?.role || null;
        
        // If no role stored, fallback to mobile number check (for backward compatibility)
        if (!role && session?.mobileNumber) {
          role = isFarmerRole(session.mobileNumber) ? 'farmer' : 'dealer';
          console.log('[RootNavigator] Using mobile number fallback, role:', role);
        }
        
        // Navigate based on role
        if (role === 'farmer') {
            console.log('[RootNavigator] Farmer role detected - checking terms and profile');
            // Check if terms have been accepted
            const termsAccepted = await isTermsAccepted();
            if (!termsAccepted) {
              setInitialRoute(SCREEN_NAMES.Terms);
            } else {
              // Check if profile is completed from user data
              const profileCompleted = userData?.user?.profile_completed === true;
              console.log('[RootNavigator] Profile completed status:', profileCompleted);
              if (profileCompleted) {
                setInitialRoute(SCREEN_NAMES.FarmerTabs);
              } else {
                setInitialRoute(SCREEN_NAMES.ReviewProfile);
              }
            }
          } else {
            // Dealer role or no role (default to dealer)
            console.log('[RootNavigator] Dealer role detected - navigating to MainTabs');
            setInitialRoute(SCREEN_NAMES.MainTabs);
          }
      } else {
        console.log('[RootNavigator] Not logged in - navigating to Login');
        setInitialRoute(SCREEN_NAMES.Login);
      }
    } catch (error) {
      console.error('[RootNavigator] Error checking session:', error);
      setInitialRoute(SCREEN_NAMES.Login);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator 
        screenOptions={{headerShown: false}}
        initialRouteName={initialRoute as keyof RootStackParamList}>
        <RootStack.Screen name={SCREEN_NAMES.Onboarding} component={OnboardingScreen} />
        <RootStack.Screen name={SCREEN_NAMES.Login} component={LoginScreen} />
        <RootStack.Screen name={SCREEN_NAMES.LanguageSelect} component={LanguageSelectScreen} />
        <RootStack.Screen name={SCREEN_NAMES.Terms} component={TermsScreen} />
        <RootStack.Screen name={SCREEN_NAMES.MainTabs} component={TabNavigator} />
        <RootStack.Screen name={SCREEN_NAMES.ReviewProfile} component={ReviewProfileScreen} />
        <RootStack.Screen name={SCREEN_NAMES.FarmerTabs} component={FarmerTabNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundWhite,
  },
});


