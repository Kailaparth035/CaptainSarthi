import React, { useState, useEffect } from 'react';
import {NavigationContainer, Theme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import TabNavigator from './TabNavigator';
import FarmerTabNavigator from './FarmerTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import TermsScreen from '../screens/TermsScreen';
import {SCREEN_NAMES} from '../constants/screenNames';
import {isLoggedIn, getSession, isProfileReviewed, isTermsAccepted} from '../utils/session';
import {isFarmerRole} from '../utils/userRole';
import ReviewProfileScreen from '../screens/ReviewProfileScreen';
import colors from '../utils/colors';

export type RootStackParamList = {
  Login: undefined;
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
      const loggedIn = await isLoggedIn();
      if (loggedIn) {
        // Check user role based on mobile number
        const session = await getSession();
        console.log("session ::",session);
        
        if (session?.mobileNumber && isFarmerRole(session.mobileNumber)) {
          // Check if terms have been accepted
          const termsAccepted = await isTermsAccepted();
          if (!termsAccepted) {
            setInitialRoute(SCREEN_NAMES.Terms);
          } else {
            // Check if profile has been reviewed
            const profileReviewed = await isProfileReviewed();
            if (profileReviewed) {
              setInitialRoute(SCREEN_NAMES.FarmerTabs);
            } else {
              setInitialRoute(SCREEN_NAMES.ReviewProfile);
            }
          }
        } else {
          setInitialRoute(SCREEN_NAMES.MainTabs);
        }
      } else {
        setInitialRoute(SCREEN_NAMES.Login);
      }
    } catch (error) {
      console.error('Error checking session:', error);
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
        <RootStack.Screen name={SCREEN_NAMES.Login} component={LoginScreen} />
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


