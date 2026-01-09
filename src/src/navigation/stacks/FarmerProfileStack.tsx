import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import FarmerProfileScreen from '../../screens/FarmerProfileScreen';
import FarmerProfileDetailsScreen from '../../screens/FarmerProfileDetailsScreen';
import LanguageScreen from '../../screens/LanguageScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';

export type FarmerProfileStackParamList = {
  [SCREEN_NAMES.Profile]: undefined;
  [SCREEN_NAMES.FarmerProfileDetails]: undefined;
  [SCREEN_NAMES.Language]: undefined;
};

const Stack = createNativeStackNavigator<FarmerProfileStackParamList>();

export default function FarmerProfileStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.Profile} component={FarmerProfileScreen} />
      <Stack.Screen
        name={SCREEN_NAMES.FarmerProfileDetails}
        component={FarmerProfileDetailsScreen}
      />
      <Stack.Screen
        name={SCREEN_NAMES.Language}
        component={LanguageScreen}
      />
    </Stack.Navigator>
  );
}








