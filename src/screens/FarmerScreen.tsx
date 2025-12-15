import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

type NavigationProp = CompositeNavigationProp<
  StackNavProp<FarmerStackParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

// Mock data - extended list of farmers
const allFarmers = [
  { id: '1', name: 'David Wills', phone: '5214-9710-3671', initials: 'DW' },
  { id: '2', name: 'Adam Kepler', phone: '5214-9710-3671', initials: 'AK' },
  { id: '3', name: 'Natasha Davies', phone: '5214-9710-3671', initials: 'ND' },
  { id: '4', name: 'Peter Jane', phone: '5214-9710-3671', initials: 'PJ' },
  { id: '5', name: 'Peter Jane', phone: '5214-9710-3671', initials: 'PJ' },
  { id: '6', name: 'Peter Jane', phone: '5214-9710-3671', initials: 'PJ' },
  { id: '7', name: 'Sarah Johnson', phone: '5214-9710-3672', initials: 'SJ' },
  { id: '8', name: 'Michael Brown', phone: '5214-9710-3673', initials: 'MB' },
  { id: '9', name: 'Emily Davis', phone: '5214-9710-3674', initials: 'ED' },
  { id: '10', name: 'James Wilson', phone: '5214-9710-3675', initials: 'JW' },
];

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

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

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
  }, [searchQuery, selectedOptions]);

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
          fontSize: moderateScale(14),
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={dynamicStyles.listContainer}
        >
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
        </ScrollView>
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
