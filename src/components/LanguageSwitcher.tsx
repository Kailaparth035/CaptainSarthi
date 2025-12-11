import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from 'react-native';
import {useLanguage} from '../contexts/LanguageContext';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Colors} from '../constants/colors';
import {Typography, FontFamily} from '../utils/typography';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Language = 'en' | 'gu' | 'hi';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  {code: 'en', name: 'English', nativeName: 'English'},
  {code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી'},
  {code: 'hi', name: 'Hindi', nativeName: 'हिंदी'},
];

interface LanguageSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSwitcher({
  visible,
  onClose,
}: LanguageSwitcherProps) {
  const {currentLanguage, changeLanguage, t} = useLanguage();
  const {moderateScale} = useDeviceMetrics();

  const handleLanguageSelect = async (lang: Language) => {
    await changeLanguage(lang);
    onClose();
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: Colors.background.white,
      borderRadius: moderateScale(16),
      width: '85%',
      maxWidth: moderateScale(400),
      padding: moderateScale(20),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: moderateScale(20),
    },
    title: {
      ...Typography.boldXxl,
      fontSize: moderateScale(20),
      color: Colors.text.primary,
    },
    closeButton: {
      padding: moderateScale(4),
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: moderateScale(16),
      paddingHorizontal: moderateScale(12),
      borderRadius: moderateScale(8),
      marginBottom: moderateScale(8),
      backgroundColor: Colors.background.light,
    },
    languageItemActive: {
      backgroundColor: Colors.primaryLight,
      borderWidth: 2,
      borderColor: Colors.primary,
    },
    languageInfo: {
      flex: 1,
      marginLeft: moderateScale(12),
    },
    languageName: {
      ...Typography.semiBoldMd,
      fontSize: moderateScale(16),
      color: Colors.text.primary,
      marginBottom: moderateScale(4),
    },
    languageNativeName: {
      ...Typography.regularSm,
      fontSize: moderateScale(14),
      color: Colors.text.secondary,
    },
    checkIcon: {
      marginLeft: moderateScale(8),
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
          style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('language.selectLanguage')}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}>
              <Ionicons
                name="close"
                size={moderateScale(24)}
                color={Colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          <FlatList
            data={languages}
            keyExtractor={item => item.code}
            renderItem={({item}) => {
              const isActive = currentLanguage === item.code;
              return (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    isActive && styles.languageItemActive,
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                  activeOpacity={0.7}>
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{item.name}</Text>
                    <Text style={styles.languageNativeName}>
                      {item.nativeName}
                    </Text>
                  </View>
                  {isActive && (
                    <Ionicons
                      name="checkmark-circle"
                      size={moderateScale(24)}
                      color={Colors.primary}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

