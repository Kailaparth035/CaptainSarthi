import React, {useEffect, useState} from 'react';
import {Dimensions, Platform, StatusBar} from 'react-native';

const useDeviceDimensions = () => {
  const {width, height} = Dimensions.get('window');
  const [deviceWidth, setDeviceWidth] = useState(width);
  const [deviceHeight, setDeviceHeight] = useState(height);

  useEffect(() => {
    const onChange = ({window}) => {
      setDeviceWidth(window.width);
      setDeviceHeight(window.height);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      subscription?.remove();
    };
  }, []);

  return {deviceWidth, deviceHeight};
};

const X_WIDTH = 360;
const X_HEIGHT = 800;

const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;

const guidelineBaseWidth = 360;
const guidelineBaseHeight = 800;

const useDeviceMetrics = () => {
  const {deviceWidth, deviceHeight} = useDeviceDimensions();

  const sliderWidth = deviceWidth - 20;
  const itemWidth = deviceWidth - 20;

  const isIPhoneX = () =>
    Platform.OS === 'ios' && !Platform.isPad && !Platform.isTVOS
      ? (deviceWidth === X_WIDTH && deviceHeight === X_HEIGHT) ||
        (deviceWidth === XSMAX_WIDTH && deviceHeight === XSMAX_HEIGHT)
      : false;

  const StatusBarHeight = Platform.select({
    ios: isIPhoneX() ? 44 : 44,
    android: 44,
    default: 0,
  });

  const StatusBarHeightSecond = Platform.select({
    ios: isIPhoneX() ? 44 : 20,
    android: StatusBar.currentHeight,
    default: 0,
  });

  const scale = size => (deviceWidth / guidelineBaseWidth) * size;
  const verticalScale = size => (deviceHeight / guidelineBaseHeight) * size;
  const moderateScale = (size, factor = 0.5) =>
    size + (scale(size) - size) * factor;
  const moderateScaleVertical = (size, factor = 0.5) =>
    size + (verticalScale(size) - size) * factor;
  const moderateScale = percent => {
    const screenHeight = deviceHeight;
    const ratio = deviceHeight / deviceWidth;
    const deviceHeightValue = 375
      ? screenHeight * (ratio > 1.8 ? 0.14 : 0.15)
      : Platform.OS === 'android'
      ? screenHeight - StatusBar.currentHeight
      : screenHeight;

    const heightPercent = (percent * deviceHeightValue) / 100;
    return Math.round(heightPercent);
  };

  return {
    scale,
    verticalScale,
    moderateScale,
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

export {useDeviceMetrics};
