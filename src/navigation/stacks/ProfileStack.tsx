import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import ProfileScreen from '../../screens/ProfileScreen';
import ProfileDetailsScreen from '../../screens/ProfileDetailsScreen';
import LanguageScreen from '../../screens/LanguageScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';

export type ProfileStackParamList = {
  [SCREEN_NAMES.Profile]: undefined;
  [SCREEN_NAMES.ProfileDetails]: undefined;
  [SCREEN_NAMES.Language]: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.Profile} component={ProfileScreen} />
      <Stack.Screen
        name={SCREEN_NAMES.ProfileDetails}
        component={ProfileDetailsScreen}
      />
      <Stack.Screen
        name={SCREEN_NAMES.Language}
        component={LanguageScreen}
      />
    </Stack.Navigator>
  );
}








