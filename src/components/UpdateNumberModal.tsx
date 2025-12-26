import React, {useMemo, useState} from 'react';
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
import FloatingInput from './FloatingInput';

type UpdateNumberModalProps = {
  visible: boolean;
  onClose: () => void;
  existingNumber: string;
  onSendRequest: (newNumber: string) => void;
};

export default function UpdateNumberModal({
  visible,
  onClose,
  existingNumber,
  onSendRequest,
}: UpdateNumberModalProps) {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const [newNumber, setNewNumber] = useState('');
  const [error, setError] = useState('');

  const handleNumberChange = (text: string) => {
    // Only allow numeric characters, same as login screen
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Limit to 10 digits
    if (numericText.length <= 10) {
      setNewNumber(numericText);
      setError('');
    }
  };

  // Validation function matching login screen exactly
  const isValidNewNumber = () => {
    const trimmed = newNumber.trim();
    return trimmed.length === 10 && /^\d+$/.test(trimmed);
  };

  const handleSendRequest = () => {
    // Validate that new number is exactly 10 digits (same as login screen validation)
    if (!newNumber.trim()) {
      setError('Please enter mobile number');
      return;
    }
    
    if (newNumber.trim().length !== 10) {
      setError('Please enter a valid mobile number');
      return;
    }

    // Check if new number is different from existing number
    const existingDigits = existingNumber.replace(/\D/g, '');
    if (newNumber === existingDigits) {
      setError('New number must be different from existing number');
      return;
    }

    // Send the 10-digit number (no formatting, same as login)
    onSendRequest(newNumber.trim());
    setNewNumber('');
    setError('');
  };

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
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
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
        description: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
          marginBottom: moderateScale(24),
          lineHeight: moderateScale(20),
        },
        inputContainer: {
          marginBottom: moderateScale(16),
        },
        sendButton: {
          backgroundColor: colors.primary,
          borderRadius: moderateScale(20),
          paddingVertical: moderateScale(14),
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: moderateScale(8),
        },
        sendButtonDisabled: {
          opacity: 0.6,
        },
        sendButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textWhite,
        },
        errorText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.statusError,
          marginTop: moderateScale(-10),
          marginBottom: moderateScale(8),
          marginLeft: moderateScale(4),
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
      <Pressable style={styles.modal} onPress={onClose} activeOpacity={1}>
        <Pressable
          style={styles.modalContent}
          onPress={e => e.stopPropagation()}
          activeOpacity={1}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Update number</Text>
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

          {/* Description */}
          <Text style={styles.description}>
            A request will be sent to the dealer to update the number. The dealer
            may contact you for OTP verification.
          </Text>

          {/* Existing Number Input */}
          <View style={styles.inputContainer}>
            <FloatingInput
              label="Existing number"
              value={existingNumber.replace(/\D/g, '')}
              onChangeText={() => {}}
              editable={false}
              keyboardType="phone-pad"
              numberOfLinesLabel={1}
            />
          </View>

          {/* New Number Input */}
          <View style={styles.inputContainer}>
            <FloatingInput
              label="New number"
              value={newNumber}
              onChangeText={handleNumberChange}
              placeholder="Enter mobile number"
              keyboardType="number-pad"
              maxLength={10}
              numberOfLinesLabel={1}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Send Request Button - Always visible, disabled when invalid (like login screen) */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              !isValidNewNumber() && styles.sendButtonDisabled,
            ]}
            onPress={handleSendRequest}
            activeOpacity={0.8}
            disabled={!isValidNewNumber()}>
            <Text style={styles.sendButtonText}>Send request</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

