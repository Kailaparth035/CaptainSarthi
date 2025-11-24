import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SCREEN_NAMES } from '../../constants/screenNames';
import { STRINGS } from '../../constants/strings';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  spacing,
  fontSize,
  FontSize,
  Spacing,
  BorderRadius,
} from '../../utils/responsive';
import {Typography} from '../../utils/typography';

type IconProps = { focused: boolean; color: string; size: number };

function getIconForRoute(
  routeName: string,
  { focused, color, size }: IconProps,
): React.ReactNode {
  switch (routeName) {
    case SCREEN_NAMES.Home:
      return (
        <Ionicons
          name={focused ? 'home-sharp' : 'home-outline'}
          size={size}
          color={color}
        />
      );
    case SCREEN_NAMES.Farmer:
      return (
        <Ionicons
          name={focused ? 'people' : 'people-outline'}
          size={size}
          color={color}
        />
      );
    case SCREEN_NAMES.Tractors:
      return (
        <MaterialCommunityIcons name="tractor" size={size + 2} color={color} />
      );
    case SCREEN_NAMES.Profile:
      return (
        <Ionicons
          name={focused ? 'person' : 'person-outline'}
          size={size}
          color={color}
        />
      );
    default:
      return <Ionicons name="ellipse" size={size} color={color} />;
  }
}

export default function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const accent = '#F59E0B'; // orange accent like mock
  const activeColor = accent;
  const inactiveColor = '#94a3b8';
  const pillBg = '#FFF1D6';
  const containerBg = '#ffffff';
  const border = '#e2e8f0';

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
          backgroundColor: containerBg,
          borderTopColor: border,
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
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

          const label =
            STRINGS.tabs[route.name as keyof (typeof STRINGS)['tabs']] ??
            route.name;

          const color = isFocused ? activeColor : inactiveColor;
          const icon = getIconForRoute(route.name, {
            focused: isFocused,
            color,
            size: fontSize(22),
          });

          // Active tab shows pill with label; others show icon-only
          const isPill = isFocused;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={
                descriptors[route.key].options.tabBarAccessibilityLabel
              }
              testID={descriptors[route.key].options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.item]}
            >
              {isPill ? (
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isFocused ? pillBg : '#f1f5f9',
                      shadowColor: '#000',
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: isFocused ? 2 : 0,
                    },
                  ]}
                >
                  <View style={styles.iconWithGap}>{icon}</View>
                  <Text style={[styles.pillLabel, { color }]}>{label}</Text>
                </View>
              ) : (
                <View style={styles.iconOnly}>{icon}</View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: spacing(10),
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: spacing(36),
    borderRadius: BorderRadius.round,
    alignSelf: 'center',
  },
  iconWithGap: {
    marginRight: Spacing.sm,
  },
  pillLabel: {
    ...Typography.semiBoldMd,
  },
  iconOnly: {
    height: spacing(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
