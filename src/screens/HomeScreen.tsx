import React, {useMemo, useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  AppState,
  AppStateStatus,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, CommonActions, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {FontFamily, Typography} from '../utils/typography';
import {TabParamList} from '../navigation/TabNavigator';
import {RootStackParamList} from '../navigation/RootNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import {ImagePath} from '../assets/images';

// Initial summary data (will be updated from API)
const initialSummaryData = {
  activeClients: 0,
  tractorModels: 0,
  syncsPending: 0,
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Initial tractors data (will be updated from API)
const initialTractors: any[] = [];

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
  imageUrl,
}: {
  color: string;
  size?: number;
  moderateScale: (percent: number) => number;
  imageUrl?: string | null;
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
        overflow: 'hidden',
      }}>
      {imageUrl ? (
        <Image
          source={{uri: imageUrl}}
          style={{
            width: thumbnailSize,
            height: thumbnailSize,
            borderRadius: thumbnailSize / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <MaterialCommunityIcons
          name="tractor"
          size={moderateScale(24)}
          color={colors.textWhite}
        />
      )}
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
  const {t} = useLanguage();
  const navigation = useNavigation();
  const tabNavigation =
    useNavigation<BottomTabNavigationProp<TabParamList>>();
  const [farmers, setFarmers] = useState<any[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingTractors, setLoadingTractors] = useState(true);
  const [summaryData, setSummaryData] = useState(initialSummaryData);
  const [tractors, setTractors] = useState<any[]>(initialTractors);
  const [refreshing, setRefreshing] = useState(false);
  const [profileName, setProfileName] = useState<string>('');

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Fetch all dashboard data - memoized to prevent unnecessary re-renders
  const fetchAllData = React.useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoadingFarmers(true);
        setLoadingTractors(true);
      }

      // Fetch dashboard data, farmers data, tractors data, and profile data in parallel
      const [dashboardResponse, farmersResponse, tractorsResponse, profileResponse] = await Promise.all([
        getData(Apis.DEALER_DASHBOARD, {}),
        getData(Apis.DEALER_FARMERS, {}),
        getData(Apis.DEALER_TRACTORS, {}),
        getData(Apis.DEALER_PROFILE, {}),
      ]);

      // Process profile data to get name
      if (profileResponse?.status === true && profileResponse?.data) {
        const profileData = profileResponse.data;
        setProfileName(profileData.name || '');
      }

      // Process dashboard data
      if (dashboardResponse?.status === true && dashboardResponse?.dashboardSummaryData) {
        const summary = dashboardResponse.dashboardSummaryData;
        setSummaryData({
          activeClients: summary.activeClients || 0,
          tractorModels: summary.tractorModels || 0,
          syncsPending: summary.syncPending || summary.syncsPending || 0,
        });
      }

      // Process tractors data from API
      // API response structure: { status: true, data: { tractors: [...], current_page, total_pages, total_tractors } }
      console.log('Tractors API Response:', tractorsResponse);
      
      if (tractorsResponse?.status === true && tractorsResponse?.data) {
        // Check if data has tractors array (new structure)
        const tractorsArray = tractorsResponse.data.tractors || 
                            (Array.isArray(tractorsResponse.data) ? tractorsResponse.data : []);
        
        console.log('[HomeScreen] Tractors array extracted:', tractorsArray?.length || 0, 'tractors');
        
        if (Array.isArray(tractorsArray) && tractorsArray.length > 0) {
          const transformedTractors = tractorsArray.map((tractor: any, index: number) => {
            // Get color based on index
            const colorsArray = [colors.tractorGreen, colors.tractorOrange, colors.tractorGreen];
            const color = colorsArray[index % colorsArray.length];
            
            // Use title as model name, fallback to series or description
            const modelName = tractor.title || tractor.series || tractor.description || 'Unknown Model';
            
            // Use series name instead of owner
            const seriesName = tractor.series || 'N/A';
            
            return {
              id: tractor.id?.toString() || index.toString(),
              model: modelName,
              owner: seriesName, // Using series instead of owner
              color: color,
              title: tractor.title,
              series: tractor.series,
              description: tractor.description,
              main_image: getImageUrl(tractor.main_image),
              gallery_images: (tractor.gallery_images || []).map((img: string) => getImageUrl(img)).filter(Boolean),
            };
          });
          setTractors(transformedTractors);
        } else {
          setTractors([]);
        }
      } else if (Array.isArray(tractorsResponse)) {
        // Fallback: if response is directly an array
        const transformedTractors = tractorsResponse.map((tractor: any, index: number) => {
          const colorsArray = [colors.tractorGreen, colors.tractorOrange, colors.tractorGreen];
          const color = colorsArray[index % colorsArray.length];
          const modelName = tractor.title || tractor.series || tractor.description || 'Unknown Model';
          const seriesName = tractor.series || 'N/A';
          
          return {
            id: tractor.id?.toString() || index.toString(),
            model: modelName,
            owner: seriesName, // Using series instead of owner
            color: color,
            title: tractor.title,
            series: tractor.series,
            description: tractor.description,
            main_image: getImageUrl(tractor.main_image),
            gallery_images: (tractor.gallery_images || []).map((img: string) => getImageUrl(img)).filter(Boolean),
          };
        });
        setTractors(transformedTractors);
        console.log('Transformed tractors:', transformedTractors.length);
      } else {
        // No data or unexpected response format
        console.warn('Tractors API - Unexpected response format:', tractorsResponse);
        setTractors([]);
      }

      // Process farmers data
      // API response structure: { status: true, data: { farmers: [...], current_page, total_pages, total_farmers } }
      console.log('[HomeScreen] Farmers API Response:', JSON.stringify(farmersResponse, null, 2));
      
      if (farmersResponse?.status === true && farmersResponse?.data) {
        // Check if data has farmers array (new structure)
        const farmersArray = farmersResponse.data.farmers || 
                           (Array.isArray(farmersResponse.data) ? farmersResponse.data : []);
        
        console.log('[HomeScreen] Farmers array extracted:', farmersArray?.length || 0, 'farmers');
        
        if (Array.isArray(farmersArray) && farmersArray.length > 0) {
          const transformedFarmers = farmersArray.map((farmer: any) => {
            const nameParts = [
              farmer.first_name,
              farmer.middle_name,
              farmer.last_name,
            ].filter(Boolean);
            const fullName = nameParts.join(' ').trim();
            
            return {
              id: farmer.id?.toString() || farmer.farmer_id?.toString() || '',
              farmer_id: farmer.farmer_id || farmer.id?.toString() || '',
              name: fullName || '',
              phone: farmer.mobile || '',
              initials: getInitials(fullName),
            };
          });
          setFarmers(transformedFarmers);
        } else {
          setFarmers([]);
        }
      } else if (Array.isArray(farmersResponse)) {
        // Fallback: if response is directly an array
        const transformedFarmers = farmersResponse.map((farmer: any) => {
          const nameParts = [
            farmer.first_name,
            farmer.middle_name,
            farmer.last_name,
          ].filter(Boolean);
          const fullName = nameParts.join(' ').trim();
          
          return {
            id: farmer.id?.toString() || farmer.farmer_id?.toString() || '',
            farmer_id: farmer.farmer_id || farmer.id?.toString() || '',
            name: fullName || '',
            phone: farmer.mobile || '',
            initials: getInitials(fullName),
          };
        });
        setFarmers(transformedFarmers);
      } else {
        setFarmers([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty arrays on error to prevent infinite loading
      setTractors([]);
      setFarmers([]);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
        setLoadingTractors(false);
      } else {
        setLoadingFarmers(false);
        setLoadingTractors(false);
      }
    }
  }, []);

  // Track app state to refresh when app comes to foreground
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - refresh data
        console.log('[HomeScreen] App came to foreground - refreshing data');
        fetchAllData();
      }
      appState.current = nextAppState;
      setAppStateVisible(appState.current);
    });

    return () => {
      subscription.remove();
    };
  }, [fetchAllData]);

  // Fetch data on mount and whenever screen comes into focus (tab switch, navigation)
  useFocusEffect(
    React.useCallback(() => {
      console.log('[HomeScreen] Screen focused - fetching latest data');
      fetchAllData();
    }, [fetchAllData])
  );

  // Pull to refresh handler
  const onRefresh = () => {
    fetchAllData(true);
  };

  // Get first 4 farmers for home screen
  const displayedFarmers = useMemo(() => {
    return farmers.slice(0, 4);
  }, [farmers]);

  // Check if initial loading (both farmers and tractors loading)
  const isInitialLoading = loadingFarmers || loadingTractors;

  // Skeleton content component
  const renderSkeletonContent = () => {
    return (
      <SkeletonPlaceholder
        backgroundColor={colors.backgroundGray}
        highlightColor={colors.backgroundWhite}
        borderRadius={moderateScale(10)}>
        {/* Summary Cards Skeleton */}
        <SkeletonPlaceholder.Item
          flexDirection="row"
          gap={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          <SkeletonPlaceholder.Item
            flex={1}
            backgroundColor={colors.backgroundWhite}
            borderRadius={moderateScale(12)}
            padding={moderateScale(12)}
            height={moderateScale(80)}
            flexDirection="row"
            alignItems="center">
            <SkeletonPlaceholder.Item
              width={moderateScale(48)}
              height={moderateScale(48)}
              borderRadius={moderateScale(8)}
              marginRight={moderateScale(10)}
            />
            <SkeletonPlaceholder.Item flex={1}>
              <SkeletonPlaceholder.Item
                width="60%"
                height={moderateScale(16)}
                borderRadius={moderateScale(4)}
                marginBottom={moderateScale(4)}
              />
              <SkeletonPlaceholder.Item
                width="80%"
                height={moderateScale(12)}
                borderRadius={moderateScale(4)}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>
          <SkeletonPlaceholder.Item
            flex={1}
            backgroundColor={colors.backgroundWhite}
            borderRadius={moderateScale(12)}
            padding={moderateScale(12)}
            height={moderateScale(80)}
            flexDirection="row"
            alignItems="center">
            <SkeletonPlaceholder.Item
              width={moderateScale(48)}
              height={moderateScale(48)}
              borderRadius={moderateScale(8)}
              marginRight={moderateScale(10)}
            />
            <SkeletonPlaceholder.Item flex={1}>
              <SkeletonPlaceholder.Item
                width="60%"
                height={moderateScale(16)}
                borderRadius={moderateScale(4)}
                marginBottom={moderateScale(4)}
              />
              <SkeletonPlaceholder.Item
                width="80%"
                height={moderateScale(12)}
                borderRadius={moderateScale(4)}
              />
            </SkeletonPlaceholder.Item>
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder.Item>

        {/* Farmers Section Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          padding={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          {/* Section Header Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            justifyContent="space-between"
            marginBottom={moderateScale(16)}>
            <SkeletonPlaceholder.Item
              width="30%"
              height={moderateScale(18)}
              borderRadius={moderateScale(4)}
            />
            <SkeletonPlaceholder.Item
              width="20%"
              height={moderateScale(15)}
              borderRadius={moderateScale(4)}
            />
          </SkeletonPlaceholder.Item>

          {/* Farmers List Skeleton */}
          {[1, 2, 3, 4].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              alignItems="center"
              marginBottom={index < 4 ? moderateScale(10) : 0}
              paddingBottom={index < 4 ? moderateScale(10) : 0}>
              <SkeletonPlaceholder.Item
                width={moderateScale(40)}
                height={moderateScale(40)}
                borderRadius={moderateScale(20)}
                marginRight={moderateScale(16)}
              />
              <SkeletonPlaceholder.Item flex={1}>
                <SkeletonPlaceholder.Item
                  width="60%"
                  height={moderateScale(14)}
                  borderRadius={moderateScale(2)}
                  marginBottom={moderateScale(6)}
                />
                <SkeletonPlaceholder.Item
                  width="40%"
                  height={moderateScale(12)}
                  borderRadius={moderateScale(2)}
                />
              </SkeletonPlaceholder.Item>
              <SkeletonPlaceholder.Item
                width={moderateScale(18)}
                height={moderateScale(18)}
                borderRadius={moderateScale(9)}
              />
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder.Item>

        {/* Tractors Section Skeleton */}
        <SkeletonPlaceholder.Item
          backgroundColor={colors.backgroundWhite}
          borderRadius={moderateScale(12)}
          padding={moderateScale(16)}
          marginBottom={moderateScale(16)}>
          {/* Section Header Skeleton */}
          <SkeletonPlaceholder.Item
            flexDirection="row"
            justifyContent="space-between"
            marginBottom={moderateScale(16)}>
            <SkeletonPlaceholder.Item
              width="30%"
              height={moderateScale(18)}
              borderRadius={moderateScale(4)}
            />
            <SkeletonPlaceholder.Item
              width="20%"
              height={moderateScale(15)}
              borderRadius={moderateScale(4)}
            />
          </SkeletonPlaceholder.Item>

          {/* Tractors List Skeleton */}
          {[1, 2, 3].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              alignItems="center"
              marginBottom={index < 3 ? moderateScale(10) : 0}
              paddingBottom={index < 3 ? moderateScale(10) : 0}>
              <SkeletonPlaceholder.Item
                width={moderateScale(40)}
                height={moderateScale(40)}
                borderRadius={moderateScale(20)}
                marginRight={moderateScale(16)}
              />
              <SkeletonPlaceholder.Item flex={1}>
                <SkeletonPlaceholder.Item
                  width="70%"
                  height={moderateScale(14)}
                  borderRadius={moderateScale(2)}
                  marginBottom={moderateScale(6)}
                />
                <SkeletonPlaceholder.Item
                  width="50%"
                  height={moderateScale(12)}
                  borderRadius={moderateScale(2)}
                />
              </SkeletonPlaceholder.Item>
              <SkeletonPlaceholder.Item
                width={moderateScale(20)}
                height={moderateScale(20)}
                borderRadius={moderateScale(10)}
              />
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder.Item>
      </SkeletonPlaceholder>
    );
  };

  // Skeleton component matching the exact design
  const renderSkeleton = () => {
    return (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {renderSkeletonContent()}
      </ScrollView>
    );
  };

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
          height: moderateScale(80),
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
          { paddingHorizontal: moderateScale(16), paddingTop: insets.top + moderateScale(12) },
        ]}
      >
        <Text style={dynamicStyles.greeting}>
          {t("home.greeting")} {profileName || 'User'}
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: moderateScale(12)}}>
          <TouchableOpacity
            style={dynamicStyles.bellIcon}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to Language screen
              (navigation as any).navigate(SCREEN_NAMES.Language);
            }}
          >
            <Ionicons
              name="language-outline"
              size={moderateScale(22)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.bellIcon}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate within HomeStack
              (navigation as any).navigate(SCREEN_NAMES.Notifications);
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={moderateScale(22)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>
      {isInitialLoading && !refreshing ? (
        renderSkeleton()
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={dynamicStyles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {refreshing ? (
            renderSkeletonContent()
          ) : (
            <>
              {/* Summary Cards */}
        <View style={dynamicStyles.summaryContainer}>
          <SummaryCard
            icon="people"
            value={summaryData.activeClients}
            label={t("home.activeClients")}
            iconColor={colors.iconBlue}
            iconBgColor={colors.light_blue}
            moderateScale={moderateScale}
            dynamicStyles={dynamicStyles}
          />
          <SummaryCard
            icon="tractor"
            value={summaryData.tractorModels}
            label={t("home.tractorModels")}
            iconColor={colors.iconGreen}
            iconBgColor={colors.light_green}
            iconType="material"
            moderateScale={moderateScale}
            dynamicStyles={dynamicStyles}
          />
        </View>

        {/* Sync Card */}
        {summaryData.syncsPending > 0 && (
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
                <Text style={dynamicStyles.summaryLabel}>
                  {t("home.syncsPending")}
                </Text>
              </View>
              <TouchableOpacity
                style={dynamicStyles.syncButton}
                activeOpacity={0.7}
              >
                <Text style={dynamicStyles.syncButtonText}>
                  {t("home.syncNow")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Clients Section */}
        <View style={dynamicStyles.sectionCard}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Farmers</Text>
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
                  })
                );
              }}
            >
              <Text style={dynamicStyles.seeAllText}>{t("home.seeAll")}</Text>
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.listContainer}>
            {displayedFarmers.length > 0 ? (
              displayedFarmers.map((client, index) => (
                <TouchableOpacity
                  key={client.id}
                  style={[
                    dynamicStyles.listItem,
                    index !== displayedFarmers.length - 1 &&
                      dynamicStyles.listItemBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    // Navigate to Farmer tab and then to FarmerDetails
                    tabNavigation.navigate(SCREEN_NAMES.Farmer, {
                      screen: SCREEN_NAMES.FarmerDetails,
                      params: {
                        farmerId: client.id,
                        farmer_id: client.farmer_id || client.id,
                        farmerName: client.name,
                        farmerPhone: client.phone,
                        farmerInitials: client.initials,
                        fromScreen: "Home",
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
                    <Text style={dynamicStyles.listItemName}>
                      {client.name}
                    </Text>
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
              ))
            ) : (
              <View
                style={{ 
                  padding: moderateScale(20), 
                  alignItems: "center",
                  justifyContent: 'center',
                  flex: 1,
                  minHeight: moderateScale(250),
                }}
              >
                <Image
                  source={ImagePath.nofarmerfound}
                  style={{
                    width: moderateScale(120),
                    height: moderateScale(120),
                    marginBottom: moderateScale(16),
                  }}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    Typography.boldXl,
                    { 
                      color: colors.textPrimary,
                      fontSize: moderateScale(18),
                      marginBottom: moderateScale(8),
                    },
                  ]}
                >
                  No farmer added
                </Text>
                <Text
                  style={[
                    Typography.regularMd,
                    { 
                      color: colors.textTertiary,
                      fontSize: moderateScale(14),
                      textAlign: 'center',
                      marginBottom: moderateScale(24),
                      paddingHorizontal: moderateScale(20),
                    },
                  ]}
                >
                  Looks like there are no farmers here yet. Add your first farmer to get started.
                </Text>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: moderateScale(24),
                    paddingVertical: moderateScale(12),
                    borderRadius: moderateScale(25),
                    minWidth: moderateScale(140),
                  }}
                  activeOpacity={0.7}
                  onPress={() => {
                    // Navigate to Farmer tab and then to AddFarmer
                    tabNavigation.navigate(SCREEN_NAMES.Farmer, {
                      screen: SCREEN_NAMES.AddFarmer,
                    } as any);
                  }}
                >
                  <Text
                    style={[
                      Typography.semiBoldMd,
                      {
                        fontSize: moderateScale(14),
                        color: colors.textWhite,
                        textAlign: 'center',
                      },
                    ]}
                  >
                    Add farmer
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Tractors Section */}
        <View style={[dynamicStyles.sectionCard]}>
          <View style={dynamicStyles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>{t("home.tractors")}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                tabNavigation.dispatch(
                  CommonActions.navigate({
                    name: SCREEN_NAMES.Tractors,
                    params: {
                      screen: SCREEN_NAMES.Tractors,
                    },
                  })
                );
              }}
            >
              <Text style={dynamicStyles.seeAllText}>{t("home.seeAll")}</Text>
            </TouchableOpacity>
          </View>
          <View style={dynamicStyles.listContainer}>
            {tractors.length > 0 ? (
              tractors.map((tractor, index) => (
                <TouchableOpacity
                  key={tractor.id}
                  style={[
                    dynamicStyles.listItem,
                    index !== tractors.length - 1 &&
                      dynamicStyles.listItemBorder,
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
                        fromScreen: "Home",
                      },
                    } as any);
                  }}
                >
                  <TractorThumbnail
                    color={tractor.color}
                    moderateScale={moderateScale}
                    size={moderateScale(40)}
                    imageUrl={tractor.main_image}
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
              ))
            ) : (
              <View
                style={{ padding: moderateScale(20), alignItems: "center" }}
              >
                <Text
                  style={[
                    Typography.regularMd,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t("home.noTractors") || "No tractors found"}
                </Text>
              </View>
            )}
          </View>
        </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}



