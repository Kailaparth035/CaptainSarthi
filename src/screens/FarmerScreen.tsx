import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';

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
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('name');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [allFarmers, setAllFarmers] = useState<any[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Fetch farmers from API
  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        setLoadingFarmers(true);
        console.log('FarmerScreen: Fetching farmers from API...');
        // GET API - only requires token (automatically added via interceptor)
        const response = await getData(Apis.DEALER_FARMERS, {});
        console.log('FarmerScreen: API Response:', response);
        
        // Handle API response structure: { status: true, data: [...] }
        if (response?.status === true && Array.isArray(response?.data)) {
          console.log('FarmerScreen: Processing response.data array, count:', response.data.length);
          // Transform API response to match expected format
          const transformedFarmers = response.data.map((farmer: any) => {
            // Combine first_name, middle_name, last_name to create full name
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
          console.log('FarmerScreen: Transformed farmers:', transformedFarmers.length);
          setAllFarmers(transformedFarmers);
        } else if (Array.isArray(response)) {
          console.log('FarmerScreen: Processing direct array response, count:', response.length);
          // Fallback: if response is directly an array
          const transformedFarmers = response.map((farmer: any) => {
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
          console.log('FarmerScreen: Transformed farmers (array):', transformedFarmers.length);
          setAllFarmers(transformedFarmers);
        } else {
          console.warn('FarmerScreen: Unexpected response format:', response);
        }
      } catch (error) {
        console.error('FarmerScreen: Error fetching farmers:', error);
      } finally {
        setLoadingFarmers(false);
      }
    };

    fetchFarmers();
  }, []);

  // Filter categories for the modal
  const filterCategories = [
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

  const filteredFarmers = useMemo(() => {
    let filtered = [...allFarmers];

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
  }, [searchQuery, selectedOptions, allFarmers]);

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
          paddingTop: insets.top,
          paddingBottom: moderateScale(12),
          backgroundColor: colors.backgroundLight,
        },
        headerTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
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
          fontSize: moderateScale(14),
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
      }),
    [moderateScale, insets.top],
  );

  return (
    <View style={[dynamicStyles.container]}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>Farmers</Text>
        <TouchableOpacity
          style={dynamicStyles.addButton}
          onPress={() => navigation.navigate(SCREEN_NAMES.AddFarmer)}
          activeOpacity={0.7}>
          <Text style={dynamicStyles.addButtonText}>Add new</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
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
            placeholder="Search"
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

      {/* Farmers List */}
      <View
        style={{
          flex: 1,
          padding: moderateScale(10),
          backgroundColor: colors.backgroundLight,
        }}
      >
        {loadingFarmers ? (
          <View style={[dynamicStyles.listContainer, {padding: moderateScale(20), alignItems: 'center', justifyContent: 'center'}]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredFarmers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({item, index}) => (
              <TouchableOpacity
                style={[
                  dynamicStyles.listItem,
                  index !== filteredFarmers.length - 1 &&
                    dynamicStyles.listItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate(SCREEN_NAMES.FarmerDetails, {
                    farmerId: item.id,
                    farmer_id: item.farmer_id || item.id,
                    farmerName: item.name,
                    farmerPhone: item.phone,
                    farmerInitials: item.initials,
                    fromScreen: 'List',
                  });
                }}
              >
                <Avatar
                  initials={item.initials}
                  moderateScale={moderateScale}
                  size={moderateScale(40)}
                />
                <View style={dynamicStyles.listItemContent}>
                  <Text style={dynamicStyles.listItemName}>{item.name}</Text>
                  <Text style={dynamicStyles.listItemSubtext}>
                    {item.phone}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={moderateScale(18)}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{padding: moderateScale(20), alignItems: 'center'}}>
                <Text style={[Typography.regularMd, {color: colors.textSecondary}]}>
                  No farmers found
                </Text>
              </View>
            }
            contentContainerStyle={[
              dynamicStyles.listContainer,
              filteredFarmers.length === 0 && {flex: 1, justifyContent: 'center'}
            ]}
            showsVerticalScrollIndicator={false}
          />
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
        title="Filters"
        categories={filterCategories}
        selectedCategory={selectedCategory}
        selectedOptions={selectedOptions}
      />
    </View>
  );
}
