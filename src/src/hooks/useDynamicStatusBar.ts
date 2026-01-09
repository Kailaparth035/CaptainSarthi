import React from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {useStatusBar, getBarStyleForBackground} from '../contexts/StatusBarContext';

type UseDynamicStatusBarOptions = {
  backgroundColor: string;
  bottomBarColor?: string;
};

/**
 * Hook to dynamically update StatusBar and bottom navigation bar
 * based on the screen's background color
 */
export function useDynamicStatusBar({
  backgroundColor,
  bottomBarColor,
}: UseDynamicStatusBarOptions) {
  const {setStatusBarConfig} = useStatusBar();

  useFocusEffect(
    React.useCallback(() => {
      const barStyle = getBarStyleForBackground(backgroundColor);
      const bottomColor = bottomBarColor || backgroundColor;

      setStatusBarConfig({
        backgroundColor,
        barStyle,
        bottomBarColor: bottomColor,
      });
    }, [backgroundColor, bottomBarColor, setStatusBarConfig]),
  );
}

