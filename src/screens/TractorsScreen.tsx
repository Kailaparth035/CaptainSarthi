import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ImageBackground,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {TabParamList} from '../navigation/TabNavigator';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import {SCREEN_NAMES} from '../constants/screenNames';
import {RootStackParamList} from '../navigation/RootNavigator';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {useLanguage} from '../contexts/LanguageContext';
import {getData} from '../Service/Apimethod';
import Apis from '../Service/constant';
import {getImageUrl} from '../utils/imageUtils';
import { ImagePath } from '../assets/images';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

export default function TractorsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t, currentLanguage, currentLanguageId} = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
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
      const selectedLanguageId = currentLanguageId || 1; // Default to English (1)
      const params = {
        language_id: String(selectedLanguageId),
      };
      console.log('[TractorsScreen] Fetching latest tractors data', params);
      const response = await getData(Apis.DEALER_TRACTORS, params);
      
      // Handle API response structure: { status: true, data: { tractors: [...], current_page, total_pages, total_tractors } }
      console.log('[TractorsScreen] Tractors API Response:', JSON.stringify(response, null, 2));
      
      if (response?.status === true && response?.data) {
        // Check if data has tractors array (new structure)
        const allTractorsArray = response.data.tractors || 
                            (Array.isArray(response.data) ? response.data : []);
        
        // Filter tractors based on current language (exclude null language_id)
        const tractorsArray = allTractorsArray.filter((tractor: any) => {
          return tractor.language_id === selectedLanguageId;
        });
        
        console.log('[TractorsScreen] Tractors array extracted (filtered by language):', tractorsArray?.length || 0, 'tractors');
        
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
      console.error('Error fetching tractors:', error);
      setTractors([]);
    } finally {
      setLoadingTractors(false);
      setRefreshing(false);
    }
  };

  // Handle pull to refresh
  const onRefresh = React.useCallback(() => {
    fetchTractors(true);
  }, []);

  // Fetch data on mount and whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchTractors();

      // Handle back button - navigate to Home tab
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        tabNavigation.navigate(SCREEN_NAMES.Home);
        return true;
      });

      return () => backHandler.remove();
    }, [tabNavigation, currentLanguage])
  );

  // Refetch tractors when language changes
  useEffect(() => {
    fetchTractors();
  }, [currentLanguage]);


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
          ...Typography.bold,
          fontSize: moderateScale(20),
          color: colors.textTertiary,
          textAlign: 'center',
          marginTop: moderateScale(15),
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

  const renderTractorItem = React.useCallback(
    ({item: tractor, index}: {item: any; index: number}) => (
      <TouchableOpacity
        style={[
          dynamicStyles.listItem,
          index !== tractors.length - 1 && dynamicStyles.listItemBorder,
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
          imageUrl={tractor.main_image}
        />
        <View style={dynamicStyles.listItemContent}>
          <Text style={dynamicStyles.listItemName}>{tractor.model}</Text>
          <Text style={dynamicStyles.listItemSubtext}>{tractor.owner}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={moderateScale(18)}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    ),
    [dynamicStyles, tractors.length, navigation, moderateScale],
  );

  return (
    <View style={[dynamicStyles.container]}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.headerTitle}>{t("tractors.title")}</Text>
        {/* <TouchableOpacity
          style={dynamicStyles.addButton}
          activeOpacity={0.7}>
          <Text style={dynamicStyles.addButtonText}>{t("farmer.addNew")}</Text>
        </TouchableOpacity> */}
      </View>

      {/* Tractors List */}
      <View
        style={{
          flex: 1,
          padding: moderateScale(10),
          backgroundColor: colors.backgroundLight,
        }}
      >
        {loadingTractors && !refreshing ? (
          renderSkeletonContent()
        ) : tractors.length > 0 ? (
          <FlatList
            data={tractors}
            keyExtractor={item => item.id}
            renderItem={renderTractorItem}
            showsVerticalScrollIndicator={false}
            style={dynamicStyles.listContainer}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={7}
            initialNumToRender={10}
            updateCellsBatchingPeriod={50}
            contentContainerStyle={{paddingBottom: moderateScale(8)}}
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
          <View
            style={[dynamicStyles.listContainer, dynamicStyles.emptyContainer]}
          >
            <ImageBackground
              source={ImagePath.noItemBgColor}
              style={{
                width: moderateScale(250),
                height: moderateScale(221),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="tractor"
                size={moderateScale(80)}
                color={colors.primary}
              />
            </ImageBackground>
            <Text style={dynamicStyles.emptyText}>{t("home.noTractors")}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
