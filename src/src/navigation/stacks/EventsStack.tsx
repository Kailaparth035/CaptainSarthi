import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import EventsScreen from '../../screens/EventsScreen';
import EventDetailsScreen from '../../screens/EventDetailsScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';

export type EventsStackParamList = {
  [SCREEN_NAMES.Events]: undefined;
  [SCREEN_NAMES.EventDetails]: {
    eventId: string;
    title?: string;
    location?: string;
    date?: string;
    description?: string;
    videoUri?: string;
    images?: string[];
    fromScreen?: 'Home' | 'List';
  };
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

export default function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.Events} component={EventsScreen} />
      <Stack.Screen
        name={SCREEN_NAMES.EventDetails}
        component={EventDetailsScreen}
      />
    </Stack.Navigator>
  );
}








