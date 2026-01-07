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

// Helper function to create tab press listener that resets stack to root
const createTabPressListener = (screenName: string) => {
  return ({navigation, route}: any) => ({
    tabPress: (e: any) => {
      const state = navigation.getState();
      const tabState = state.routes.find((r: any) => r.key === route.key)?.state;
      const currentTabIndex = state.index;
      const targetTabIndex = state.routes.findIndex((r: any) => r.key === route.key);
      
      // Always reset to root screen when tab is pressed
      // Check if stack has multiple screens OR if we're switching from another tab
      const needsReset = (tabState && tabState.index > 0) || currentTabIndex !== targetTabIndex;
      
      if (needsReset) {
        e.preventDefault();
        
        // Reset the stack to root by creating a new state with only the root screen
        const allRoutes = state.routes.map((r: any) => {
          if (r.key === route.key) {
            // Reset this tab's stack to root - always show list page
            return {
              ...r,
              state: {
                routes: [{name: screenName}],
                index: 0,
                key: `stack-${screenName}`,
                routeNames: [screenName],
              },
            };
          }
          // Keep other tabs as they are
          return r;
        });
        
        // Dispatch reset action to reset the navigation state
        navigation.dispatch(
          CommonActions.reset({
            index: targetTabIndex,
            routes: allRoutes,
          })
        );
      }
    },
  });
};

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
        listeners={createTabPressListener(SCREEN_NAMES.Home)}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Farmer} 
        component={FarmerStack}
        listeners={createTabPressListener(SCREEN_NAMES.Farmer)}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Tractors} 
        component={TractorsStack}
        listeners={createTabPressListener(SCREEN_NAMES.Tractors)}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Profile} 
        component={ProfileStack}
        listeners={createTabPressListener(SCREEN_NAMES.Profile)}
      />
    </Tab.Navigator>
  );
}


