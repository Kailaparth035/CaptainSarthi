import React, {useMemo} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useLanguage} from '../contexts/LanguageContext';

type LogoutModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function LogoutModal({
  visible,
  onClose,
  onConfirm,
  loading = false,
}: LogoutModalProps) {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modal: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        modalContent: {
          width: '100%',
          backgroundColor: colors.backgroundWhite,
          borderTopLeftRadius: moderateScale(20),
          borderTopRightRadius: moderateScale(20),
          padding: moderateScale(20),
          paddingBottom: insets.bottom + moderateScale(12),
          shadowColor: colors.shadowColor,
          shadowOpacity: 0.25,
          shadowOffset: {width: 0, height: moderateScale(-4)},
          shadowRadius: moderateScale(10),
          elevation: 8,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        title: {
          ...Typography.boldXl,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
        },
        closeButton: {
          width: moderateScale(32),
          height: moderateScale(32),
          borderRadius: moderateScale(16),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        message: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(24),
        },
        buttonContainer: {
          flexDirection: 'row',
          gap: moderateScale(12),
        },
        button: {
          flex: 1,
          borderRadius: moderateScale(8),
          paddingVertical: moderateScale(14),
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
        },
        cancelButton: {
          backgroundColor: colors.backgroundWhite,
          borderColor: colors.borderColor,
          borderRadius:moderateScale(30)
        },
        confirmButton: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          borderRadius:moderateScale(30)
        },
        cancelButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.primary,
        },
        confirmButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textWhite,
        },
      }),
    [moderateScale, insets.bottom],
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.logOut')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}>
              <Ionicons
                name="close"
                size={moderateScale(20)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Message */}
          <Text style={styles.message}>
            {t('profile.logOutConfirm')}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.7}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.textWhite} />
              ) : (
                <Text style={styles.confirmButtonText}>{t('profile.yes')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
