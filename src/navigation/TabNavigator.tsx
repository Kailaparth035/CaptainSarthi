import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import {SCREEN_NAMES} from '../constants/screenNames';
import {STRINGS} from '../constants/strings';
import FarmerScreen from '../screens/FarmerScreen';
import TractorsScreen from '../screens/TractorsScreen';
import BottomTabBar from './components/BottomTabBar';

export type TabParamList = {
  [SCREEN_NAMES.Home]: undefined;
  [SCREEN_NAMES.Farmer]: undefined;
  [SCREEN_NAMES.Tractors]: undefined;
  [SCREEN_NAMES.Profile]: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={props => <BottomTabBar {...props} />}>
      <Tab.Screen name={SCREEN_NAMES.Home} component={HomeScreen} />
      <Tab.Screen name={SCREEN_NAMES.Farmer} component={FarmerScreen} />
      <Tab.Screen name={SCREEN_NAMES.Tractors} component={TractorsScreen} />
      <Tab.Screen name={SCREEN_NAMES.Profile} component={ProfileScreen} />
    </Tab.Navigator>
  );
}


