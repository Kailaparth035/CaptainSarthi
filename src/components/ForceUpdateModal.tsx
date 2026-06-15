import React, {useMemo} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
  BackHandler,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useLanguage} from '../contexts/LanguageContext';

type ForceUpdateModalProps = {
  visible: boolean;
  storeUrl: string;
};

export default function ForceUpdateModal({
  visible,
  storeUrl,
}: ForceUpdateModalProps) {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();

  React.useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );

    return () => subscription.remove();
  }, [visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: moderateScale(24),
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        card: {
          width: '100%',
          maxWidth: moderateScale(360),
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(20),
          padding: moderateScale(24),
          alignItems: 'center',
          shadowColor: colors.shadowColor,
          shadowOpacity: 0.2,
          shadowOffset: {width: 0, height: moderateScale(8)},
          shadowRadius: moderateScale(16),
          elevation: 10,
        },
        iconWrap: {
          width: moderateScale(72),
          height: moderateScale(72),
          borderRadius: moderateScale(36),
          backgroundColor: colors.light_orange,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: moderateScale(20),
        },
        title: {
          ...Typography.boldXl,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: moderateScale(12),
        },
        message: {
          ...Typography.regularMd,
          fontSize: moderateScale(15),
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: moderateScale(22),
          marginBottom: moderateScale(28),
        },
        button: {
          width: '100%',
          backgroundColor: colors.primary,
          borderRadius: moderateScale(30),
          paddingVertical: moderateScale(14),
          alignItems: 'center',
          justifyContent: 'center',
        },
        buttonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textWhite,
        },
      }),
    [insets.bottom, insets.top, moderateScale],
  );

  const handleUpdatePress = async () => {
    const urls =
      Platform.OS === 'android'
        ? [
            'market://details?id=com.captainsaathi.farmerapp',
            storeUrl,
          ]
        : [storeUrl];

    for (const url of urls) {
      try {
        await Linking.openURL(url);
        return;
      } catch (error) {
        console.warn('[ForceUpdateModal] Failed to open store URL:', url, error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="cloud-download-outline"
              size={moderateScale(36)}
              color={colors.primary}
            />
          </View>

          <Text style={styles.title}>{t('appUpdate.title')}</Text>
          <Text style={styles.message}>{t('appUpdate.message')}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleUpdatePress}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>{t('appUpdate.updateNow')}</Text>
          </TouchableOpacity>

          {Platform.OS === 'android' ? (
            <Text
              style={[
                styles.message,
                {marginTop: moderateScale(16), marginBottom: 0},
              ]}>
              {t('appUpdate.restartHint')}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
