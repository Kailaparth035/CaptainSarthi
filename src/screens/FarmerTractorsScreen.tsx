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
  ImageBackground,
  BackHandler,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {FarmerTabParamList} from '../navigation/FarmerTabNavigator';
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
import { ImagePath } from '../assets/images';

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

function mapTractorsToListItems(
  tractorsArray: any[],
  colorStartIndex: number,
) {
  return tractorsArray.map((tractor: any, index: number) => {
    const colorsArray = [
      colors.tractorGreen,
      colors.tractorOrange,
      colors.tractorGreen,
    ];
    const color = colorsArray[(colorStartIndex + index) % colorsArray.length];
    const modelName =
      tractor.title ||
      tractor.series ||
      tractor.description ||
      'Unknown Model';
    const seriesName = tractor.series || 'N/A';
    return {
      id: tractor.id?.toString() ?? `${colorStartIndex + index}`,
      model: modelName,
      owner: seriesName,
      color,
      title: tractor.title,
      series: tractor.series,
      description: tractor.description,
      main_image: getImageUrl(tractor.main_image),
      gallery_images: (tractor.gallery_images || [])
        .map((img: string) => getImageUrl(img))
        .filter(Boolean),
    };
  });
}

export default function FarmerTractorsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const {t, currentLanguage, currentLanguageId} = useLanguage();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<FarmerTabParamList>>();
  const [tractors, setTractors] = useState<any[]>([]);
  const [loadingTractors, setLoadingTractors] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Update StatusBar and bottom bar to match screen background color
  useDynamicStatusBar({
    backgroundColor: colors.backgroundLight,
    bottomBarColor: colors.backgroundLight,
  });

  const fetchTractors = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoadingTractors(true);
        }

        const selectedLanguageId = currentLanguageId || 1;
        const params: Record<string, string> = {
          language_id: String(selectedLanguageId),
        };

        console.log('[FarmerTractorsScreen] Fetch tractors', params);
        const response = await getData(Apis.DEALER_TRACTORS, params);
        console.log('[FarmerTractorsScreen] Tractors API Response:', response);

        if (response?.status === true && response?.data) {
          const tractorsArray =
            response.data.tractors ||
            (Array.isArray(response.data) ? response.data : []);

          const batch = Array.isArray(tractorsArray) ? tractorsArray : [];
          if (batch.length > 0) {
            const mapped = mapTractorsToListItems(batch, 0);
            setTractors(mapped);
          } else {
            setTractors([]);
          }
        } else if (Array.isArray(response)) {
          const batch = response;
          if (batch.length > 0) {
            const mapped = mapTractorsToListItems(batch, 0);
            setTractors(mapped);
          } else {
            setTractors([]);
          }
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
    },
    [currentLanguageId],
  );

  const onRefresh = useCallback(() => {
    fetchTractors(true);
  }, [fetchTractors]);

  useFocusEffect(
    useCallback(() => {
      fetchTractors(false);

      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        tabNavigation.navigate(SCREEN_NAMES.Home);
        return true;
      });

      return () => backHandler.remove();
    }, [tabNavigation, currentLanguage, fetchTractors]),
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
          minHeight: moderateScale(64),
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
          flexShrink: 1,
        },
        listItemSubtext: {
          ...Typography.regularSm,
          color: colors.textTertiary,
          fontSize: moderateScale(12),
          flexShrink: 1,
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

  const renderTractorItem = useCallback(
    ({item: tractor, index}: {item: any; index: number}) => (
      <TouchableOpacity
        style={[
          dynamicStyles.listItem,
          index !== tractors.length - 1 && dynamicStyles.listItemBorder,
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
          <View
            style={[
              dynamicStyles.listContainer,
              dynamicStyles.loadingContainer,
            ]}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : tractors.length > 0 ? (
          <FlatList
            data={tractors}
            keyExtractor={(item) => item.id}
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
            <Text style={dynamicStyles.emptyText}>{t('home.noTractors')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
