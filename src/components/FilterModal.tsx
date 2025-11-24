import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';

type FilterCategory = {
  id: string;
  label: string;
  options: {
    id: string;
    label: string;
    value: string;
  }[];
};

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  title?: string;
  categories?: FilterCategory[];
  selectedCategory?: string;
  selectedOptions?: Record<string, string>;
};

const defaultCategories: FilterCategory[] = [
  {
    id: 'name',
    label: 'Name',
    options: [
      {id: 'a-to-z', label: 'A to Z', value: 'a-to-z'},
      {id: 'z-to-a', label: 'Z to A', value: 'z-to-a'},
    ],
  },
  {
    id: 'date',
    label: 'Date',
    options: [
      {id: 'newest', label: 'Newest First', value: 'newest'},
      {id: 'oldest', label: 'Oldest First', value: 'oldest'},
    ],
  },
  {
    id: 'city',
    label: 'City',
    options: [
      {id: 'all', label: 'All Cities', value: 'all'},
      {id: 'mumbai', label: 'Mumbai', value: 'mumbai'},
      {id: 'delhi', label: 'Delhi', value: 'delhi'},
    ],
  },
];

export default function FilterModal({
  visible,
  onClose,
  onApply,
  title = 'Filters',
  categories = defaultCategories,
  selectedCategory: initialCategory,
  selectedOptions: initialOptions = {},
}: FilterModalProps) {
  const {moderateScale} = useDeviceMetrics();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || categories[0]?.id || '',
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    initialOptions,
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        modalOverlay: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        modalContent: {
          flex: 1,
          backgroundColor: colors.backgroundWhite,
        },
        headerContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: moderateScale(20),
          paddingTop: moderateScale(16),
          paddingBottom: moderateScale(16),
          backgroundColor: colors.backgroundWhite,
        },
        backButton: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        modalTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
          flex: 1,
          textAlign: 'center',
        },
        contentContainer: {
          flex: 1,
          flexDirection: 'row',
          backgroundColor: colors.backgroundWhite,
        },
        leftPanel: {
          width: moderateScale(120),
          backgroundColor: colors.backgroundWhite,
          borderRightWidth: 1,
          borderRightColor: colors.borderLight,
        },
        leftPanelContent: {
          paddingTop: moderateScale(16),
        },
        categoryItem: {
          paddingVertical: moderateScale(16),
          paddingHorizontal: moderateScale(16),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        categoryText: {
          ...Typography.regularMd,
          fontSize: moderateScale(16),
          color: colors.textTertiary,
        },
        categoryTextSelected: {
          ...Typography.boldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
        },
        rightPanel: {
          flex: 1,
          backgroundColor: colors.backgroundWhite,
          paddingLeft: moderateScale(4),
        },
        rightPanelContent: {
          paddingTop: moderateScale(16),
          paddingHorizontal: moderateScale(20),
        },
        optionItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: moderateScale(16),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        optionText: {
          ...Typography.regularMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          flex: 1,
        },
        radioButton: {
          width: moderateScale(20),
          height: moderateScale(20),
          borderRadius: moderateScale(10),
          borderWidth: 2,
          borderColor: colors.borderDefault,
          alignItems: 'center',
          justifyContent: 'center',
        },
        radioButtonSelected: {
          borderColor: colors.primary,
        },
        radioButtonInner: {
          width: moderateScale(10),
          height: moderateScale(10),
          borderRadius: moderateScale(5),
          backgroundColor: colors.primary,
        },
        blueLine: {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: moderateScale(4),
          backgroundColor: colors.blue,
        },
        applyButtonContainer: {
          paddingHorizontal: moderateScale(20),
          paddingTop: moderateScale(16),
          paddingBottom: moderateScale(20),
          backgroundColor: colors.backgroundWhite,
        },
        applyButton: {
          paddingVertical: moderateScale(16),
          borderRadius: moderateScale(12),
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        applyButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textWhite,
        },
      }),
    [moderateScale],
  );

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleOptionSelect = (optionValue: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [selectedCategory]: optionValue,
    }));
  };

  const handleApply = () => {
    onApply({
      category: selectedCategory,
      options: selectedOptions,
    });
    onClose();
  };

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const currentSelectedOption = selectedOptions[selectedCategory];

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={[dynamicStyles.modalOverlay, {paddingTop: insets.top}]}>
        {/* Header */}
        <View style={dynamicStyles.headerContainer}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={onClose}
            activeOpacity={0.7}>
            <Ionicons
              name="arrow-back"
              size={moderateScale(20)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={dynamicStyles.modalTitle}>{title}</Text>
        </View>

        {/* Two Panel Content */}
        <View style={dynamicStyles.contentContainer}>
          {/* Left Panel - Categories */}
          <View style={dynamicStyles.leftPanel}>
            <View style={dynamicStyles.blueLine} />
            <ScrollView
              style={dynamicStyles.leftPanelContent}
              showsVerticalScrollIndicator={false}>
              {categories.map(category => {
                const isSelected = selectedCategory === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={dynamicStyles.categoryItem}
                    onPress={() => handleCategorySelect(category.id)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        dynamicStyles.categoryText,
                        isSelected && dynamicStyles.categoryTextSelected,
                      ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Right Panel - Options */}
          <View style={dynamicStyles.rightPanel}>
            <ScrollView
              style={dynamicStyles.rightPanelContent}
              showsVerticalScrollIndicator={false}>
              {currentCategory?.options.map(option => {
                const isSelected = currentSelectedOption === option.value;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={dynamicStyles.optionItem}
                    onPress={() => handleOptionSelect(option.value)}
                    activeOpacity={0.7}>
                    <Text style={dynamicStyles.optionText}>{option.label}</Text>
                    <View
                      style={[
                        dynamicStyles.radioButton,
                        isSelected && dynamicStyles.radioButtonSelected,
                      ]}>
                      {isSelected && (
                        <View style={dynamicStyles.radioButtonInner} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Apply Button */}
        <View
          style={[
            dynamicStyles.applyButtonContainer,
            {paddingBottom: Math.max(insets.bottom, moderateScale(20))},
          ]}>
          <TouchableOpacity
            style={dynamicStyles.applyButton}
            onPress={handleApply}
            activeOpacity={0.7}>
            <Text style={dynamicStyles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

