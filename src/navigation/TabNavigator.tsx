import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {CommonActions} from '@react-navigation/native';
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
      <Tab.Screen 
        name={SCREEN_NAMES.Home} 
        component={HomeStack}
        listeners={({navigation, route}) => ({
          tabPress: (e) => {
            // Always reset stack to main screen when tab is pressed
            const state = navigation.getState();
            const tabState = state.routes.find(r => r.key === route.key)?.state;
            
            // If stack exists and has multiple screens, pop to root
            if (tabState && tabState.index > 0) {
              e.preventDefault();
              // Navigate to root screen to reset the stack
              navigation.dispatch(
                CommonActions.navigate({
                  name: SCREEN_NAMES.Home,
                  params: {
                    screen: SCREEN_NAMES.Home,
                  },
                })
              );
            }
          },
        })}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Farmer} 
        component={FarmerStack}
        listeners={({navigation, route}) => ({
          tabPress: (e) => {
            // Always reset stack to main screen when tab is pressed
            const state = navigation.getState();
            const tabState = state.routes.find(r => r.key === route.key)?.state;
            
            // If stack exists and has multiple screens, pop to root
            if (tabState && tabState.index > 0) {
              e.preventDefault();
              // Navigate to root screen to reset the stack
              navigation.dispatch(
                CommonActions.navigate({
                  name: SCREEN_NAMES.Farmer,
                  params: {
                    screen: SCREEN_NAMES.Farmer,
                  },
                })
              );
            }
          },
        })}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Tractors} 
        component={TractorsStack}
        listeners={({navigation, route}) => ({
          tabPress: (e) => {
            // Always reset stack to main screen when tab is pressed
            const state = navigation.getState();
            const tabState = state.routes.find(r => r.key === route.key)?.state;
            
            // If stack exists and has multiple screens, pop to root
            if (tabState && tabState.index > 0) {
              e.preventDefault();
              // Navigate to root screen to reset the stack
              navigation.dispatch(
                CommonActions.navigate({
                  name: SCREEN_NAMES.Tractors,
                  params: {
                    screen: SCREEN_NAMES.Tractors,
                  },
                })
              );
            }
          },
        })}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Profile} 
        component={ProfileStack}
        listeners={({navigation, route}) => ({
          tabPress: (e) => {
            // Always reset stack to main screen when tab is pressed
            const state = navigation.getState();
            const tabState = state.routes.find(r => r.key === route.key)?.state;
            
            // If stack exists and has multiple screens, pop to root
            if (tabState && tabState.index > 0) {
              e.preventDefault();
              // Navigate to root screen to reset the stack
              navigation.dispatch(
                CommonActions.navigate({
                  name: SCREEN_NAMES.Profile,
                  params: {
                    screen: SCREEN_NAMES.Profile,
                  },
                })
              );
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}


