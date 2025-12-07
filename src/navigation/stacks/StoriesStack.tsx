import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import StoriesScreen from '../../screens/StoriesScreen';
import StoryDetailsScreen from '../../screens/StoryDetailsScreen';
import {SCREEN_NAMES} from '../../constants/screenNames';

export type StoriesStackParamList = {
  [SCREEN_NAMES.Stories]: undefined;
  [SCREEN_NAMES.StoryDetails]: {
    storyId: string;
    title?: string;
    date?: string;
    description?: string;
    videoUri?: string;
    images?: string[];
    fromScreen?: 'Home' | 'List';
  };
};

const Stack = createNativeStackNavigator<StoriesStackParamList>();

export default function StoriesStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name={SCREEN_NAMES.Stories} component={StoriesScreen} />
      <Stack.Screen name={SCREEN_NAMES.StoryDetails} component={StoryDetailsScreen} />
    </Stack.Navigator>
  );
}

