import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  Platform,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {RootStackParamList} from '../navigation/RootNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import {saveTermsAccepted} from '../utils/session';
import {useLanguage} from '../contexts/LanguageContext';
import {Colors} from '../constants/colors';
import {Typography} from '../utils/typography';
import Button from '../components/Button';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import useDeviceMetrics from '../utils/responsiveCustom';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';

type TermsScreenProps = NativeStackScreenProps<RootStackParamList, 'Terms'>;

const TermsScreen: React.FC<TermsScreenProps> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const [accepted, setAccepted] = useState(false);

  // Match status bar with light grey background
  useDynamicStatusBar({
    backgroundColor: Colors.background.light,
    bottomBarColor: Colors.background.light,
  });

  const handleContinue = async () => {
    if (!accepted) {
      return;
    }
    try {
      // Save terms acceptance
      await saveTermsAccepted();
      // Navigate to ReviewProfileScreen for farmers
      navigation.replace(SCREEN_NAMES.ReviewProfile);
    } catch (error) {
      console.error('Error saving terms acceptance:', error);
      // Still navigate even if saving fails
      navigation.replace(SCREEN_NAMES.ReviewProfile);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safeArea: {
          flex: 1,
          backgroundColor: Colors.background.light,
        },
        container: {
          flex: 1,
          paddingHorizontal: moderateScale(24),
          paddingTop: insets.top + moderateScale(12),
          paddingBottom: insets.bottom + moderateScale(12),
          backgroundColor: Colors.background.light,
        },
        title: {
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
          color: Colors.text.primary,
        },
        subtitle: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          marginTop: moderateScale(8),
          marginBottom: moderateScale(16),
          color: Colors.text.secondary,
        },
        cardContainer: {
          flex: 1,
        },
        card: {
          backgroundColor: Colors.background.white,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowOffset: {width: 0, height: moderateScale(4)},
          shadowRadius: moderateScale(10),
          elevation: 4,
        },
        cardScrollContent: {
          paddingBottom: moderateScale(24),
        },
        cardTitle: {
          ...Typography.semiBoldSm,
          fontSize: moderateScale(12),
          color: Colors.text.primary,
          marginBottom: moderateScale(8),
        },
        cardBody: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: Colors.text.secondary,
          lineHeight: moderateScale(14) * 1.6,
        },
        sectionSpacing: {
          marginTop: moderateScale(24),
        },
        bulletRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: moderateScale(4),
        },
        bulletDot: {
          marginTop: moderateScale(2),
          marginRight: moderateScale(8),
          color: Colors.text.secondary,
          fontSize: moderateScale(12),
        },
        bulletText: {
          flex: 1,
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: Colors.text.secondary,
          lineHeight: moderateScale(14) * 1.5,
        },
        bottomArea: {
          marginTop: moderateScale(12),
          paddingBottom: Platform.OS === 'android' ? moderateScale(8) : 0,
        },
        checkboxRow: {
          flexDirection: 'row',
          alignItems: 'center',
          // marginBottom: moderateScale(16),
        },
        checkbox: {
          width: moderateScale(20),
          height: moderateScale(20),
          borderRadius: moderateScale(4),
          borderWidth: 1,
          borderColor: Colors.border.default,
          backgroundColor: Colors.background.white,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(8),
        },
        checkboxChecked: {
          borderColor: Colors.primary,
          backgroundColor: Colors.primaryLight,
        },
        checkboxInner: {
          width: moderateScale(10),
          height: moderateScale(10),
          borderRadius: moderateScale(4),
          backgroundColor: Colors.primary,
        },
        checkboxText: {
          flex: 1,
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: Colors.text.secondary,
        },
        checkboxHighlight: {
          ...Typography.mediumSm,
          fontSize: moderateScale(12),
          color: Colors.primary,
        },
        continueButton: {
          borderRadius: moderateScale(999),
          marginVertical: moderateScale(10),
        },
      }),
    [moderateScale, insets.top, insets.bottom],
  );

  return (
    <SafeAreaView 
      style={styles.safeArea}
      edges={Platform.OS === 'ios' ? ['top', 'bottom'] : []}>
      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.title}>{t('terms.title')}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{t('terms.subtitle')}</Text>

        {/* Static white card; only inner content scrolls */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <ScrollView
              contentContainerStyle={styles.cardScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.cardTitle}>
                {t('terms.sectionInterpretation')}
              </Text>
              <Text style={styles.cardBody}>
                {t('terms.interpretationText')}
              </Text>

              <Text style={[styles.cardTitle, styles.sectionSpacing]}>
                {t('terms.sectionDefinitions')}
              </Text>
              {Object.values({
                affiliate: t('terms.definitionPoints.affiliate'),
                company: t('terms.definitionPoints.company'),
                service: t('terms.definitionPoints.service'),
                you: t('terms.definitionPoints.you'),
                website: t('terms.definitionPoints.website'),
              }).map((point, index) => (
                <View key={index} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>{'\u2022'}</Text>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}

              <Text style={[styles.cardTitle, styles.sectionSpacing]}>
                {t('terms.sectionAcknowledgement')}
              </Text>
              <Text style={styles.cardBody}>
                {t('terms.acknowledgementText')}
              </Text>
            </ScrollView>
          </View>
        </View>

        {/* Bottom consent + button */}
        <View style={styles.bottomArea}>
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAccepted(prev => !prev)}
          >
            <Ionicons
              name={accepted ? 'checkbox' : 'square-outline'}
              size={moderateScale(20)}
              color={accepted ? colors.primary : Colors.border.default}
              style={{
                marginRight: moderateScale(8),
                backgroundColor: accepted ? Colors.background.white : Colors.background.white,
                borderRadius: moderateScale(4),
                borderWidth: accepted ? 0 : 1,
                borderColor: Colors.border.default,
              }}
            />
            <Text style={styles.checkboxText}>
              {t('terms.checkboxLabel')}{' '}
              <Text style={styles.checkboxHighlight}>
                {t('terms.checkboxHighlight')}
              </Text>
            </Text>
          </Pressable>

          <Button
            title={t('terms.continueButton')}
            onPress={handleContinue}
            disabled={!accepted}
            style={styles.continueButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TermsScreen;


