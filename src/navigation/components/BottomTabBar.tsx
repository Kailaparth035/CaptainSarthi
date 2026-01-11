import React, { useRef } from "react";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { SCREEN_NAMES } from "../../constants/screenNames";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  spacing,
  fontSize,
  FontSize,
  Spacing,
  BorderRadius,
} from "../../utils/responsive";
import { Typography } from "../../utils/typography";
import { useStatusBar } from "../../contexts/StatusBarContext";
import colors from "../../utils/colors";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../RootNavigator";
import { TabParamList } from "../TabNavigator";
import useDeviceMetrics from "../../utils/responsiveCustom";

type IconProps = { focused: boolean; color: string; size: number };

function getIconForRoute(
  routeName: string,
  { focused, color, size }: IconProps
): React.ReactNode {
  switch (routeName) {
    case SCREEN_NAMES.Home:
      return (
        <Ionicons
          name={focused ? "home-sharp" : "home-outline"}
          size={size}
          color={color}
        />
      );
    case SCREEN_NAMES.Farmer:
      return (
        <Ionicons
          name={focused ? "people" : "people-outline"}
          size={size}
          color={color}
        />
      );
    case SCREEN_NAMES.Tractors:
      return (
        <MaterialCommunityIcons
          name="tractor"
          size={size + 2}
          color={color}
          style={{ marginLeft: focused ? 15 : 0 }}
        />
      );
    case SCREEN_NAMES.Profile:
      return (
        <Ionicons
          name={focused ? "person" : "person-outline"}
          size={size}
          color={color}
        />
      );
    default:
      return <Ionicons name="ellipse" size={size} color={color} />;
  }
}

type BottomTabBarComponentProps = BottomTabBarProps & {
  currentScreen?: string;
  isStandalone?: boolean;
};

