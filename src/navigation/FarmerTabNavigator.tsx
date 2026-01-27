import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {CommonActions, StackActions} from '@react-navigation/native';
import {SCREEN_NAMES} from '../constants/screenNames';
import FarmerBottomTabBar from './components/FarmerBottomTabBar';
import FarmerHomeStack from './stacks/FarmerHomeStack';
import EventsStack from './stacks/EventsStack';
import HistoryStack from './stacks/HistoryStack';
import StoriesStack from './stacks/StoriesStack';
import FarmerTractorsStack from './stacks/FarmerTractorsStack';
import FarmerProfileStack from './stacks/FarmerProfileStack';
import {FarmerHomeStackParamList} from './stacks/FarmerHomeStack';
import {EventsStackParamList} from './stacks/EventsStack';
import {HistoryStackParamList} from './stacks/HistoryStack';
import {StoriesStackParamList} from './stacks/StoriesStack';
import {FarmerTractorsStackParamList} from './stacks/FarmerTractorsStack';
import {FarmerProfileStackParamList} from './stacks/FarmerProfileStack';

export type FarmerTabParamList = {
  [SCREEN_NAMES.Home]: {screen: keyof FarmerHomeStackParamList; params?: any} | undefined;
  [SCREEN_NAMES.Events]: {screen: keyof EventsStackParamList; params?: any} | undefined;
  [SCREEN_NAMES.History]: {screen: keyof HistoryStackParamList; params?: any} | undefined;
  [SCREEN_NAMES.Stories]: {screen: keyof StoriesStackParamList; params?: any} | undefined;
  [SCREEN_NAMES.Tractors]: {screen: keyof FarmerTractorsStackParamList; params?: any} | undefined;
  [SCREEN_NAMES.Profile]: {screen: keyof FarmerProfileStackParamList; params?: any} | undefined;
};

const Tab = createBottomTabNavigator<FarmerTabParamList>();

// Helper function to create tab press listener that resets stack to root
const createTabPressListener = (screenName: string) => {
  return ({navigation, route}: any) => ({
    tabPress: (e: any) => {
      const state = navigation.getState();
      const currentTabIndex = state.index;
      const targetTabIndex = state.routes.findIndex((r: any) => r.key === route.key);
      const targetRoute = state.routes.find((r: any) => r.key === route.key);
      const tabState = targetRoute?.state;
      
      // Check if we're on a details screen (not at root)
      // tabState.index > 0 means we have multiple screens in the stack
      const isNotAtRoot = tabState && (tabState.index > 0 || (tabState.routes && tabState.routes.length > 1));
      
      // Check if we're switching from another tab
      const isSwitchingTabs = currentTabIndex !== targetTabIndex;
      
      // Check if we're pressing the same tab that's already active
      const isSameTab = currentTabIndex === targetTabIndex;
      
      // Always reset if:
      // 1. We're not at root (on a details screen) - even if same tab
      // 2. We're switching tabs
      const needsReset = isNotAtRoot || isSwitchingTabs;
      
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

export default function FarmerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={props => <FarmerBottomTabBar {...props} />}>
      <Tab.Screen 
        name={SCREEN_NAMES.Home} 
        component={FarmerHomeStack}
        listeners={createTabPressListener(SCREEN_NAMES.Home)}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Events} 
        component={EventsStack}
        listeners={createTabPressListener(SCREEN_NAMES.Events)}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Stories} 
        component={StoriesStack}
        listeners={createTabPressListener(SCREEN_NAMES.Stories)}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Tractors} 
        component={FarmerTractorsStack}
        listeners={createTabPressListener(SCREEN_NAMES.Tractors)}
      />
      {/* Profile tab hidden from tab bar but accessible programmatically */}
      <Tab.Screen 
        name={SCREEN_NAMES.Profile} 
        component={FarmerProfileStack}
        listeners={createTabPressListener(SCREEN_NAMES.Profile)}
        options={{
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
    </Tab.Navigator>
  );
}

