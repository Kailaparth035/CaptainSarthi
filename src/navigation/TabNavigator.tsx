import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SCREEN_NAMES} from '../constants/screenNames';
import BottomTabBar from './components/BottomTabBar';
import HomeStack from './stacks/HomeStack';
import FarmerStack from './stacks/FarmerStack';
import TractorsStack from './stacks/TractorsStack';
import ProfileStack from './stacks/ProfileStack';
import {HomeStackParamList} from './stacks/HomeStack';
import {FarmerStackParamList} from './stacks/FarmerStack';
import {TractorsStackParamList} from './stacks/TractorsStack';
import {ProfileStackParamList} from './stacks/ProfileStack';

export type TabParamList = {
  [SCREEN_NAMES.Home]: {screen: keyof HomeStackParamList; params?: any} | undefined;
  [SCREEN_NAMES.Farmer]: {screen: keyof FarmerStackParamList; params?: any} | undefined;
  [SCREEN_NAMES.Tractors]: {screen: keyof TractorsStackParamList; params?: any} | undefined;
  [SCREEN_NAMES.Profile]: {screen: keyof ProfileStackParamList; params?: any} | undefined;
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
      <Tab.Screen name={SCREEN_NAMES.Home} component={HomeStack} />
      <Tab.Screen name={SCREEN_NAMES.Farmer} component={FarmerStack} />
      <Tab.Screen name={SCREEN_NAMES.Tractors} component={TractorsStack} />
      <Tab.Screen name={SCREEN_NAMES.Profile} component={ProfileStack} />
    </Tab.Navigator>
  );
}


