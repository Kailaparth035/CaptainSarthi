import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import FarmerTractorsScreen from '../../screens/FarmerTractorsScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';
import FarmerTractorDetails from '../../screens/FarmerTractorDetails';

export type FarmerTractorsStackParamList = {
  [SCREEN_NAMES.Tractors]: undefined;
  [SCREEN_NAMES.FarmerTractorDetails]: undefined;
};

const Stack = createNativeStackNavigator<FarmerTractorsStackParamList>();

export default function FarmerTractorsStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.Tractors} component={FarmerTractorsScreen} />
      <Stack.Screen name={SCREEN_NAMES.FarmerTractorDetails} component={FarmerTractorDetails} />
    </Stack.Navigator>
  );
}








