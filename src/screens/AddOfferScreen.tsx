import React, {useMemo, useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import Dropdown from '../components/Dropdown';
import SimpleBoxInput from '../components/FloatingInput';
import Button from '../components/Button';
import Toast, {ToastType} from '../components/Toast';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {getData, postData} from '../Service/Apimethod';
import Apis from '../Service/constant';

type AddOfferRouteParams = {
  farmerId?: number | string;
  farmer_id?: number | string;
  farmerName?: string;
};

type DiscountItem = {
  id: number;
  offer_name: string;
  is_active: boolean;
  discount_percentage: string;
  created_at?: string;
  updated_at?: string;
};



function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = parseFloat(trimmed.replace(/,/g, ''));
  return Number.isFinite(num) && num >= 0 ? num : null;
}

const DEFAULT_DISCOUNT_PERCENT = 5;

function normalizeOfferValue(name: string): string {
  return name.trim().toLowerCase();
}

export default function AddOfferScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as AddOfferRouteParams | undefined;
  const {t} = useLanguage();
  const farmerId = params?.farmerId ?? params?.farmer_id;

  const [discountList, setDiscountList] = useState<DiscountItem[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [productName, setProductName] = useState('');
  const [productCode, setProductCode] = useState('');
  const [productAmount, setProductAmount] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToastMessage = useCallback((message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  }, []);
  const hideToast = useCallback(() => setShowToast(false), []);

  const activeDiscounts = useMemo(
    () => (discountList || []).filter(d => d.is_active === true),
    [discountList],
  );

  const applyOfferOptions = useMemo(
    () =>
      activeDiscounts.map(d => ({
        label: d.offer_name,
        value: normalizeOfferValue(d.offer_name),
        discount_percentage: d.discount_percentage,
      })),
    [activeDiscounts],
  );

  const selectedDiscount = useMemo(
    () =>
      activeDiscounts.find(
        d => normalizeOfferValue(d.offer_name) === selectedType,
      ) ?? null,
    [activeDiscounts, selectedType],
  );


  const discountPercent = useMemo(() => {
    if (!selectedDiscount) return DEFAULT_DISCOUNT_PERCENT;
    const p = parseFloat(selectedDiscount.discount_percentage);
    return Number.isFinite(p) ? p : DEFAULT_DISCOUNT_PERCENT;
  }, [selectedDiscount]);

  useEffect(() => {
    let cancelled = false;
    async function fetchDiscounts() {
      setLoadingDiscounts(true);
      try {
        const res = await getData(Apis.ADMIN_SETTINGS_DISCOUNTS, {});
        const list = res?.data ?? [];
        if (!cancelled && Array.isArray(list)) {
          setDiscountList(list);
          const active = list.filter((d: DiscountItem) => d.is_active === true);
          if (active.length === 1) {
            setSelectedType(normalizeOfferValue(active[0].offer_name));
          }
        }
      } catch {
        if (!cancelled) setDiscountList([]);
      } finally {
        if (!cancelled) setLoadingDiscounts(false);
      }
    }
    fetchDiscounts();
    return () => {
      cancelled = true;
    };
  }, []);

  const amountValue =
    selectedType === 'product'
      ? productAmount
      : selectedType === 'service'
      ? serviceAmount
      : '';

  const amountNum = useMemo(
    () => (selectedType ? parseAmount(amountValue) : null),
    [selectedType, amountValue],
  );

  const amountPayable = useMemo(() => {
    if (amountNum == null) return null;
    const discounted = amountNum * (1 - discountPercent / 100);
    return Math.round(discounted * 100) / 100;
  }, [amountNum, discountPercent]);

  const isProductFormValid = useMemo(
    () =>
      Boolean(
        productName.trim() &&
          productCode.trim() &&
          amountNum != null &&
          amountNum > 0,
      ),
    [productName, productCode, amountNum],
  );

  const isServiceFormValid = useMemo(
    () =>
      Boolean(
        serviceName.trim() &&
          serviceDescription.trim() &&
          amountNum != null &&
          amountNum > 0,
      ),
    [serviceName, serviceDescription, amountNum],
  );

  const isFormValid = useMemo(() => {
    if (selectedType === 'product') return isProductFormValid;
    if (selectedType === 'service') return isServiceFormValid;
    return false;
  }, [selectedType, isProductFormValid, isServiceFormValid]);

  const handleApply = useCallback(async () => {
    if (!isFormValid || amountNum == null || amountNum <= 0) {
      return;
    }

    const id = farmerId != null ? Number(farmerId) : undefined;
    if (id == null || !Number.isFinite(id)) {
      return;
    }

    setSubmitting(true);
    try {
      const basePayload = {
        farmer_id: id,
        offer_type: selectedType,
        original_price: amountNum,
        discount_percentage: discountPercent,
      };

      let payload: any = basePayload;

      if (selectedType === 'product') {
        const trimmedName = productName.trim();
        const trimmedCode = productCode.trim();
        if (!trimmedName || !trimmedCode) {
          return;
        }

        const parsedCode = Number(trimmedCode);
        payload = {
          ...basePayload,
          product_name: trimmedName,
          product_code: Number.isFinite(parsedCode) ? parsedCode : trimmedCode,
        };
      } else if (selectedType === 'service') {
        const trimmedName = serviceName.trim();
        const trimmedDescription = serviceDescription.trim();
        if (!trimmedName || !trimmedDescription) {
          return;
        }

        payload = {
          ...basePayload,
          service_name: trimmedName,
          service_description: trimmedDescription,
        };
      } else {
        // Unknown type – do not call API
        return;
      }
      console.log("payload ::",payload);
      

      const response = await postData(Apis.ADMIN_FARMER_SAVINGS, payload);

      if (response?.success === true) {
        showToastMessage(t('offer.offerAddedSuccess'), 'success');
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      }
    } finally {
      setSubmitting(false);
    }
  }, [
    isFormValid,
    farmerId,
    selectedType,
    productName,
    serviceName,
    amountNum,
    discountPercent,
    navigation,
    showToastMessage,
    t,
  ]);

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
          paddingBottom: moderateScale(12),
          backgroundColor: colors.backgroundLight,
        },
        backButton: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundWhite,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        headerTitle: {
          ...Typography.boldXxl,
          fontSize: moderateScale(22),
          color: colors.textPrimary,
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingBottom: moderateScale(32),
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        sectionTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(15),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: moderateScale(12),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderDefault,
        },
        rowLast: {
          borderBottomWidth: 0,
        },
        rowLabel: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
        },
        rowValue: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
        },
        applyButtonWrap: {
          marginTop: moderateScale(8),
          marginBottom: moderateScale(24),
        },
        loadingWrap: {
          paddingVertical: moderateScale(20),
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('offer.addOffer')}</Text>
      </View>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        {/* Content */}
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Apply Offer On Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('offer.applyOfferOn')}</Text>
            {loadingDiscounts ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : (
              <Dropdown
                label={t('offer.selectProductService')}
                value={selectedType}
                options={applyOfferOptions}
                onSelect={value => {
                  console.log('Selected offer type:', value);
                  setSelectedType(value);
                }}
                placeholder={t('offer.selectProductService')}
                
              />
            )}
          </View>

          {/* Product detail – shown when Product is selected */}
          {selectedType === 'product' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {t('offer.productDetail')}
              </Text>
              <SimpleBoxInput
                numberOfLinesLabel={1}
                label={t('offer.productName')}
                value={productName}
                onChangeText={setProductName}
                placeholder={t('offer.productNamePlaceholder')}
                required
              />
              <SimpleBoxInput
                numberOfLinesLabel={1}
                label={t('offer.productCode')}
                value={productCode}
                onChangeText={setProductCode}
                placeholder={t('offer.productCodePlaceholder')}
                required
              />
              <SimpleBoxInput
                numberOfLinesLabel={1}
                label={t('offer.amount')}
                value={productAmount}
                onChangeText={setProductAmount}
                placeholder={t('offer.amountPlaceholder')}
                keyboardType="decimal-pad"
                required
              />
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowLabel}>{t('offer.discount')}</Text>
                <Text style={styles.rowValue}>{discountPercent}%</Text>
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowLabel}>{t('offer.amountPayable')}</Text>
                <Text style={styles.rowValue}>
                  {amountPayable != null
                    ? `₹${amountPayable.toFixed(2)}`
                    : t('offer.amountPayable')}
                </Text>
              </View>
            </View>
          )}

          {/* Service detail – shown when Service is selected */}
          {selectedType === 'service' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                {t('offer.serviceDetail')}
              </Text>
              <SimpleBoxInput
                numberOfLinesLabel={1}
                label={t('offer.serviceName')}
                value={serviceName}
                onChangeText={setServiceName}
                placeholder={t('offer.serviceNamePlaceholder')}
                required
              />
              <SimpleBoxInput
                numberOfLinesLabel={3}
                label={t('offer.serviceDescription')}
                value={serviceDescription}
                onChangeText={setServiceDescription}
                placeholder={t('offer.serviceDescriptionPlaceholder')}
                multiline
                required
                style={{maxHeight: moderateScale(80)}}
              />
              <SimpleBoxInput
                numberOfLinesLabel={1}
                label={t('offer.amount')}
                value={serviceAmount}
                onChangeText={setServiceAmount}
                placeholder={t('offer.amountPlaceholder')}
                keyboardType="decimal-pad"
                required
              />
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowLabel}>{t('offer.discount')}</Text>
                <Text style={styles.rowValue}>{discountPercent}%</Text>
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.rowLabel}>{t('offer.amountPayable')}</Text>
                <Text style={styles.rowValue}>
                  {amountPayable != null
                    ? `₹${amountPayable.toFixed(2)}`
                    : t('offer.amountPayable')}
                </Text>
              </View>
            </View>
          )}

          {(selectedType === 'product' || selectedType === 'service') && (
            <View style={styles.applyButtonWrap}>
              <Button
                title={t('offer.apply')}
                onPress={handleApply}
                disabled={!isFormValid || submitting || farmerId == null}
                loading={submitting}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onClose={hideToast}
      />
    </View>
  );
}
