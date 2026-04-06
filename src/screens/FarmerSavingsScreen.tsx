import React, {useMemo, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getUserData} from '../utils/session';

type FarmerSavingsItem = {
  id: number;
  item_name: string;
  offer_type: string;
  original_price: number;
  discount_percentage: number;
};

export default function FarmerSavingsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();
  const {t} = useLanguage();
  const route = useRoute<any>();
  const farmerId = route.params?.farmerId ?? route.params?.farmer_id;

  const [items, setItems] = useState<FarmerSavingsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchSavings() {
      try {
        setLoading(true);
        let resolvedFarmerId = null;
        if (!resolvedFarmerId) {
          // Use farmer_id from login response (user.id / farmer id stored at login)
          const loginData = await getUserData();
          if (cancelled) return;
          resolvedFarmerId =
            loginData?.user?.id ?? loginData?.farmer?.id ?? loginData?.farmer?.farmer_id;
          if (resolvedFarmerId && __DEV__) {
            console.log('[FarmerSavingsScreen] Resolved farmer_id from login response:', resolvedFarmerId);
          }
        }
        if (!resolvedFarmerId) {
          // Fallback: when opened from Farmer Profile without params, get current farmer id from profile API
          const profileRes = await getData(Apis.FARMER_PROFILE, {});
          if (cancelled) return;
          const data = profileRes?.data;
          resolvedFarmerId =
            data?.id ?? data?.farmer_id ?? data?.personal_details?.id ?? data?.personal_details?.farmer_id;
          if (__DEV__) {
            console.log('[FarmerSavingsScreen] Resolved farmer_id from profile API:', resolvedFarmerId);
          }
        }
        if (!resolvedFarmerId) {
          if (__DEV__) console.log('[FarmerSavingsScreen] No farmer_id available, skipping API call');
          setItems([]);
          return;
        }
        // API expects GET with farmerId in path: /api/admin/settings/farmer-savings/{farmerId}
        const url = `${Apis.FARMER_SAVINGS_GET}`;
        if (__DEV__) {
          console.log('[FarmerSavingsScreen] Calling farmer savings API:', url);
        }
        const res = await getData(url, {});
        if (cancelled) return;
        const list =
          res && (res.success === true || res.status === true) && Array.isArray(res?.data)
            ? res.data
            : [];
        if (__DEV__) {
          console.log('[FarmerSavingsScreen] Savings API response:', res?.success ?? res?.status, 'items:', list.length);
        }
        setItems(list);
      } catch (err) {
        if (!cancelled && __DEV__) {
          console.log('[FarmerSavingsScreen] Error fetching savings:', err);
        }
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSavings();
    return () => {
      cancelled = true;
    };
  }, [farmerId]);

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
          paddingBottom: moderateScale(24),
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(16),
          paddingVertical: moderateScale(14),
          paddingHorizontal: moderateScale(16),
          marginBottom: moderateScale(12),
        },
        rowTop: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        itemName: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
        },
        savedRight: {
          alignItems: 'flex-end',
        },
        savedAmount: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.primary,
        },
        savedLabel: {
          ...Typography.regularSm,
          fontSize: moderateScale(11),
          color: colors.textSecondary,
        },
        typeText: {
          ...Typography.regularSm,
          fontSize: moderateScale(13),
          color: colors.primary,
          marginTop: moderateScale(4),
        },
        priceRow: {
          marginTop: moderateScale(4),
          flexDirection: 'row',
          alignItems: 'center',
        },
        originalPrice: {
          ...Typography.regularSm,
          fontSize: moderateScale(13),
          color: colors.textSecondary,
          textDecorationLine: 'line-through',
          marginRight: moderateScale(6),
        },
        finalPrice: {
          ...Typography.regularSm,
          fontSize: moderateScale(13),
          color: colors.textPrimary,
        },
        emptyText: {
          ...Typography.regularSm,
          fontSize: moderateScale(14),
          color: colors.textLight,
          textAlign: 'center',
          marginTop: moderateScale(24),
        },
        loadingWrap: {
          paddingTop: moderateScale(24),
          alignItems: 'center',
        },
      }),
    [moderateScale, insets.top],
  );

  const renderCard = (item: FarmerSavingsItem) => {
    const discount = Number(item.discount_percentage) || 0;
    const saved = (item.original_price * discount) / 100;
    const finalAmount = item.original_price - saved;

    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.itemName}>{item.item_name}</Text>
          <View style={styles.savedRight}>
            <Text style={styles.savedAmount}>{`₹ ${saved}`}</Text>
            <Text style={styles.savedLabel}>{t('savings.saved')}</Text>
          </View>
        </View>
        <Text style={styles.typeText}>
          {item.offer_type === 'service'
            ? t('offer.service')
            : t('offer.product')}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.originalPrice}>{`₹ ${item?.original_price}`}</Text>
          <Text style={styles.finalPrice}>{`₹ ${finalAmount}`}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
        <Text style={styles.headerTitle}>{t('savings.title')}</Text>
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <Text style={styles.emptyText}>{t('savings.noSavings')}</Text>
        ) : (
          items.map(renderCard)
        )}
      </ScrollView>
    </View>
  );
}

