import React, {useMemo} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Linking,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import { ImagePath } from '../assets/images';

type ContactUsModalProps = {
  visible: boolean;
  onClose: () => void;
  tollFreeNumber?: string;
  whatsappNumber?: string;
};

export default function ContactUsModal({
  visible,
  onClose,
  tollFreeNumber = '1800 212 2129',
  whatsappNumber = '919099433133',
}: ContactUsModalProps) {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
          paddingBottom: insets.bottom,
          shadowColor: colors.shadowColor,
          shadowOpacity: 0.25,
          shadowOffset: {width: 0, height: moderateScale(-4)},
          shadowRadius: moderateScale(10),
          elevation: 8,
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        modalTitle: {
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
        contactCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          borderWidth: 1,
          borderColor: colors.borderLight,
          padding: moderateScale(10),
          marginBottom: moderateScale(12),
        },
        iconContainer: {
          width: moderateScale(48),
          height: moderateScale(48),
          borderRadius: moderateScale(10),
          backgroundColor: colors.light_orange,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        contactInfo: {
          flex: 1,
        },
        contactNumber: {
          ...Typography.boldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        contactLabel: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
        },
        actionButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: moderateScale(14),
          paddingVertical: moderateScale(6),
          borderRadius: moderateScale(20),
        },
        actionButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(13),
          color: colors.textWhite,
        },
      }),
    [moderateScale, insets.bottom],
  );

  const handleCall = async (phoneNumber: string) => {
    try {
      const phoneUrl = `tel:${phoneNumber.replace(/\s/g, '')}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        console.log('Cannot make phone call');
      }
    } catch (error) {
      console.log('Error opening phone dialer:', error);
    }
  };

  const handleWhatsApp = async () => {
    try {
      const phoneNumber = whatsappNumber.replace(/\s/g, '').replace(/\+/g, '');
      const whatsappUrl = `https://wa.me/${phoneNumber}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback: try WhatsApp app directly
        const whatsappAppUrl = `whatsapp://send?phone=${phoneNumber}`;
        await Linking.openURL(whatsappAppUrl);
      }
    } catch (error) {
      console.log('Error opening WhatsApp:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
        activeOpacity={1}
      >
        <Pressable
          style={styles.modalContainer}
          onPress={(e) => e.stopPropagation()}
          activeOpacity={1}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contact us</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={moderateScale(20)}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Toll-free Contact Card */}
          <View style={styles.contactCard}>
            <View style={styles.iconContainer}>
              <View
                style={{
                  width: moderateScale(36),
                  height: moderateScale(36),
                  borderRadius: moderateScale(18),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={ImagePath.support}
                  style={{
                    width: moderateScale(24),
                    height: moderateScale(24),
                  }}
                />
              </View>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactNumber}>{tollFreeNumber}</Text>
              <Text style={styles.contactLabel}>
                Contact our toll free number
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCall(tollFreeNumber)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          </View>

          {/* WhatsApp Contact Card */}
          <View style={styles.contactCard}>
            <View style={styles.iconContainer}>
              <Image
                source={ImagePath.whatsapp}
                style={{ width: moderateScale(24), height: moderateScale(24) }}
              />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactNumber}>
                {whatsappNumber.startsWith("91") && whatsappNumber.length > 10
                  ? `+91 ${whatsappNumber.slice(2, 7)} ${whatsappNumber.slice(
                      7
                    )}`
                  : `+91 ${whatsappNumber.slice(0, 5)} ${whatsappNumber.slice(
                      5
                    )}`}
              </Text>
              <Text style={styles.contactLabel}>Whatsapp us!</Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleWhatsApp}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>Text now</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

