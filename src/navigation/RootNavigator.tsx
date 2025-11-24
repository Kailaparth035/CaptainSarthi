import React from 'react';
import {NavigationContainer, Theme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import FarmerDetailsScreen from '../screens/FarmerDetailsScreen';
import TractorDetailsScreen from '../screens/TractorDetailsScreen';
import ProfileDetailsScreen from '../screens/ProfileDetailsScreen';
import {SCREEN_NAMES} from '../constants/screenNames';

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  FarmerDetails: {
    farmerId: string;
    farmerName: string;
    farmerPhone: string;
    farmerInitials: string;
  };
  TractorDetails: {
    tractorId: string;
    tractorModel: string;
    tractorOwner: string;
    tractorColor: string;
  };
  ProfileDetails: undefined;
  // Add other modal/detail routes here later
};

const RootStack = createNativeStackNavigator<RootStackParamList>();


export default function RootNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator 
        screenOptions={{headerShown: false}}
        initialRouteName={SCREEN_NAMES.Login}>
        <RootStack.Screen name={SCREEN_NAMES.Login} component={LoginScreen} />
        <RootStack.Screen name={SCREEN_NAMES.MainTabs} component={TabNavigator} />
        <RootStack.Screen 
          name={SCREEN_NAMES.FarmerDetails} 
          component={FarmerDetailsScreen} 
        />
        <RootStack.Screen 
          name={SCREEN_NAMES.TractorDetails} 
          component={TractorDetailsScreen} 
        />
        <RootStack.Screen 
          name={SCREEN_NAMES.ProfileDetails} 
          component={ProfileDetailsScreen} 
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}


