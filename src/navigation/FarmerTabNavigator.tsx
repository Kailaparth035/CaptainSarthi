import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {CommonActions} from '@react-navigation/native';
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

export default function FarmerTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
      tabBar={props => <FarmerBottomTabBar {...props} />}>
      <Tab.Screen name={SCREEN_NAMES.Home} component={FarmerHomeStack} />
      <Tab.Screen 
        name={SCREEN_NAMES.Events} 
        component={EventsStack}
        listeners={({navigation, route}) => ({
          tabPress: (e) => {
            // Always reset stack to Events list page when tab is pressed
            const state = navigation.getState();
            const tabState = state.routes.find(r => r.key === route.key)?.state;
            
            // If stack exists and has multiple screens, pop to root
            if (tabState && tabState.index > 0) {
              e.preventDefault();
              // Navigate to root screen to reset the stack
              navigation.dispatch(
                CommonActions.navigate({
                  name: SCREEN_NAMES.Events,
                  params: {
                    screen: SCREEN_NAMES.Events,
                  },
                })
              );
            }
          },
        })}
      />
      <Tab.Screen 
        name={SCREEN_NAMES.Stories} 
        component={StoriesStack}
        listeners={({navigation, route}) => ({
          tabPress: (e) => {
            // Always reset stack to Stories list page when tab is pressed
            const state = navigation.getState();
            const tabState = state.routes.find(r => r.key === route.key)?.state;
            
            // If stack exists and has multiple screens, pop to root
            if (tabState && tabState.index > 0) {
              e.preventDefault();
              // Navigate to root screen to reset the stack
              navigation.dispatch(
                CommonActions.navigate({
                  name: SCREEN_NAMES.Stories,
                  params: {
                    screen: SCREEN_NAMES.Stories,
                  },
                })
              );
            }
          },
        })}
      />
      <Tab.Screen name={SCREEN_NAMES.Tractors} component={FarmerTractorsStack} />
      <Tab.Screen name={SCREEN_NAMES.Profile} component={FarmerProfileStack} />
    </Tab.Navigator>
  );
}

