import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import SimpleBoxInput from './FloatingInput';
import Dropdown from './Dropdown';
import ImagePickerModal from './ImagePickerModal';
import {useImagePicker} from '../hooks/useImagePicker';

// Text Input Question Component
type TextInputQuestionProps = {
  question: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  editable?: boolean;
};

export function TextInputQuestion({
  question,
  value,
  onChangeText,
  placeholder = 'Your answer here',
  error,
  required = false,
  editable = true,
}: TextInputQuestionProps) {
  const {moderateScale} = useDeviceMetrics();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: moderateScale(16),
        },
        questionText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(8),
        },
        requiredAsterisk: {
          color: colors.statusError,
          fontSize: moderateScale(14),
        },
      }),
    [moderateScale],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>
        {question}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <SimpleBoxInput
        label="Answer"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={error}
        required={required}
        numberOfLinesLabel={1}
        editable={editable}
      />
    </View>
  );
}

// Radio Button Question Component (Yes/No)
type RadioButtonQuestionProps = {
  question: string;
  value: string | null;
  onChange: (value: string) => void;
  options?: string[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

export function RadioButtonQuestion({
  question,
  value,
  onChange,
  options = ['Yes', 'No'],
  error,
  required = false,
  disabled = false,
}: RadioButtonQuestionProps) {
  const {moderateScale} = useDeviceMetrics();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: moderateScale(16),
        },
        questionText: {
          ...Typography.boldMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(12),
        },
        requiredAsterisk: {
          color: colors.statusError,
          fontSize: moderateScale(14),
        },
        optionsContainer: {
          flexDirection: 'row',
          gap: moderateScale(12),
        },
        optionButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: moderateScale(14),
          paddingHorizontal: moderateScale(16),
          borderRadius: moderateScale(10),
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.backgroundWhite,
        },
        selectedOptionButton: {
          backgroundColor: colors.light_orange,
          borderColor: colors.primary,
        },
        optionText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
        },
        radioCircle: {
          width: moderateScale(24),
          height: moderateScale(24),
          borderRadius: moderateScale(12),
          borderWidth: 2,
          backgroundColor: colors.backgroundWhite,
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioCircleSelected: {
          borderColor: colors.primary,
          backgroundColor: colors.backgroundWhite,
        },
        radioCircleUnselected: {
          borderColor: colors.borderDefault,
          backgroundColor: colors.backgroundWhite,
        },
        radioInner: {
          width: moderateScale(14),
          height: moderateScale(14),
          borderRadius: moderateScale(7),
          backgroundColor: colors.primary,
        },
        errorText: {
          color: colors.statusError,
          fontSize: moderateScale(12),
          marginTop: moderateScale(8),
          ...Typography.regularSm,
        },
      }),
    [moderateScale],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>
        {question}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <View style={styles.optionsContainer}>
        {options.map(option => {
          const isSelected = value === option;
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                isSelected && styles.selectedOptionButton,
              ]}
              onPress={() => !disabled && onChange(option)}
              activeOpacity={0.7}
              disabled={disabled}>
              <Text style={styles.optionText}>{option}</Text>
              <View
                style={[
                  styles.radioCircle,
                  isSelected
                    ? styles.radioCircleSelected
                    : styles.radioCircleUnselected,
                ]}>
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// Checkbox Question Component (Multiple Options)
type CheckboxQuestionProps = {
  question: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  options: string[];
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

export function CheckboxQuestion({
  question,
  selectedValues,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
}: CheckboxQuestionProps) {
  const {moderateScale} = useDeviceMetrics();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: moderateScale(16),
        },
        questionText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(12),
        },
        requiredAsterisk: {
          color: colors.statusError,
          fontSize: moderateScale(14),
        },
        optionButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: moderateScale(14),
          paddingHorizontal: moderateScale(16),
          borderRadius: moderateScale(10),
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.backgroundWhite,
          marginBottom: moderateScale(8),
        },
        selectedOptionButton: {
          backgroundColor: colors.light_orange,
        },
        optionText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
        },
        checkbox: {
          width: moderateScale(20),
          height: moderateScale(20),
          borderRadius: moderateScale(4),
          borderWidth: 2,
          borderColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        checkboxSelected: {
          backgroundColor: colors.primary,
        },
        checkIcon: {
          color: colors.textWhite,
          fontSize: moderateScale(12),
        },
        errorText: {
          color: 'red',
          fontSize: moderateScale(10),
          marginTop: moderateScale(5),
        },
      }),
    [moderateScale],
  );

  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>
        {question}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      {options.map(option => {
        const isSelected = selectedValues.includes(option);
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              isSelected && styles.selectedOptionButton,
            ]}
            onPress={() => !disabled && handleToggle(option)}
            activeOpacity={0.7}
            disabled={disabled}>
            <Text style={styles.optionText}>{option}</Text>
            <View
              style={[
                styles.checkbox,
                isSelected && styles.checkboxSelected,
              ]}>
              {isSelected && (
                <Ionicons
                  name="checkmark"
                  size={moderateScale(14)}
                  style={styles.checkIcon}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// File Upload Question Component
type FileUploadQuestionProps = {
  question: string;
  onUpload: (imageUri: string) => void;
  uploadedFileName?: string;
  error?: string;
  onError?: (message: string) => void;
  required?: boolean;
};

export function FileUploadQuestion({
  question,
  onUpload,
  uploadedFileName,
  error,
  onError,
  required = false,
}: FileUploadQuestionProps) {
  const {moderateScale} = useDeviceMetrics();
  const {pickImage} = useImagePicker();
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const handleCameraPress = async () => {
    try {
      const imageUri = await pickImage('camera', {
        onError: (message) => {
          if (onError) {
            onError(message);
          }
        },
      });
      if (imageUri) {
        onUpload(imageUri);
      }
    } catch (error) {
      console.error('Error in handleCameraPress:', error);
      if (onError) {
        onError('Failed to open camera. Please try again.');
      }
    }
  };

  const handleGalleryPress = async () => {
    try {
      const imageUri = await pickImage('gallery', {
        onError: (message) => {
          if (onError) {
            onError(message);
          }
        },
      });
      if (imageUri) {
        onUpload(imageUri);
      }
    } catch (error) {
      console.error('Error in handleGalleryPress:', error);
      if (onError) {
        onError('Failed to open gallery. Please try again.');
      }
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: moderateScale(16),
        },
        questionText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(12),
        },
        requiredAsterisk: {
          color: colors.statusError,
          fontSize: moderateScale(14),
        },
        uploadBox: {
          width: '100%',
          minHeight: moderateScale(120),
          borderRadius: moderateScale(10),
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.borderDefault,
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
          padding: moderateScale(20),
        },
        uploadIcon: {
          marginBottom: moderateScale(8),
        },
        uploadText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        hintText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
        },
        fileNameText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.primary,
          marginTop: moderateScale(8),
        },
        errorText: {
          color: 'red',
          fontSize: moderateScale(10),
          marginTop: moderateScale(5),
        },
      }),
    [moderateScale],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>
        {question}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <TouchableOpacity
        style={styles.uploadBox}
        onPress={() => setImagePickerVisible(true)}
        activeOpacity={0.7}>
        <Ionicons
          name="cloud-upload-outline"
          size={moderateScale(32)}
          color={colors.textTertiary}
          style={styles.uploadIcon}
        />
        <Text style={styles.uploadText}>Upload document</Text>
        <Text style={styles.hintText}>Upload png or jpg. 5 mb max size</Text>
        {uploadedFileName && (
          <Text style={styles.fileNameText}>{uploadedFileName}</Text>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <ImagePickerModal
        visible={imagePickerVisible}
        onClose={() => setImagePickerVisible(false)}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
      />
    </View>
  );
}

// Dropdown Question Component
type DropdownQuestionProps = {
  question: string;
  label: string;
  value: string;
  options: {label: string; value: string}[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
};

export function DropdownQuestion({
  question,
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select option',
  error,
  required = false,
  disabled = false,
}: DropdownQuestionProps) {
  const {moderateScale} = useDeviceMetrics();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginBottom: moderateScale(16),
        },
        questionText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          marginBottom: moderateScale(8),
        },
        requiredAsterisk: {
          color: colors.statusError,
          fontSize: moderateScale(14),
        },
      }),
    [moderateScale],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>
        {question}
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </Text>
      <Dropdown
        label={label}
        value={value}
        options={options}
        onSelect={onSelect}
        placeholder={placeholder}
        error={error}
        required={required}
      />
    </View>
  );
}

