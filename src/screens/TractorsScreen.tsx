import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import FilterModal from '../components/FilterModal';
import {SCREEN_NAMES} from '../constants/screenNames';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export default function TractorsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('model');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Filter categories for the modal
  const filterCategories = [
    {
      id: 'model',
      label: 'Model',
      options: [
        {id: 'a-to-z', label: 'A to Z', value: 'a-to-z'},
        {id: 'z-to-a', label: 'Z to A', value: 'z-to-a'},
      ],
    },
    {
      id: 'owner',
      label: 'Owner',
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
  ];

  const filteredTractors = useMemo(() => {
    let filtered = [...allTractors];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        tractor =>
          tractor.model.toLowerCase().includes(query) ||
          tractor.owner.toLowerCase().includes(query),
      );
    }

    // Apply sort based on selected option
    const modelOption = selectedOptions['model'];
    const ownerOption = selectedOptions['owner'];
    const dateOption = selectedOptions['date'];

    if (modelOption) {
      filtered.sort((a, b) => {
        switch (modelOption) {
          case 'a-to-z':
            return a.model.localeCompare(b.model);
          case 'z-to-a':
            return b.model.localeCompare(a.model);
          default:
            return 0;
        }
      });
    } else if (ownerOption) {
      filtered.sort((a, b) => {
        switch (ownerOption) {
          case 'a-to-z':
            return a.owner.localeCompare(b.owner);
          case 'z-to-a':
            return b.owner.localeCompare(a.owner);
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
        <Text style={dynamicStyles.headerTitle}>Tractors</Text>
        {/* <TouchableOpacity
          style={dynamicStyles.addButton}
          activeOpacity={0.7}>
          <Text style={dynamicStyles.addButtonText}>Add new</Text>
        </TouchableOpacity> */}
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
        {filteredTractors.map((tractor, index) => (
          <TouchableOpacity
            key={tractor.id}
            style={[
              dynamicStyles.listItem,
              index !== filteredTractors.length - 1 &&
                dynamicStyles.listItemBorder,
            ]}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate(SCREEN_NAMES.TractorDetails, {
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

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={filters => {
          setSelectedCategory(filters.category || 'model');
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
