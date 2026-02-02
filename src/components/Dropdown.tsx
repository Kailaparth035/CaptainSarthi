import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
  Platform,
  Keyboard,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography, FontFamily} from '../utils/typography';

type DropdownOption = {
  label: string;
  value: string;
};

type DropdownProps = {
  label: string;
  value: string;
  options: DropdownOption[];
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: any;
  required?: boolean;
};

export default function Dropdown({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select option',
  error,
  containerStyle,
  required = false,
}: DropdownProps) {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginVertical: moderateScale(14),
        },
        dropdownWrapper: {
          borderWidth: 1,
          borderRadius: moderateScale(10),
          borderColor: error
            ? 'red'
            : isFocused
            ? colors.primary
            : colors.text_light,
          backgroundColor: colors.white,
          paddingVertical: moderateScale(14),
          paddingHorizontal: moderateScale(15),
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        labelBox: {
          position: 'absolute',
          top: moderateScale(-8),
          left: moderateScale(8),
          backgroundColor: colors.white,
          paddingHorizontal: moderateScale(5),
          zIndex: 10,
        },
        labelText: {
          fontSize: moderateScale(12),
          color: error
            ? 'red'
            : isFocused
            ? colors.primary
            : colors.text_light,
          fontFamily: FontFamily.Medium,
        },
        requiredAsterisk: {
          color: colors.statusError,
          fontSize: moderateScale(12),
          fontFamily: FontFamily.Medium,
        },
        selectedText: {
          fontSize: moderateScale(14),
          color: value ? colors.black : colors.placeholderText,
        },
        placeholderText: {
          fontSize: moderateScale(14),
          color: colors.placeholderText,
        },
        errorText: {
          marginTop: moderateScale(5),
          color: 'red',
          fontSize: moderateScale(10),
        },
        // Modal styles
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
          maxHeight: '70%',
          paddingBottom: insets.bottom + moderateScale(12),
        },
        modalHeader: {
          padding: moderateScale(20),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        modalTitle: {
          ...Typography.boldXl,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
        },
        optionItem: {
          paddingVertical: moderateScale(16),
          paddingHorizontal: moderateScale(20),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        optionText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
        },
        selectedOptionText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.primary,
        },
      }),
    [moderateScale, isFocused, error, value, insets.bottom],
  );

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={styles.dropdownWrapper}
        onPress={() => {
          Keyboard.dismiss();
          // Blur any currently focused TextInput
          try {
            if (TextInput.State && TextInput.State.currentlyFocusedInput) {
              const focusedInput = TextInput.State.currentlyFocusedInput();
              if (focusedInput) {
                TextInput.State.blurTextInput(focusedInput);
              }
            }
          } catch (e) {
            // TextInput.State might not be available in all React Native versions
            // Keyboard.dismiss() should handle it
          }
          setIsOpen(true);
          setIsFocused(true);
        }}
        activeOpacity={0.7}>
        <View style={styles.labelBox}>
          <Text style={styles.labelText}>
            {label}
            {required && <Text style={styles.requiredAsterisk}> *</Text>}
          </Text>
        </View>
        <Text
          style={selectedOption ? styles.selectedText : styles.placeholderText}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={moderateScale(20)}
          color={colors.textTertiary}
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsOpen(false);
          setIsFocused(false);
        }}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setIsOpen(false);
            setIsFocused(false);
          }}
          activeOpacity={1}>
          <Pressable
            style={styles.modalContainer}
            onPress={e => e.stopPropagation()}
            activeOpacity={1}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label}
                {required && <Text style={{color: colors.statusError}}> *</Text>}
              </Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelect(item.value)}
                  activeOpacity={0.7}>
                  <Text
                    style={
                      value === item.value
                        ? styles.selectedOptionText
                        : styles.optionText
                    }>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

