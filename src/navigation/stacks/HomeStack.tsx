import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from '../../screens/HomeScreen';
import NotificationsScreen from '../../screens/NotificationsScreen';
import EventsScreen from '../../screens/EventsScreen';
import EventDetailsScreen from '../../screens/EventDetailsScreen';
import LanguageScreen from '../../screens/LanguageScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';

export type HomeStackParamList = {
  [SCREEN_NAMES.Home]: undefined;
  [SCREEN_NAMES.Notifications]: undefined;
  [SCREEN_NAMES.Events]: undefined;
  [SCREEN_NAMES.EventDetails]: {
    eventId: string;
    title?: string;
    location?: string;
    date?: string;
    description?: string;
    videoUri?: string;
    images?: string[];
  };
  [SCREEN_NAMES.Language]: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.Home} component={HomeScreen} />
      <Stack.Screen
        name={SCREEN_NAMES.Notifications}
        component={NotificationsScreen}
      />
      <Stack.Screen name={SCREEN_NAMES.Events} component={EventsScreen} />
      <Stack.Screen
        name={SCREEN_NAMES.EventDetails}
        component={EventDetailsScreen}
      />
      <Stack.Screen
        name={SCREEN_NAMES.Language}
        component={LanguageScreen}
      />
    </Stack.Navigator>
  );
}








