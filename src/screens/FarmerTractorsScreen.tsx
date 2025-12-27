import React, {useMemo, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {SCREEN_NAMES} from '../constants/screenNames';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';

// Tractor Thumbnail Component
const TractorThumbnail = ({
  color,
  size,
  moderateScale,
  imageUrl,
}: {
  color: string;
  size?: number;
  moderateScale: (size: number, factor?: number) => number;
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

export default function FarmerTractorsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t} = useLanguage();
  const navigation = useNavigation();
  const [tractors, setTractors] = useState<any[]>([]);
  const [loadingTractors, setLoadingTractors] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  // Fetch tractors from API
  const fetchTractors = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoadingTractors(true);
      }
      console.log('[FarmerTractorsScreen] Fetching latest tractors data');
      const response = await getData(Apis.DEALER_TRACTORS, {});
      
      // Handle API response structure: { status: true, data: { tractors: [...], current_page, total_pages, total_tractors } }
      console.log('[FarmerTractorsScreen] Tractors API Response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        // Check if data has tractors array (new structure)
        const tractorsArray = response.data.tractors || 
                           (Array.isArray(response.data) ? response.data : []);
        
        console.log('[FarmerTractorsScreen] Tractors array extracted:', tractorsArray?.length || 0, 'tractors');
        
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
      } else if (Array.isArray(response)) {
        // Fallback: if response is directly an array
        const transformedTractors = response.map((tractor: any, index: number) => {
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
      } else {
        setTractors([]);
      }
    } catch (error) {
      console.error('[FarmerTractorsScreen] Error fetching tractors:', error);
      setTractors([]);
    } finally {
      setLoadingTractors(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    fetchTractors(true);
  }, []);

  // Fetch data on mount and whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTractors();
    }, [])
  );

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
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: moderateScale(60),
        },
        emptyText: {
          ...Typography.regularMd,
          fontSize: moderateScale(16),
          color: colors.textTertiary,
          textAlign: 'center',
          marginTop: moderateScale(12),
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
        {loadingTractors ? (
          <View style={[dynamicStyles.listContainer, dynamicStyles.loadingContainer]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : tractors.length > 0 ? (
          <FlatList
            data={tractors}
            keyExtractor={(item) => item.id}
            renderItem={({item: tractor, index}) => (
              <TouchableOpacity
                style={[
                  dynamicStyles.listItem,
                  index !== tractors.length - 1 &&
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
                }}
              >
                <TractorThumbnail
                  color={tractor.color}
                  moderateScale={moderateScale}
                  size={moderateScale(40)}
                  imageUrl={tractor.main_image}
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
            )}
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
          />
        ) : (
          <View style={[dynamicStyles.listContainer, dynamicStyles.emptyContainer]}>
            <MaterialCommunityIcons
              name="tractor"
              size={moderateScale(64)}
              color={colors.textTertiary}
            />
            <Text style={dynamicStyles.emptyText}>No tractors found</Text>
          </View>
        )}
      </View>
    </View>
  );
}
