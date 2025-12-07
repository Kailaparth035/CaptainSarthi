import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(20),
          paddingBottom: moderateScale(100),
        },
        title: {
          ...Typography.boldXxl,
          fontSize: moderateScale(24),
          color: colors.textPrimary,
          marginBottom: moderateScale(24),
        },
        card: {
          backgroundColor: colors.white,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: colors.shadowColor,
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        },
        iconContainer: {
          width: moderateScale(48),
          height: moderateScale(48),
          borderRadius: moderateScale(24),
          backgroundColor: colors.light_blue,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        contentContainer: {
          flex: 1,
        },
        historyTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        historyDescription: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textSecondary,
        },
        timeText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
          marginTop: moderateScale(4),
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: moderateScale(100),
        },
        emptyText: {
          ...Typography.regularMd,
          fontSize: moderateScale(16),
          color: colors.textTertiary,
          textAlign: 'center',
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <View style={dynamicStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}>
        <Text style={dynamicStyles.title}>History</Text>

        <View style={dynamicStyles.emptyContainer}>
          <Text style={dynamicStyles.emptyText}>History Screen</Text>
        </View>
      </ScrollView>
    </View>
  );
}

