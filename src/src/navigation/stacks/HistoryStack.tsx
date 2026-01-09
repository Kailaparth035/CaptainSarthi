import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HistoryScreen from '../../screens/HistoryScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';

export type HistoryStackParamList = {
  [SCREEN_NAMES.History]: undefined;
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.History} component={HistoryScreen} />
    </Stack.Navigator>
  );
}








