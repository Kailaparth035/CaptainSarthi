import React, {useMemo} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';

type LogoutModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function LogoutModal({
  visible,
  onClose,
  onConfirm,
}: LogoutModalProps) {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modal: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalContent: {
          width: '85%',
          maxWidth: moderateScale(400),
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(16),
          padding: moderateScale(20),
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
          borderColor: colors.primary,
        },
        confirmButton: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
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
    [moderateScale],
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Log out</Text>
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
            Are you sure you want to log out ?
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.7}>
              <Text style={styles.confirmButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
