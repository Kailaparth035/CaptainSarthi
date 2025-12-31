import React from 'react';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import {SCREEN_NAMES} from '../../constants/screenNames';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Typography} from '../../utils/typography';
import {useStatusBar} from '../../contexts/StatusBarContext';
import colors from '../../utils/colors';
import useDeviceMetrics from '../../utils/responsiveCustom';
import {useLanguage} from '../../contexts/LanguageContext';
import {ImagePath} from '../../assets/images';

type IconProps = {focused: boolean; color: string; size: number};

function getIconForRoute(
  routeName: string,
  {focused, color, size}: IconProps,
): React.ReactNode {
  const iconSize = size;
  
  switch (routeName) {
    case SCREEN_NAMES.Home:
      return (
        <Image
          source={focused ? ImagePath.homeSelected : ImagePath.home}
          style={{width: iconSize, height: iconSize}}
          resizeMode="contain"
        />
      );
    case SCREEN_NAMES.Events:
      return (
        <Image
          source={focused ? ImagePath.eventSelected : ImagePath.eventsTab}
          style={{width: iconSize, height: iconSize}}
          resizeMode="contain"
        />
      );
    case SCREEN_NAMES.History:
      return (
        <Image
          source={focused ? ImagePath.storySelected : ImagePath.story}
          style={{width: iconSize, height: iconSize}}
          resizeMode="contain"
        />
      );
    case SCREEN_NAMES.Stories:
      return (
        <Image
          source={focused ? ImagePath.storySelected : ImagePath.story}
          style={{width: iconSize, height: iconSize}}
          resizeMode="contain"
        />
      );
    case SCREEN_NAMES.Tractors:
      return (
        <Image
          source={focused ? ImagePath.tractorSelected : ImagePath.tractorTab}
          style={{width: iconSize, height: iconSize}}
          resizeMode="contain"
        />
      );
    case SCREEN_NAMES.Profile:
      return (
        <Image
          source={focused ? ImagePath.profileSelected : ImagePath.profile}
          style={{width: iconSize, height: iconSize}}
          resizeMode="contain"
        />
      );
    default:
      return (
        <Image
          source={ImagePath.home}
          style={{width: iconSize, height: iconSize}}
          resizeMode="contain"
        />
      );
  }
}

// getLabelForRoute will be moved inside component to use translations

export default function FarmerBottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const {moderateScale} = useDeviceMetrics();
  const {currentConfig} = useStatusBar();
  const {t} = useLanguage();
  const insets = useSafeAreaInsets();
  const activeColor = colors.primary; // Orange
  const inactiveColor = '#94a3b8'; // Grey
  const containerBg = colors.backgroundWhite;

  const getLabelForRoute = (routeName: string): string => {
    switch (routeName) {
      case SCREEN_NAMES.Home:
        return t('tabs.Home');
      case SCREEN_NAMES.Events:
        return t('tabs.Events');
      case SCREEN_NAMES.History:
        return t('tabs.History');
      case SCREEN_NAMES.Stories:
        return t('tabs.Stories');
      case SCREEN_NAMES.Tractors:
        return t('tabs.Tractors');
      case SCREEN_NAMES.Profile:
        return t('tabs.Profile');
      default:
        return routeName;
    }
  };

  const styles = StyleSheet.create({
    wrapper: {
      borderTopWidth: 1,
    },
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: moderateScale(4),
      paddingVertical: moderateScale(15),      
    },
    item: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemInactive: {
      minWidth: moderateScale(36),
      marginHorizontal: moderateScale(4),
    },
    itemActive: {
      marginHorizontal: moderateScale(4),
    },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  iconWithGap: {
    marginHorizontal: moderateScale(5),
  },
  pillLabel: {
    ...Typography.mediumSm,
    marginTop:moderateScale(2),
    fontSize: moderateScale(12),
  },
  iconOnly: {
    alignItems: 'center',
    justifyContent: 'center',    
  },
});

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: containerBg,
          borderTopColor: '#e2e8f0',
          paddingBottom: insets.bottom,
        },
      ]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const {options} = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const label = getLabelForRoute(route.name);
          const color = isFocused ? activeColor : inactiveColor;
          const icon = getIconForRoute(route.name, {
            focused: isFocused,
            color,
            size: moderateScale(16),
          });

           const iconOnly = getIconForRoute(route.name, {
            focused: isFocused,
            color,
            size: moderateScale(20),
          });

          // Active tab shows pill with label; others show icon-only
          const isPill = isFocused;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.item, isFocused ? styles.itemActive : styles.itemInactive]}>
              {isPill ? (
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isFocused ? '#FFF6EA' : '#f1f5f9',                    
                    },
                  ]}>
                  <View style={styles.iconWithGap}>{icon}</View>
                  <Text style={[styles.pillLabel, {color}]}>{label}</Text>
                </View>
              ) : (
                <View style={styles.iconOnly}>{iconOnly}</View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}


