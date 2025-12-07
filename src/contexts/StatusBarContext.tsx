import React, {createContext, useContext, useState, ReactNode} from 'react';
import colors from '../utils/colors';

type StatusBarConfig = {
  backgroundColor: string;
  barStyle: 'light-content' | 'dark-content';
  bottomBarColor?: string;
};

type StatusBarContextType = {
  setStatusBarConfig: (config: StatusBarConfig) => void;
  currentConfig: StatusBarConfig;
};

const StatusBarContext = createContext<StatusBarContextType | undefined>(
  undefined,
);

const defaultConfig: StatusBarConfig = {
  backgroundColor: colors.backgroundLight,
  barStyle: 'dark-content',
  bottomBarColor: colors.backgroundWhite,
};

export function StatusBarProvider({children}: {children: ReactNode}) {
  const [config, setConfig] = useState<StatusBarConfig>(defaultConfig);

  const setStatusBarConfig = React.useCallback((newConfig: StatusBarConfig) => {
    setConfig(prevConfig => {
      // Only update if config actually changed
      if (
        prevConfig.backgroundColor === newConfig.backgroundColor &&
        prevConfig.barStyle === newConfig.barStyle &&
        prevConfig.bottomBarColor === newConfig.bottomBarColor
      ) {
        return prevConfig;
      }

      return newConfig;
    });
  }, []);

  return (
    <StatusBarContext.Provider value={{setStatusBarConfig, currentConfig: config}}>
      {children}
    </StatusBarContext.Provider>
  );
}

export function useStatusBar() {
  const context = useContext(StatusBarContext);
  if (!context) {
    throw new Error('useStatusBar must be used within StatusBarProvider');
  }
  return context;
}

// Helper function to determine bar style based on background color
export function getBarStyleForBackground(backgroundColor: string): 'light-content' | 'dark-content' {
  const lightColors = [
    colors.backgroundWhite,
    colors.backgroundLight,
    colors.backgroundGray,
    '#ffffff',
    '#FFFFFF',
    '#f1f5f9',
    '#F1F5F9',
    '#f8fafc',
    '#F8FAFC',
  ];
  
  const normalizedColor = backgroundColor.trim();
  return lightColors.includes(normalizedColor) 
    ? 'dark-content' 
    : 'light-content';
}

