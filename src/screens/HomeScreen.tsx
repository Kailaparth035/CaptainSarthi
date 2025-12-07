import React, {useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, CommonActions} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {FontFamily, Typography} from '../utils/typography';
import {TabParamList} from '../navigation/TabNavigator';
import {RootStackParamList} from '../navigation/RootNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';

// Mock data
const summaryData = {
  activeClients: 156,
  tractorModels: 14,
  syncsPending: 16,
};

const clients = [
  {id: '1', name: 'David Wills', phone: '5214-9710-3671', initials: 'DW'},
  {id: '2', name: 'Adam Kepler', phone: '5214-9710-3671', initials: 'AK'},
  {id: '3', name: 'Natasha Davies', phone: '5214-9710-3671', initials: 'ND'},
  {id: '4', name: 'Peter Jane', phone: '5214-9710-3671', initials: 'PJ'},
];

const tractors = [
  {id: '1', model: '280 DX 2 WD', owner: 'Adam smith', color: colors.tractorGreen},
  {id: '2', model: '280 4WD', owner: 'Nathan ellis', color: colors.tractorOrange},
  {id: '3', model: '120 Little master', owner: 'William regal', color: colors.tractorGreen},
];

// Avatar Component
const Avatar = ({
  initials,
  size,
  moderateScale,
}: {
  initials: string;
  size?: number;
  moderateScale: (percent: number) => number;
}) => {
  const avatarSize = size || moderateScale(48);
  return (
    <View
      style={[
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: colors.light_dark_yellow,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <Text
        style={[
          Typography.semiBoldMd,
          {
            fontSize: moderateScale(14),
            color: colors.textSecondary,
          },
        ]}>
        {initials}
      </Text>
    </View>
  );
};

// Tractor Thumbnail Component
const TractorThumbnail = ({
  color,
  size,
  moderateScale,
}: {
  color: string;
  size?: number;
  moderateScale: (percent: number) => number;
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

// Summary Card Component
const 
SummaryCard = ({
  icon,
  value,
  label,
  iconColor,
  iconType = 'ionicons',
  onPress,
  moderateScale,
  dynamicStyles,
  iconBgColor
}: {
  icon: string;
  value: string | number;
  label: string;
  iconColor: string;
  iconBgColor:string;
  iconType?: 'ionicons' | 'material';
  onPress?: () => void;
  moderateScale: (percent: number) => number;
  dynamicStyles: any;
}) => {
  const CardWrapper = onPress ? TouchableOpacity : View;
  return (
    <View
      style={dynamicStyles.summaryCard}
    >
      <View
        style={[
          dynamicStyles.summaryIconContainer,
          { backgroundColor: iconBgColor },
        ]}
      >
        {iconType === 'material' ? (
          <MaterialCommunityIcons
            name={icon}
            size={moderateScale(25)}
            color={colors.iconGreen}
          />
        ) : (
          <Ionicons
            name={icon}
            size={moderateScale(25)}
            color={colors.iconBlue}
          />
        )}
      </View>
      <View
        style={{
          marginLeft: moderateScale(10),
          flex: 1,
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <Text style={dynamicStyles.summaryValue}>{value}</Text>
        <Text style={dynamicStyles.summaryLabel}>{label}</Text>
      </View>
    </View>
  );
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation();
  const tabNavigation =
    useNavigation<BottomTabNavigationProp<TabParamList>>();

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
        scrollContent: {
          paddingHorizontal: moderateScale(16),
          paddingBottom: moderateScale(32),
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          // marginTop: moderateScale(24),
          marginBottom: moderateScale(18),
        },
        greeting: {
          ...Typography.boldHeading,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
          fontFamily: FontFamily.SemiBold,
        },
        bellIcon: {
          padding: moderateScale(4),
          alignItems:'center',
          justifyContent:'center'
        },
        summaryContainer: {
          flexDirection: 'row',
          gap: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        summaryCard: {
          flex: 1,
          backgroundColor: colors.white,
          borderRadius: moderateScale(12),
          padding: moderateScale(12),
          alignItems: 'center',
          flexDirection:'row',
          minHeight: moderateScale(68),
          shadowColor: colors.shadowColor,
          shadowOffset: {width: 0, height: moderateScale(2)},
          shadowOpacity: 0.05,
          shadowRadius: moderateScale(4),
          elevation: 2,
        },
        summaryIconContainer: {
          width: moderateScale(48),
          height: moderateScale(48),
          borderRadius: moderateScale(8),
          alignItems: 'center',
          justifyContent: 'center',
        },
        summaryValue: {
          ...Typography.boldXxxl,
          color: colors.textPrimary,
          fontSize: moderateScale(16),
          marginBottom: moderateScale(4),          
        },
        summaryLabel: {
          ...Typography.regularSm,
          color: colors.textSecondary,
          fontSize: moderateScale(12),
        },
        syncCardWrapper: {
          marginBottom: moderateScale(16),
          alignItems:'center',
          justifyContent:'center'
        },
        syncCard: {
          flexDirection: 'row',
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(10),
          alignItems: 'center',
          justifyContent:'space-between',
          shadowColor: colors.shadowColor,
          shadowOffset: {width: 0, height: moderateScale(2)},
          shadowOpacity: 0.05,
          shadowRadius: moderateScale(4),
          elevation: 2,
        },
        syncCardContent: {
          flex: 1,
          marginLeft: moderateScale(16),
        },
        syncButton: {
          backgroundColor: colors.white,
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(8),
          borderRadius: moderateScale(20),
          borderWidth:1,
          borderColor:colors.primary
        },
        syncButtonText: {
          ...Typography.semiBoldMd,
          color: colors.primary,
          fontSize: moderateScale(14),
        },
        sectionCard: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
          shadowColor: colors.shadowColor,
          shadowOffset: {width: 0, height: moderateScale(2)},
          shadowOpacity: 0.05,
          shadowRadius: moderateScale(4),
          elevation: 2,
        },
        sectionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(6),
        },
        sectionTitle: {
          ...Typography.semiBoldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(18),
        },
        seeAllText: {
          ...Typography.semiBoldMd,
          color: colors.primary,
          fontSize: moderateScale(15),
        },
        listContainer: {
          gap: 0,
        },
        listItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: moderateScale(10),
        },
        listItemBorder: {
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        listItemContent: {
          flex: 1,
          marginLeft: moderateScale(16),
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
      {/* Header Section */}

      <View
        style={[
          dynamicStyles.header,
          { paddingHorizontal: moderateScale(16), paddingTop: insets.top },
        ]}
      >
        <Text style={dynamicStyles.greeting}>Hello William</Text>
        <TouchableOpacity
          style={dynamicStyles.bellIcon}
          activeOpacity={0.7}
          onPress={() => {
            // Navigate within HomeStack
            (navigation as any).navigate(SCREEN_NAMES.Notifications);
          }}>
          <Ionicons
            name="notifications-outline"
            size={moderateScale(22)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={dynamicStyles.scrollContent}
      >
        {/* Summary Cards */}
        <View style={dynamicStyles.summaryContainer}>
          <SummaryCard
            icon="people"
            value={summaryData.activeClients}
            label="Active clients"
            iconColor={colors.iconBlue}
            iconBgColor={colors.light_blue}
            moderateScale={moderateScale}
            dynamicStyles={dynamicStyles}
          />
          <SummaryCard
            icon="tractor"
            value={summaryData.tractorModels}
            label="Tractor models"
            iconColor={colors.iconGreen}
            iconBgColor={colors.light_green}
            iconType="material"
            moderateScale={moderateScale}
            dynamicStyles={dynamicStyles}
          />
        </View>

        {/* Sync Card */}
        <View style={dynamicStyles.syncCardWrapper}>
          <View style={dynamicStyles.syncCard}>
            <View
              style={[
                dynamicStyles.summaryIconContainer,
                { backgroundColor: colors.light_orange },
              ]}
            >
              <Ionicons
                name="sync"
                size={moderateScale(22)}
                color={colors.iconOrange}
              />
            </View>
            <View style={dynamicStyles.syncCardContent}>
              <Text
                style={[
                  dynamicStyles.summaryValue,
                  { marginTop: moderateScale(5) },
                ]}
              >
                {summaryData.syncsPending}
              </Text>
              <Text style={dynamicStyles.summaryLabel}>Syncs pending</Text>
            </View>
            <TouchableOpacity
              style={dynamicStyles.syncButton}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.syncButtonText}>Sync now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Clients Section */}
        <View style={dynamicStyles.sectionCard}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Clients</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to Farmer tab and ensure we're on the Farmer list screen
                // Use CommonActions to reset the Farmer stack to the base screen
                tabNavigation.dispatch(
                  CommonActions.navigate({
                    name: SCREEN_NAMES.Farmer,
                    params: {
                      screen: SCREEN_NAMES.Farmer,
                    },
                  }),
                );
              }}
            >
              <Text style={dynamicStyles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.listContainer}>
            {clients.map((client, index) => (
              <TouchableOpacity
                key={client.id}
                style={[
                  dynamicStyles.listItem,
                  index !== clients.length - 1 && dynamicStyles.listItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  // Navigate to Farmer tab and then to FarmerDetails
                  tabNavigation.navigate(SCREEN_NAMES.Farmer, {
                    screen: SCREEN_NAMES.FarmerDetails,
                    params: {
                      farmerId: client.id,
                      farmerName: client.name,
                      farmerPhone: client.phone,
                      farmerInitials: client.initials,
                      fromScreen: 'Home',
                    },
                  } as any);
                }}
              >
                <Avatar
                  initials={client.initials}
                  moderateScale={moderateScale}
                  size={moderateScale(40)}
                />
                <View style={dynamicStyles.listItemContent}>
                  <Text style={dynamicStyles.listItemName}>{client.name}</Text>
                  <Text style={dynamicStyles.listItemSubtext}>
                    {client.phone}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(18)}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tractors Section */}
        <View style={[dynamicStyles.sectionCard]}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Tractors</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                 tabNavigation.dispatch(
                  CommonActions.navigate({
                    name: SCREEN_NAMES.Tractors,
                    params: {
                      screen: SCREEN_NAMES.Tractors,
                    },
                  }),
                );
              }
              }
            >
              <Text style={dynamicStyles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.listContainer}>
            {tractors.map((tractor, index) => (
              <TouchableOpacity
                key={tractor.id}
                style={[
                  dynamicStyles.listItem,
                  index !== tractors.length - 1 && dynamicStyles.listItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  // Navigate to Tractors tab and then to TractorDetails
                  tabNavigation.navigate(SCREEN_NAMES.Tractors, {
                    screen: SCREEN_NAMES.TractorDetails,
                    params: {
                      tractorId: tractor.id,
                      tractorModel: tractor.model,
                      tractorOwner: tractor.owner,
                      tractorColor: tractor.color,
                      fromScreen: 'Home',
                    },
                  } as any);
                }}
              >
                <TractorThumbnail
                  color={tractor.color}
                  moderateScale={moderateScale}
                  size={moderateScale(40)}
                />
                <View style={dynamicStyles.listItemContent}>
                  <Text style={dynamicStyles.listItemName}>
                    {tractor.model}
                  </Text>
                  <Text style={dynamicStyles.listItemSubtext}>
                    {tractor.owner}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(20)}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}



