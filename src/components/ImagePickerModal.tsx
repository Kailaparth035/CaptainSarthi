import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';

type ImagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => Promise<void>;
  onGalleryPress: () => Promise<void>;
};

export default function ImagePickerModal({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
}: ImagePickerModalProps) {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: colors.backgroundWhite,
      borderTopLeftRadius: moderateScale(20),
      borderTopRightRadius: moderateScale(20),
      width: '100%',
      padding: moderateScale(20),
      paddingBottom: insets.bottom + moderateScale(12),
      shadowColor: colors.shadowColor,
      shadowOpacity: 0.25,
      shadowOffset: {width: 0, height: moderateScale(-4)},
      shadowRadius: moderateScale(10),
      elevation: 8,
    },
    modalTitle: {
      ...Typography.boldXl,
      fontSize: moderateScale(18),
      color: colors.textPrimary,
      marginBottom: moderateScale(20),
      textAlign: 'center',
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: moderateScale(16),
      paddingHorizontal: moderateScale(16),
      borderRadius: moderateScale(12),
      backgroundColor: colors.backgroundGray,
      marginBottom: moderateScale(12),
    },
    optionIcon: {
      marginRight: moderateScale(16),
    },
    optionText: {
      ...Typography.semiBoldMd,
      fontSize: moderateScale(16),
      color: colors.textPrimary,
    },
    cancelButton: {
      marginTop: moderateScale(8),
      paddingVertical: moderateScale(16),
      borderRadius: moderateScale(12),
      backgroundColor: colors.backgroundGray,
      alignItems: 'center',
    },
    cancelButtonText: {
      ...Typography.semiBoldMd,
      fontSize: moderateScale(16),
      color: colors.textPrimary,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContainer}
          onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Select Image Source</Text>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={async () => {
              onClose();
              // Wait for modal to close before opening camera (300ms delay)
              setTimeout(async () => {
                try {
                  await onCameraPress();
                } catch (error) {
                  console.error('Error opening camera:', error);
                }
              }, 300);
            }}
            activeOpacity={0.7}>
            <Ionicons
              name="camera"
              size={moderateScale(24)}
              color={colors.primary}
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={async () => {
              onClose();
              // Wait for modal to close before opening gallery (300ms delay)
              setTimeout(async () => {
                try {
                  await onGalleryPress();
                } catch (error) {
                  console.error('Error opening gallery:', error);
                }
              }, 300);
            }}
            activeOpacity={0.7}>
            <Ionicons
              name="images"
              size={moderateScale(24)}
              color={colors.primary}
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

