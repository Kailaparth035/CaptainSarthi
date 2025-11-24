import React, { useEffect, useState } from 'react';
import { Dimensions, Platform, StatusBar, ScaledSize } from 'react-native';

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

const guidelineBaseWidth = 360;
const guidelineBaseHeight = 800;

// ---------------- HOOK: useDeviceMetrics ----------------

export const useDeviceMetrics = () => {
  const { deviceWidth, deviceHeight } = useDeviceDimensions();

  const sliderWidth = deviceWidth - 20;
  const itemWidth = deviceWidth - 20;

  const isIPhoneX = (): boolean =>
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    ((deviceWidth === X_WIDTH && deviceHeight === X_HEIGHT) ||
      (deviceWidth === XSMAX_WIDTH && deviceHeight === XSMAX_HEIGHT));

  const StatusBarHeight = Platform.select<number>({
    ios: isIPhoneX() ? 44 : 44,
    android: 44,
    default: 0,
  }) as number;

  const StatusBarHeightSecond = Platform.select<number>({
    ios: isIPhoneX() ? 44 : 20,
    android: StatusBar.currentHeight ?? 0,
    default: 0,
  }) as number;

  const scale = (size: number): number =>
    (deviceWidth / guidelineBaseWidth) * size;

  const verticalScale = (size: number): number =>
    (deviceHeight / guidelineBaseHeight) * size;

  const moderateScale = (size: number, factor: number = 0.5): number =>
    size + (scale(size) - size) * factor;

  const moderateScaleVertical = (
    size: number,
    factor: number = 0.5,
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
  };
};

export default useDeviceMetrics;
