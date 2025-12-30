import React, {useMemo, useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import FloatingInput from './FloatingInput';
import {postData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import Toast, {ToastType} from './Toast';

type UpdateNumberModalProps = {
  visible: boolean;
  onClose: () => void;
  existingNumber: string;
  onSendRequest?: (newNumber: string) => void;
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
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // Debug: Log when visible prop changes
  useEffect(() => {
    console.log('[UpdateNumberModal] Visible prop changed:', visible);
    console.log('[UpdateNumberModal] Existing number:', existingNumber);
    
    // Reset form when modal opens
    if (visible) {
      setNewNumber('');
      setError('');
      setShowToast(false);
    }
  }, [visible, existingNumber]);

  const handleNumberChange = useCallback((text: string) => {
    // Only allow numeric characters, same as login screen
    const numericText = text.replace(/[^0-9]/g, '');
    
    // Limit to 10 digits
    if (numericText.length <= 10) {
      setNewNumber(numericText);
      setError('');
    }
  }, []);

  // Validation function matching login screen exactly - memoized
  const isValidNewNumber = useMemo(() => {
    const trimmed = newNumber.trim();
    return trimmed.length === 10 && /^\d+$/.test(trimmed);
  }, [newNumber]);

  const showToastMessage = (message: string, type: ToastType = 'success') => {
    console.log('[UpdateNumberModal] showToastMessage called:', {message, type});
    // Set message and type first
    setToastMessage(message);
    setToastType(type);
    // Then show toast - use setTimeout to ensure state updates properly
    setTimeout(() => {
      setShowToast(true);
      console.log('[UpdateNumberModal] Toast state set to visible:', message);
    }, 50);
  };

  const hideToast = () => {
    setShowToast(false);
  };

  const handleSendRequest = async () => {
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
    const existingDigits = (existingNumber || '').replace(/\D/g, '');
    if (newNumber === existingDigits) {
      setError('New number must be different from existing number');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare request body
      const requestBody = {
        previous_number: existingDigits,
        new_number: newNumber.trim(),
      };

      // Make API call
      console.log('[UpdateNumberModal] Calling API with:', requestBody);
      const response = await postData(Apis.FARMER_MOBILE_UPDATE, requestBody);
      console.log('[UpdateNumberModal] API Response:', response);

      if (response?.status === true) {
        // Show success message
        const successMessage = response?.message || 'Mobile number update request submitted successfully. Waiting for Admin approval.';
        console.log('[UpdateNumberModal] Showing success toast:', successMessage);
        showToastMessage(successMessage, 'success');
        
        // Call the callback if provided
        if (onSendRequest) {
          onSendRequest(newNumber.trim());
        }
        
        // Reset form and close modal after a short delay
        setTimeout(() => {
          setNewNumber('');
          setError('');
          onClose();
        }, 2000); // Increased delay to ensure toast is visible
      } else {
        // Show error message from API
        const errorMessage = response?.message || 'Failed to submit mobile number update request. Please try again.';
        console.log('[UpdateNumberModal] Showing error toast:', errorMessage);
        showToastMessage(errorMessage, 'error');
      }
    } catch (error: any) {
      console.error('[UpdateNumberModal] Mobile update error:', error);
      // Show error message
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit mobile number update request. Please try again.';
      console.log('[UpdateNumberModal] Showing error toast:', errorMessage);
      showToastMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modal: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        modalOverlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        modalContent: {
          width: '100%',
          backgroundColor: colors.backgroundWhite,
          borderTopLeftRadius: moderateScale(20),
          borderTopRightRadius: moderateScale(20),
          maxHeight: '90%',
          shadowColor: colors.shadowColor,
          shadowOpacity: 0.25,
          shadowOffset: {width: 0, height: moderateScale(-4)},
          shadowRadius: moderateScale(10),
          elevation: 8,
        },
        scrollContent: {
          padding: moderateScale(20),
          paddingBottom: insets.bottom + moderateScale(80), // Extra padding for keyboard
          flexGrow: 1,
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
      <View style={styles.modal}>
        {/* Toast Notification - Rendered at top level for proper z-index */}
        <Toast
          visible={showToast}
          message={toastMessage}
          type={toastType}
          duration={3000}
          onClose={hideToast}
        />
        
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
          <Pressable style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
            <Pressable
              style={styles.modalContent}
              onPress={e => e.stopPropagation()}
              activeOpacity={1}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
                nestedScrollEnabled={true}>
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
                    value={(existingNumber || '').replace(/\D/g, '')}
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
                    (!isValidNewNumber || loading) && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendRequest}
                  activeOpacity={0.8}
                  disabled={!isValidNewNumber || loading}>
                  {loading ? (
                    <ActivityIndicator color={colors.textWhite} size="small" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send request</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

