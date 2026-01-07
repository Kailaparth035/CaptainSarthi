  import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import { Typography } from '../utils/typography';
import FilterModal from '../components/FilterModal';
import { SCREEN_NAMES } from '../constants/screenNames';
import { RootStackParamList } from '../navigation/RootNavigator';
import { FarmerStackParamList } from '../navigation/stacks/FarmerStack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp as StackNavProp } from '@react-navigation/native-stack';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {ImagePath} from '../assets/images';
import {Image} from 'react-native';

type NavigationProp = CompositeNavigationProp<
  StackNavProp<FarmerStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Avatar Component
const Avatar = ({
  initials,
  size,
  moderateScale,
}: {
  initials: string;
  size?: number;
  moderateScale: (size: number, factor?: number) => number;
}) => {
  const avatarSize = size || moderateScale(48);
  return (
    <View
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        backgroundColor: colors.light_dark_yellow,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={[
          Typography.semiBoldMd,
          {
            fontSize: moderateScale(14),
            color: colors.textSecondary,
          },
        ]}
      >
        {initials}
      </Text>
    </View>
  );
};

export default function FarmerScreen() {
  const insets = useSafeAreaInsets();
  const { moderateScale } = useDeviceMetrics();
  const {t} = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('name');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [farmers, setFarmers] = useState<any[]>([]);
  const [allFarmers, setAllFarmers] = useState<any[]>([]); // Store all farmers for filtering
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Fetch farmers from API
  const fetchFarmers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoadingFarmers(true);
      }
      console.log('[FarmerScreen] Fetching latest farmers data');
      // GET API - only requires token (automatically added via interceptor)
      const response = await getData(Apis.DEALER_FARMERS, {});
      
      // Handle API response structure: { status: true, data: { farmers: [...], current_page, total_pages, total_farmers } }
      console.log('[FarmerScreen] Farmers API Response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        // Check if data has farmers array (new structure)
        const farmersArray = response.data.farmers || 
                           (Array.isArray(response.data) ? response.data : []);
        
        console.log('[FarmerScreen] Farmers array extracted:', farmersArray?.length || 0, 'farmers');
        
        if (Array.isArray(farmersArray) && farmersArray.length > 0) {
          // Transform API response to match expected format
          const transformedFarmers = farmersArray.map((farmer: any) => {
            // Combine first_name, middle_name, last_name to create full name
            const nameParts = [
              farmer.first_name,
              farmer.middle_name,
              farmer.last_name,
            ].filter(Boolean);
            const fullName = nameParts.join(' ').trim();
            
            // Extract category ID - check multiple possible field names
            const categoryId = farmer.category_id || 
                              farmer.categoryId || 
                              farmer.category?.id || 
                              farmer.category || 
                              null;
            
            return {
              id: farmer.id?.toString() || farmer.farmer_id?.toString() || '',
              farmer_id: farmer.farmer_id || farmer.id?.toString() || '',
              name: fullName || '',
              phone: farmer.mobile || '',
              initials: getInitials(fullName),
              categoryId: categoryId ? categoryId.toString() : null, // Store category ID as string
            };
          });
          setAllFarmers(transformedFarmers); // Store all farmers first
          setFarmers(transformedFarmers);
          
          // Log category IDs for debugging
          const categoryIds = transformedFarmers
            .map(f => f.categoryId)
            .filter(Boolean)
            .filter((v, i, a) => a.indexOf(v) === i); // Get unique category IDs
          console.log('[FarmerScreen] Unique category IDs in farmers:', categoryIds);
        } else {
          // No farmers in response
          setFarmers([]);
          setAllFarmers([]);
        }
      } else if (Array.isArray(response)) {
        // Fallback: if response is directly an array
        const transformedFarmers = response.map((farmer: any) => {
          const nameParts = [
            farmer.first_name,
            farmer.middle_name,
            farmer.last_name,
          ].filter(Boolean);
          const fullName = nameParts.join(' ').trim();
          
          // Extract category ID - check multiple possible field names
          const categoryId = farmer.category_id || 
                            farmer.categoryId || 
                            farmer.category?.id || 
                            farmer.category || 
                            null;
          
          return {
            id: farmer.id?.toString() || farmer.farmer_id?.toString() || '',
            farmer_id: farmer.farmer_id || farmer.id?.toString() || '',
            name: fullName || '',
            phone: farmer.mobile || '',
            initials: getInitials(fullName),
            categoryId: categoryId ? categoryId.toString() : null, // Store category ID as string
          };
        });
        setFarmers(transformedFarmers);
        setAllFarmers(transformedFarmers); // Store all farmers
      } else {
        // No data or unexpected response format
        setFarmers([]);
        setAllFarmers([]);
      }
    } catch (error) {
      console.error('Error fetching farmers:', error);
      setFarmers([]);
    } finally {
      setLoadingFarmers(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchFarmers(true);
    fetchCategories();
  }, []);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      console.log('[FarmerScreen] Fetching categories');
      const response = await getData(Apis.DEALER_CATEGORIES, {});
      
      if (response?.status === true && response?.data) {
        const categoriesData = response.data.map((cat: any) => ({
          id: cat.id?.toString() || '',
          name: cat.name || '',
        }));
        setCategories(categoriesData);
        console.log('[FarmerScreen] Categories loaded:', categoriesData);
        console.log('[FarmerScreen] Category IDs:', categoriesData.map(c => c.id));
      } else {
        console.warn('[FarmerScreen] Failed to fetch categories:', response);
        setCategories([]);
      }
    } catch (error) {
      console.error('[FarmerScreen] Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch data on mount and whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchFarmers();
      fetchCategories();
    }, [])
  );

  // Filter categories for the modal - dynamically generated from API
  const filterCategories = useMemo(() => {
    const categoriesList = [
      {
        id: 'name',
        label: t('farmer.name'),
        options: [
          {id: 'a-to-z', label: t('tractors.aToZ'), value: 'a-to-z'},
          {id: 'z-to-a', label: t('tractors.zToA'), value: 'z-to-a'},
        ],
      },
      {
        id: 'date',
        label: t('tractors.date'),
        options: [
          {id: 'newest', label: t('tractors.newestFirst'), value: 'newest'},
          {id: 'oldest', label: t('tractors.oldestFirst'), value: 'oldest'},
        ],
      },
    ];

    // Add category filter if categories are available
    if (categories.length > 0) {
      const categoryOptions = [
        {id: 'all', label: t('farmer.allCategories'), value: 'all'},
        ...categories.map(cat => ({
          id: `cat-${cat.id}`,
          label: cat.name,
          value: cat.id,
        })),
      ];

      categoriesList.push({
        id: 'category',
        label: t('farmer.category'),
        options: categoryOptions,
      });
    }

    return categoriesList;
  }, [categories]);

  const filteredFarmers = useMemo(() => {
    let filtered = [...allFarmers]; // Start with all farmers

    // Apply category filter first
    const categoryOption = selectedOptions['category'];
    if (categoryOption && categoryOption !== 'all') {
      const selectedCategoryId = categoryOption.toString();
      console.log('[FarmerScreen] Filtering by category ID:', selectedCategoryId);
      console.log('[FarmerScreen] Total farmers before filter:', filtered.length);
      
      filtered = filtered.filter(farmer => {
        const farmerCategoryId = farmer.categoryId?.toString();
        const matches = farmerCategoryId === selectedCategoryId;
        
        if (matches) {
          console.log(`[FarmerScreen] Farmer ${farmer.name} matches category ${selectedCategoryId} (farmer category: ${farmerCategoryId})`);
        }
        
        return matches;
      });
      
      console.log('[FarmerScreen] Total farmers after category filter:', filtered.length);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        farmer =>
          farmer.name.toLowerCase().includes(query) ||
          farmer.phone.includes(query),
      );
    }

    // Apply sort based on selected option
    const nameOption = selectedOptions['name'];
    const dateOption = selectedOptions['date'];

    if (nameOption) {
      filtered.sort((a, b) => {
        switch (nameOption) {
          case 'a-to-z':
            return a.name.localeCompare(b.name);
          case 'z-to-a':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
    } else if (dateOption) {
      // For date sorting, you would need actual date data
      // This is a placeholder - adjust based on your data structure
      filtered.sort((a, b) => {
        switch (dateOption) {
          case 'newest':
            // Assuming newer items have higher IDs (adjust based on your data)
            return parseInt(b.id) - parseInt(a.id);
          case 'oldest':
            return parseInt(a.id) - parseInt(b.id);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [allFarmers, searchQuery, selectedOptions]);

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
        searchContainer: {
          flexDirection: 'row',
          paddingHorizontal: moderateScale(16),
          paddingVertical:moderateScale(8),
          backgroundColor: colors.backgroundLight,
          gap: moderateScale(12),
        },
        searchBar: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.white,
          borderColor:colors.placeholderText,
          borderWidth:1,
          borderRadius: moderateScale(20),
          paddingHorizontal: moderateScale(12),
          height: moderateScale(40),
        },
        searchIcon: {
          marginRight: moderateScale(8),
        },
        searchInput: {
          flex: 1,
          color: colors.textPrimary,
          ...Typography.regularMd,
        },
        filterButton: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.white,
          borderColor:colors.placeholderText,
          borderWidth:1,
          alignItems: 'center',
          justifyContent: 'center',
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
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: moderateScale(40),
          paddingHorizontal: moderateScale(20),
        },
        emptyImage: {
          width: moderateScale(120),
          height: moderateScale(120),
          marginBottom: moderateScale(16),
        },
        emptyTitle: {
          ...Typography.boldXl,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
          textAlign: 'center',
          marginBottom: moderateScale(8),
        },
        emptyText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
          textAlign: 'center',
          marginBottom: moderateScale(24),
          paddingHorizontal: moderateScale(20),
        },
        addFarmerButton: {
          backgroundColor: colors.primary,
          paddingHorizontal: moderateScale(24),
          paddingVertical: moderateScale(12),
          borderRadius: moderateScale(25),
          minWidth: moderateScale(140),
        },
        addFarmerButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(14),
          color: colors.textWhite,
          textAlign: 'center',
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: moderateScale(60),
        },
      }),
    [moderateScale, insets.top],
  );

  // Skeleton content component
  const renderSkeletonContent = () => {
    return (
      <View style={dynamicStyles.listContainer}>
        <SkeletonPlaceholder
          backgroundColor={colors.backgroundGray}
          highlightColor={colors.backgroundWhite}
          borderRadius={moderateScale(10)}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
            <SkeletonPlaceholder.Item
              key={index}
              flexDirection="row"
              alignItems="center"
              paddingHorizontal={moderateScale(16)}
              paddingVertical={moderateScale(12)}>
              <SkeletonPlaceholder.Item
                width={moderateScale(40)}
                height={moderateScale(40)}
                borderRadius={moderateScale(20)}
                marginRight={moderateScale(12)}
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
                width={moderateScale(18)}
                height={moderateScale(18)}
                borderRadius={moderateScale(9)}
              />
            </SkeletonPlaceholder.Item>
          ))}
        </SkeletonPlaceholder>
      </View>
    );
  };

  // Skeleton component matching the exact design
  const renderSkeleton = () => {
    return renderSkeletonContent();
  };

  return (
    <View style={[dynamicStyles.container]}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>{t('farmer.title')}</Text>
        {!loadingFarmers && !refreshing && (
          <TouchableOpacity
            style={dynamicStyles.addButton}
            onPress={() => navigation.navigate(SCREEN_NAMES.AddFarmer)}
            activeOpacity={0.7}>
            <Text style={dynamicStyles.addButtonText}>{t('farmer.addNew')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search and Filter */}
      {!loadingFarmers && !refreshing && (
        <View style={dynamicStyles.searchContainer}>
          <View style={dynamicStyles.searchBar}>
            <Ionicons
              name="search-outline"
              size={moderateScale(20)}
              color={colors.textTertiary}
              style={dynamicStyles.searchIcon}
            />
            <TextInput
              style={dynamicStyles.searchInput}
              placeholder={t('common.search')}
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={dynamicStyles.filterButton}
            activeOpacity={0.7}
            onPress={() => setIsFilterModalVisible(true)}>
            <Ionicons
              name="options-outline"
              size={moderateScale(20)}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Farmers List */}
      <View
        style={{
          flex: 1,
          padding: moderateScale(10),
          backgroundColor: colors.backgroundLight,
        }}
      >
        {loadingFarmers && !refreshing ? (
          renderSkeleton()
        ) : filteredFarmers.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={dynamicStyles.listContainer}
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
                {filteredFarmers.map((farmer, index) => (
              <TouchableOpacity
                key={farmer.id}
                style={[
                  dynamicStyles.listItem,
                  index !== filteredFarmers.length - 1 &&
                    dynamicStyles.listItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate(SCREEN_NAMES.FarmerDetails, {
                    farmerId: farmer.id,
                    farmer_id: farmer.farmer_id,
                    farmerName: farmer.name,
                    farmerPhone: farmer.phone,
                    farmerInitials: farmer.initials,
                    fromScreen: 'List',
                  });
                }}
              >
                <Avatar
                  initials={farmer.initials}
                  moderateScale={moderateScale}
                  size={moderateScale(40)}
                />
                <View style={dynamicStyles.listItemContent}>
                  <Text style={dynamicStyles.listItemName}>{farmer.name}</Text>
                  <Text style={dynamicStyles.listItemSubtext}>
                    {farmer.phone}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(18)}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        ) : (
          <View style={[dynamicStyles.listContainer, dynamicStyles.emptyContainer]}>
            <Image
              source={ImagePath.nofarmerfound}
              style={dynamicStyles.emptyImage}
              resizeMode="contain"
            />
            <Text style={dynamicStyles.emptyTitle}>{t("home.noFarmerAdded")}</Text>
            <Text style={dynamicStyles.emptyText}>
              {t("home.noFarmerDescription")}
            </Text>
            <TouchableOpacity
              style={dynamicStyles.addFarmerButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(SCREEN_NAMES.AddFarmer)}
            >
              <Text style={dynamicStyles.addFarmerButtonText}>{t("home.addFarmer")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={filters => {
          setSelectedCategory(filters.category || 'name');
          setSelectedOptions(filters.options || {});
        }}
        onReset={() => {
          setSelectedCategory('name');
          setSelectedOptions({});
        }}
        title="Filters"
        categories={filterCategories}
        selectedCategory={selectedCategory}
        selectedOptions={selectedOptions}
      />
    </View>
  );
}