export default function BottomTabBar({
  state,
  descriptors,
  navigation,
  currentScreen,
  isStandalone = false,
}: BottomTabBarComponentProps) {
  const insets = useSafeAreaInsets();
  const { currentConfig } = useStatusBar();
  const { moderateScale } = useDeviceMetrics();
  const { t } = useLanguage();
  const rootNavigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lastTapRef = useRef<{ route: string; timestamp: number } | null>(null);
  const accent = "#F59E0B"; // orange accent like mock
  const activeColor = accent;
  const inactiveColor = "#94a3b8";
  const pillBg = "#FFF1D6";
  // Use dynamic bottom bar color from context, fallback to white
  const containerBg = colors.backgroundWhite;
  const border = "#e2e8f0";

  const tabs = [
    SCREEN_NAMES.Home,
    SCREEN_NAMES.Farmer,
    SCREEN_NAMES.Tractors,
    SCREEN_NAMES.Profile,
  ];

  // For standalone mode, determine focused tab based on current screen
  const getFocusedTabForStandalone = () => {
    if (!currentScreen) return SCREEN_NAMES.Home;
    if (currentScreen === SCREEN_NAMES.TractorDetails)
      return SCREEN_NAMES.Tractors;
    if (
      currentScreen === SCREEN_NAMES.FarmerDetails ||
      currentScreen === SCREEN_NAMES.AddFarmer
    )
      return SCREEN_NAMES.Farmer;
    if (currentScreen === SCREEN_NAMES.ProfileDetails)
      return SCREEN_NAMES.Profile;
    if (currentScreen === SCREEN_NAMES.Notifications) return SCREEN_NAMES.Home;
    if (tabs.includes(currentScreen as any)) return currentScreen;
    return SCREEN_NAMES.Home;
  };

  const handleStandaloneTabPress = (routeName: string) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 500;

    // Check for double tap
    if (
      lastTapRef.current &&
      lastTapRef.current.route === routeName &&
      now - lastTapRef.current.timestamp < DOUBLE_TAP_DELAY
    ) {
      // Double tap - navigate to main tab screen
      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: SCREEN_NAMES.MainTabs,
              state: {
                routes: [{ name: routeName as keyof TabParamList }],
                index: 0,
              },
            },
          ],
        })
      );
      lastTapRef.current = null;
      return;
    }

    // Store tap
    lastTapRef.current = { route: routeName, timestamp: now };

    // Single tap - navigate to tab
    rootNavigation.dispatch(
      CommonActions.navigate({
        name: SCREEN_NAMES.MainTabs,
        params: { screen: routeName as keyof TabParamList },
      })
    );
  };

  const styles = StyleSheet.create({
    wrapper: {
      borderTopWidth: 1,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: moderateScale(16),
      paddingTop: moderateScale(12),
      paddingBottom: moderateScale(12),
    },
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: moderateScale(16),
      paddingTop: moderateScale(12),
      paddingBottom: moderateScale(20),
    },
    item: {
      alignItems: "center",
      justifyContent: "center",
    },
    itemInactive: {
      minWidth: moderateScale(36),
      marginHorizontal: moderateScale(4),
    },
    itemActive: {
      marginHorizontal: moderateScale(4),
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateScale(8),
      borderRadius: moderateScale(20),
    },
    iconWithGap: {
      marginRight: moderateScale(8),
    },
    pillLabel: {
      ...Typography.semiBoldMd,
    },
    iconOnly: {
      height: spacing(36),
      alignItems: "center",
      justifyContent: "center",
    },
  });

  // For standalone mode, render tabs without tab navigator state
  if (isStandalone) {
    const focusedTab = getFocusedTabForStandalone();
    return (
      <View
        style={[
          styles.wrapper,
          styles.standaloneWrapper,
          {
            paddingBottom: insets.bottom,
            backgroundColor: containerBg,
            borderTopColor: border,
          },
        ]}
      >
        <View style={styles.row}>
          {tabs.map((routeName) => {
            const isFocused = focusedTab === routeName;
            const label = t(`tabs.${routeName}`) ?? routeName;

            const color = isFocused ? activeColor : inactiveColor;
            // const icon = getIconForRoute(routeName, {
            //   focused: isFocused,
            //   color,
            //   size: moderateScale(22),
            // });

            const icon = getIconForRoute(routeName, {
              focused: isFocused,
              color,
              size: moderateScale(22),
            });

            const iconOnly = getIconForRoute(routeName, {
              focused: isFocused,
              color,
              size: moderateScale(24),
            });

            const isPill = isFocused;

            return (
              <TouchableOpacity
                key={routeName}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={() => handleStandaloneTabPress(routeName)}
                style={[styles.item]}
              >
                {isPill ? (
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor: isFocused ? "#FFF6EA" : "#f1f5f9",
                      },
                    ]}
                  >
                    <View style={styles.iconWithGap}>{icon}</View>
                    <Text style={[styles.pillLabel, { color }]}>{label}</Text>
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

  // Normal tab navigator mode
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
            const now = Date.now();
            const DOUBLE_TAP_DELAY = 500;

            // Check for double tap on the same tab
            if (
              isFocused &&
              lastTapRef.current &&
              lastTapRef.current.route === route.name &&
              now - lastTapRef.current.timestamp < DOUBLE_TAP_DELAY
            ) {
              // Double tap detected - pop to root of the current stack
              const currentRoute = state.routes[state.index];
              const stackState = currentRoute?.state as any;

              if (stackState && stackState.index > 0) {
                // If we're not at the root, navigate to root screen
                // This will pop the stack to root
                const rootScreenName = stackState.routes[0]?.name;
                if (rootScreenName) {
                  navigation.navigate(route.name, {
                    screen: rootScreenName,
                  } as any);
                }
              }
              lastTapRef.current = null;
              return;
            }

            // Store this tap
            if (isFocused) {
              lastTapRef.current = {
                route: route.name,
                timestamp: now,
              };
            }

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              // When switching tabs, check if target tab has nested screens
              const targetRoute = state.routes.find(
                (r: any) => r.name === route.name
              );
              const targetStackState = targetRoute?.state as any;

              // If target tab has nested screens (index > 0), reset to root
              if (
                targetStackState &&
                targetStackState.index > 0 &&
                targetStackState.routes &&
                targetStackState.routes.length > 0
              ) {
                // Get the root screen name from the stack (first route in stack)
                const rootScreenName = targetStackState.routes[0]?.name;
                if (rootScreenName) {
                  // Navigate to root screen of the target tab to reset stack
                  navigation.navigate(route.name, {
                    screen: rootScreenName,
                  } as any);
                } else {
                  // Fallback: just navigate to tab
                  navigation.navigate(route.name);
                }
              } else {
                // No nested screens or already at root, navigate normally
                navigation.navigate(route.name);
              }
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const label = t(`tabs.${route.name}`) ?? route.name;

          const color = isFocused ? activeColor : inactiveColor;
          const icon = getIconForRoute(route.name, {
            focused: isFocused,
            color,
            size: moderateScale(22),
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
              testID={(descriptors[route.key].options as any).tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.item]}
            >
              {isPill ? (
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isFocused ? "#FFF6EA" : "#f1f5f9",
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

