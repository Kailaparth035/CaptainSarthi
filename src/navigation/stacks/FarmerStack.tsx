import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import FarmerScreen from '../../screens/FarmerScreen';
import FarmerDetailsScreen from '../../screens/FarmerDetailsScreen';
import AddFarmerScreen from '../../screens/AddFarmerScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';

export type FarmerStackParamList = {
  [SCREEN_NAMES.Farmer]: undefined;
  [SCREEN_NAMES.FarmerDetails]: {
    farmerId: string;
    farmer_id?: string;
    farmerName: string;
    farmerPhone: string;
    farmerInitials: string;
    fromScreen?: 'Home' | 'List';
  };
  [SCREEN_NAMES.AddFarmer]: {
    farmerId?: string;
    editMode?: boolean;
    rejectedUpdate?: boolean; // Third flow: rejected update from notifications
  } | undefined;
};

const Stack = createNativeStackNavigator<FarmerStackParamList>();

export default function FarmerStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.Farmer} component={FarmerScreen} />
      <Stack.Screen
        name={SCREEN_NAMES.FarmerDetails}
        component={FarmerDetailsScreen}
      />
      <Stack.Screen
        name={SCREEN_NAMES.AddFarmer}
        component={AddFarmerScreen}
      />
    </Stack.Navigator>
  );
}

