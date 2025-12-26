import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {SCREEN_NAMES} from '../constants/screenNames';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';

// Mock data - extended list of tractors
const allTractors = [
  {
    id: '1',
    model: '280 DX 2 WD',
    owner: 'Adam smith',
    color: colors.tractorGreen,
  },
  {
    id: '2',
    model: '280 4WD',
    owner: 'Nathan ellis',
    color: colors.tractorOrange,
  },
  {
    id: '3',
    model: '120 Little master',
    owner: 'William regal',
    color: colors.tractorGreen,
  },
  {
    id: '4',
    model: '350 Pro',
    owner: 'David Wills',
    color: colors.tractorOrange,
  },
  {
    id: '5',
    model: '200 Standard',
    owner: 'Sarah Johnson',
    color: colors.tractorGreen,
  },
  {
    id: '6',
    model: '450 Premium',
    owner: 'Michael Brown',
    color: colors.tractorOrange,
  },
  {
    id: '7',
    model: '150 Compact',
    owner: 'Emily Davis',
    color: colors.tractorGreen,
  },
  {
    id: '8',
    model: '300 Deluxe',
    owner: 'James Wilson',
    color: colors.tractorOrange,
  },
];

// Tractor Thumbnail Component
const TractorThumbnail = ({
  color,
  size,
  moderateScale,
}: {
  color: string;
  size?: number;
  moderateScale: (size: number, factor?: number) => number;
}) => {
  const thumbnailSize = size || moderateScale(48);
  return (
    <View
      style={{
        width: thumbnailSize,
        height: thumbnailSize,
        borderRadius: thumbnailSize / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <MaterialCommunityIcons
        name="tractor"
        size={moderateScale(24)}
        color={colors.textWhite}
      />
    </View>
  );
};

export default function FarmerTractorsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const navigation = useNavigation();

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

 const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top + moderateScale(12),
          paddingBottom: moderateScale(12),
          backgroundColor: colors.backgroundLight,
        },
        headerTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
          marginLeft: moderateScale(10),
        },
        addButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(8),
          borderRadius: moderateScale(20),
        },
        addButtonText: {
          ...Typography.semiBoldMd,
          color: colors.textWhite,
          fontSize: moderateScale(14),
        },
        listContainer: {
          flex: 1,
          backgroundColor: colors.backgroundWhite,
          borderRadius:moderateScale(15),
          borderWidth:1,
          borderColor:colors.backgroundGray
        },
        listItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(12),
        },
        listItemBorder: {
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        listItemContent: {
          flex: 1,
          marginLeft: moderateScale(12),
        },
        listItemName: {
          ...Typography.semiBoldMd,
          color: colors.textPrimary,
          fontSize: moderateScale(14),
          marginBottom: moderateScale(2),
          textTransform: 'capitalize',
        },
        listItemSubtext: {
          ...Typography.regularSm,
          color: colors.textTertiary,
          fontSize: moderateScale(12),
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <View style={[dynamicStyles.container]}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>{t('tractors.title')}</Text>
      </View>

      {/* Tractors List */}
       <View
        style={{
          flex: 1,
          padding: moderateScale(10),
          backgroundColor: colors.backgroundLight,
        }}
      >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={dynamicStyles.listContainer}>
        {allTractors.map((tractor, index) => (
          <TouchableOpacity
            key={tractor.id}
            style={[
              dynamicStyles.listItem,
              index !== allTractors.length - 1 &&
                dynamicStyles.listItemBorder,
            ]}
            activeOpacity={0.7}
            onPress={() => {
              (navigation as any).navigate(SCREEN_NAMES.FarmerTractorDetails, {
                tractorId: tractor.id,
                tractorModel: tractor.model,
                tractorOwner: tractor.owner,
                tractorColor: tractor.color,
                fromScreen: 'List',
              });
            }}>
            <TractorThumbnail
              color={tractor.color}
              moderateScale={moderateScale}
              size={moderateScale(40)}
            />
            <View style={dynamicStyles.listItemContent}>
              <Text style={dynamicStyles.listItemName}>{tractor.model}</Text>
              <Text style={dynamicStyles.listItemSubtext}>
                {tractor.owner}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={moderateScale(18)}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      </View>
    </View>
  );
}
