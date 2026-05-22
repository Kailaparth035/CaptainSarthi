import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

interface DeviceDimensions {
  deviceWidth: number;
  deviceHeight: number;
}

const useDeviceDimensions = (): DeviceDimensions => {
  const { width, height } = Dimensions.get('window');
  const [deviceWidth, setDeviceWidth] = useState<number>(width);
  const [deviceHeight, setDeviceHeight] = useState<number>(height);

  useEffect(() => {
    const onChange = ({ window }: { window: ScaledSize }) => {
      setDeviceWidth(window.width);
      setDeviceHeight(window.height);
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    return () => {
      // @ts-ignore - older RN versions return remove()
      subscription?.remove?.();
    };
  }, []);

  return { deviceWidth, deviceHeight };
};

// ---------------- CONSTANTS ----------------

const X_WIDTH = 360;
const X_HEIGHT = 800;

const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;

const PHONE_BASE_WIDTH = 360;
const PHONE_BASE_HEIGHT = 800;

const TABLET_BASE_WIDTH = 768;
const TABLET_BASE_HEIGHT = 1024;

/** Minimum logical width (pt) to treat as tablet on Android */
const ANDROID_TABLET_MIN = 600;

export const isTabletDevice = (
  width?: number,
  height?: number,
): boolean => {
  if (Platform.isPad) {
    return true;
  }
  const w = width ?? Dimensions.get('window').width;
  const h = height ?? Dimensions.get('window').height;
  return Math.min(w, h) >= ANDROID_TABLET_MIN;
};

// ---------------- HOOK: useDeviceMetrics ----------------

export const useDeviceMetrics = () => {
  const { deviceWidth, deviceHeight } = useDeviceDimensions();

  const isTablet = isTabletDevice(deviceWidth, deviceHeight);

  const guidelineBaseWidth = isTablet ? TABLET_BASE_WIDTH : PHONE_BASE_WIDTH;
  const guidelineBaseHeight = isTablet ? TABLET_BASE_HEIGHT : PHONE_BASE_HEIGHT;

  const sliderWidth = deviceWidth - 20;
  const itemWidth = deviceWidth - 20;

  const isIPhoneX = (): boolean =>
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    ((deviceWidth === X_WIDTH && deviceHeight === X_HEIGHT) ||
      (deviceWidth === XSMAX_WIDTH && deviceHeight === XSMAX_HEIGHT));

  const StatusBarHeight = Platform.select<number>({
    ios: isIPhoneX() ? 44 : isTablet ? 24 : 44,
    android: 44,
    default: 0,
  }) as number;

  const StatusBarHeightSecond = Platform.select<number>({
    ios: isIPhoneX() ? 44 : isTablet ? 24 : 20,
    android: 0,
    default: 0,
  }) as number;

  const scale = (size: number): number =>
    (deviceWidth / guidelineBaseWidth) * size;

  const verticalScale = (size: number): number =>
    (deviceHeight / guidelineBaseHeight) * size;

  const defaultModerateFactor = isTablet ? 0.3 : 0.5;

  const moderateScale = (
    size: number,
    factor: number = defaultModerateFactor,
  ): number => size + (scale(size) - size) * factor;

  const moderateScaleVertical = (
    size: number,
    factor: number = defaultModerateFactor,
  ): number => size + (verticalScale(size) - size) * factor;

  return {
    scale,
    verticalScale,
    moderateScale,
    moderateScaleVertical,
    deviceWidth,
    deviceHeight,
    sliderWidth,
    itemWidth,
    StatusBarHeight,
    StatusBarHeightSecond,
    isTablet,
  };
};

export default useDeviceMetrics;
