import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import TractorsScreen from '../../screens/TractorsScreen';
import TractorDetailsScreen from '../../screens/TractorDetailsScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';

export type TractorsStackParamList = {
  [SCREEN_NAMES.Tractors]: undefined;
  [SCREEN_NAMES.TractorDetails]: {
    tractorId: string;
    tractorModel: string;
    tractorOwner: string;
    tractorColor: string;
    fromScreen?: 'Home' | 'List';
  };
};

const Stack = createNativeStackNavigator<TractorsStackParamList>();

export default function TractorsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.Tractors} component={TractorsScreen} />
      <Stack.Screen
        name={SCREEN_NAMES.TractorDetails}
        component={TractorDetailsScreen}
      />
    </Stack.Navigator>
  );
}








