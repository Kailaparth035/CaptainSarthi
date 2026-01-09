import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useTTS} from '../contexts/TTSContext';

export default function TTSPlayer() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {state, stopTTS, pauseTTS, resumeTTS} = useTTS();

  if (!state.isPlaying && state.progress === 0) {
    return null;
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: moderateScale(70) + insets.bottom, // Position above bottom navigation
      left: moderateScale(16),
      right: moderateScale(16),
      backgroundColor: colors.light_orange,
      paddingTop: moderateScale(12),
      paddingBottom: moderateScale(12),
      paddingHorizontal: moderateScale(16),
      borderRadius: moderateScale(12),
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: -2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    },
    playerBar: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      width: moderateScale(36),
      height: moderateScale(36),
      borderRadius: moderateScale(18),
      backgroundColor: colors.backgroundWhite,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: moderateScale(12),
    },
    progressBarContainer: {
      flex: 1,
      height: moderateScale(4),
      backgroundColor: colors.backgroundWhite,
      borderRadius: moderateScale(2),
      overflow: 'hidden',
      marginRight: moderateScale(12),
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      width: `${state.progress}%`,
    },
    timeText: {
      ...Typography.regularSm,
      fontSize: moderateScale(12),
      color: colors.textPrimary,
      marginRight: moderateScale(8),
    },
    closeButton: {
      width: moderateScale(24),
      height: moderateScale(24),
      borderRadius: moderateScale(12),
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.playerBar}>
        <TouchableOpacity
          style={dynamicStyles.iconButton}
          onPress={state.isPlaying ? pauseTTS : resumeTTS}
          activeOpacity={0.7}>
          <Ionicons
            name={state.isPlaying ? 'pause' : 'play'}
            size={moderateScale(18)}
            color={colors.primary}
          />
        </TouchableOpacity>

        <View style={dynamicStyles.progressBarContainer}>
          <View style={dynamicStyles.progressBar} />
        </View>

        {state.duration > 0 && (
          <Text style={dynamicStyles.timeText}>
            {formatTime(state.currentPosition)} / {formatTime(state.duration)}
          </Text>
        )}

        <TouchableOpacity
          style={dynamicStyles.closeButton}
          onPress={stopTTS}
          activeOpacity={0.7}>
          <Ionicons
            name="close"
            size={moderateScale(14)}
            color={colors.textWhite}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

