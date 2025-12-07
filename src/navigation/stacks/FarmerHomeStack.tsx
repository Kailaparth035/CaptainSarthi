import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import FarmerHomeScreen from '../../screens/FarmerHomeScreen';
import NotificationsScreen from '../../screens/NotificationsScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';

export type FarmerHomeStackParamList = {
  [SCREEN_NAMES.Home]: undefined;
  [SCREEN_NAMES.Notifications]: undefined;
};

const Stack = createNativeStackNavigator<FarmerHomeStackParamList>();

export default function FarmerHomeStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.Home} component={FarmerHomeScreen} />
      <Stack.Screen
        name={SCREEN_NAMES.Notifications}
        component={NotificationsScreen}
      />
    </Stack.Navigator>
  );
}

