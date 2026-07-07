import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  InteractionManager,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useLanguage} from '../contexts/LanguageContext';

type ImagePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => Promise<void>;
  onGalleryPress: () => Promise<void>;
  onDocumentPress?: () => Promise<void>;
};

const IOS_PICKER_LAUNCH_DELAY_MS = 400;

export default function ImagePickerModal({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
  onDocumentPress,
}: ImagePickerModalProps) {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();

  // Keep mounted until iOS finishes dismissing; otherwise native picker opens behind a ghost modal.
  const [awaitingDismiss, setAwaitingDismiss] = useState(false);
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null);

  const runPendingAction = () => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setAwaitingDismiss(false);

    if (!action) {
      return;
    }

    const launch = () => {
      action().catch(error => {
        console.error('Error opening picker:', error);
      });
    };

    if (Platform.OS === 'ios') {
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(() => {
          setTimeout(launch, IOS_PICKER_LAUNCH_DELAY_MS);
        });
      });
      return;
    }

    setTimeout(launch, 300);
  };

  const selectAction = (action: () => Promise<void>) => {
    pendingActionRef.current = action;
    setAwaitingDismiss(true);
    onClose();
    if (Platform.OS !== 'ios') {
      setTimeout(runPendingAction, 300);
    }
  };

  const handleDismiss = () => {
    if (Platform.OS === 'ios') {
      runPendingAction();
    }
  };

  const handleCancel = () => {
    pendingActionRef.current = null;
    setAwaitingDismiss(false);
    onClose();
  };

  if (!visible && !awaitingDismiss) {
    return null;
  }

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
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onDismiss={Platform.OS === 'ios' ? handleDismiss : undefined}
      onRequestClose={handleCancel}>
      <Pressable style={styles.modalOverlay} onPress={handleCancel}>
        <Pressable
          style={styles.modalContainer}
          onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>{t('imagePicker.selectImageSource')}</Text>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => selectAction(onCameraPress)}
            activeOpacity={0.7}>
            <Ionicons
              name="camera"
              size={moderateScale(24)}
              color={colors.primary}
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>{t('imagePicker.camera')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => selectAction(onGalleryPress)}
            activeOpacity={0.7}>
            <Ionicons
              name="images"
              size={moderateScale(24)}
              color={colors.primary}
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>{t('imagePicker.gallery')}</Text>
          </TouchableOpacity>

          {onDocumentPress && (
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => selectAction(onDocumentPress)}
              activeOpacity={0.7}>
              <Ionicons
                name="document-text"
                size={moderateScale(24)}
                color={colors.primary}
                style={styles.optionIcon}
              />
              <Text style={styles.optionText}>Document</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.7}>
            <Text style={styles.cancelButtonText}>{t('imagePicker.cancel')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
