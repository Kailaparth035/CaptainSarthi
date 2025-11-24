import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import VideoPlayer from '../components/VideoPlayer';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';

type TractorDetailsRouteParams = {
  tractorId: string;
  tractorModel: string;
  tractorOwner: string;
  tractorColor: string;
};

type SpecificationTab = 'engine' | 'tyre' | 'dimension' | 'transmission';

// Mock data for tractor details
const getTractorDetails = (tractorId: string) => {
  const defaultData = {
    id: tractorId,
    model: '120 Little master',
    series: '12 HP Series',
    description:
      'The Captain Little Master 12 HP is a lightweight tractor specially designed for monsoon use, offering superior performance in wet and muddy fields.',
    fullDescription:
      'The Captain Little Master 12 HP is a lightweight tractor specially designed for monsoon use, offering superior performance in wet and muddy fields. It features advanced water-resistant components and enhanced traction capabilities that make it ideal for agricultural work during the rainy season. The compact design ensures easy maneuverability in tight spaces while maintaining robust performance.',
    specifications: {
      engine: [
        {label: 'Engine power (HP)', value: '12 HP'},
        {label: 'No. of cylinder', value: '1'},
        {label: 'Capacity (CC)', value: '611 CC'},
        {label: 'Rated speed (RPM)', value: '3000 RPM'},
        {label: 'Cooling system', value: 'Water cooled'},
        {label: 'Bore/stroke (mm)', value: '92 / 92 mm'},
      ],
      tyre: [
        {label: 'Front tyre', value: '6.00 x 16'},
        {label: 'Rear tyre', value: '8.3 x 20'},
        {label: 'Tyre type', value: 'Agricultural'},
      ],
      dimension: [
        {label: 'Length (mm)', value: '2400 mm'},
        {label: 'Width (mm)', value: '1200 mm'},
        {label: 'Height (mm)', value: '1400 mm'},
        {label: 'Wheelbase (mm)', value: '1500 mm'},
      ],
      transmission: [
        {label: 'Gearbox', value: '6 Forward + 2 Reverse'},
        {label: 'Clutch', value: 'Single plate'},
        {label: 'PTO speed', value: '540 RPM'},
      ],
    },
    thumbnails: [
      {id: '1', type: 'image', uri: null},
      {id: '2', type: 'image', uri: null},
      {id: '3', type: 'more', count: 2},
    ],
  };

  return defaultData;
};

// Specification Row Component
const SpecRow = ({
  label,
  value,
  moderateScale,
}: {
  label: string;
  value: string;
  moderateScale: (size: number, factor?: number) => number;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(12),
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
      }}>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textTertiary,
            flex: 1,
          },
        ]}>
        {label}
      </Text>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textPrimary,
            flex: 1,
            textAlign: 'right',
            fontWeight: '500',
          },
        ]}>
        {value}
      </Text>
    </View>
  );
};

export default function TractorDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as TractorDetailsRouteParams;
  const [selectedTab, setSelectedTab] = useState<SpecificationTab>('engine');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const tractorDetails = useMemo(
    () => getTractorDetails(params?.tractorId || '1'),
    [params?.tractorId],
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.backgroundLight,
        },
        statusBarBackground: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? insets.top : 0,
          backgroundColor: colors.backgroundLight,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          paddingBottom: moderateScale(12),
          backgroundColor: colors.backgroundLight,
        },
        backButton: {
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: colors.backgroundWhite,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(12),
        },
        headerTitle: {
          ...Typography.boldXxl,
          color: colors.textPrimary,
          fontSize: moderateScale(22),
        },
        scrollContent: {
          padding: moderateScale(16),
          paddingBottom: moderateScale(100),
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        videoContainer: {
          marginBottom: moderateScale(12),
        },
        thumbnailRow: {
          flexDirection: 'row',
          gap: moderateScale(8),
          marginTop: moderateScale(8),
        },
        thumbnail: {
          flex: 1,
          aspectRatio: 16 / 9,
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          overflow: 'hidden',
        },
        thumbnailImage: {
          width: '100%',
          height: '100%',
          backgroundColor: colors.backgroundGray,
        },
        thumbnailMore: {
          width: '100%',
          height: '100%',
          backgroundColor: colors.textSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        thumbnailMoreText: {
          ...Typography.regularMd,
          fontSize: moderateScale(12),
          color: colors.textWhite,
        },
        productTitle: {
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
        },
        productSeries: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.primary,
          marginBottom: moderateScale(12),
        },
        productDescription: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textPrimary,
          lineHeight: moderateScale(20),
          marginBottom: moderateScale(8),
        },
        readMoreLink: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.blue,
        },
        specificationsTitle: {
          ...Typography.boldXxl,
          fontSize: moderateScale(20),
          color: colors.textPrimary,
          marginBottom: moderateScale(16),
        },
        tabContainer: {
          flexDirection: 'row',
          gap: moderateScale(8),
          marginBottom: moderateScale(16),
        },
        tabScrollView: {
          marginBottom: moderateScale(16),
        },
        tabScrollContent: {
          paddingRight: moderateScale(16),
        },
        tab: {
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(8),
          borderRadius: moderateScale(20),
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.backgroundWhite,
        },
        tabSelected: {
          backgroundColor: colors.primary,
        },
        tabText: {
          ...Typography.regularMd,
          fontSize: moderateScale(12),
          color: colors.primary,
        },
        tabTextSelected: {
          color: colors.textWhite,
          ...Typography.semiBoldMd,
        },
      }),
    [moderateScale, insets],
  );

  const currentSpecs =
    tractorDetails.specifications[selectedTab] || tractorDetails.specifications.engine;

  // Prepare images for preview modal - convert thumbnails to ImageItem format
  const previewImages: ImageItem[] = useMemo(() => {
    const images: ImageItem[] = [];
    tractorDetails.thumbnails.forEach((thumb, index) => {
      if (thumb.type === 'image') {
        images.push({
          id: thumb.id,
          uri: thumb.uri || undefined,
          placeholder: `Image ${index + 1}`,
        });
      }
    });
    return images;
  }, [tractorDetails.thumbnails]);

  const handleImagePress = (imageIndexInPreview: number) => {
    setSelectedImageIndex(imageIndexInPreview);
    setPreviewModalVisible(true);
  };

  const handleCloseModal = () => {
    setPreviewModalVisible(false);
  };

  const handleReplaceImage = (imageId: string) => {
    // Handle replace image action
    console.log('Replace image:', imageId);
    // You can add your replace image logic here
  };

  // Update StatusBar when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor(colors.backgroundLight, false);
        StatusBar.setTranslucent(false);
      }
      StatusBar.setBarStyle('dark-content', true);
    }, []),
  );

  return (
      <View style={[dynamicStyles.container]}>
        {Platform.OS === 'ios' && (
          <View style={dynamicStyles.statusBarBackground} />
        )}
        {/* Header */}
        <View style={dynamicStyles.header}>
        <TouchableOpacity
          style={dynamicStyles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <Ionicons
            name="arrow-back"
            size={moderateScale(20)}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={dynamicStyles.headerTitle}>Tractor Details</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Video Player Section */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.videoContainer}>
            <VideoPlayer
              thumbnailUri={undefined}
              videoUri={undefined}
              title={tractorDetails.model}
            />
          </View>

          {/* Thumbnails Row */}
          <View style={dynamicStyles.thumbnailRow}>
            {tractorDetails.thumbnails.map((thumb, index) => {
              // Calculate image index in previewImages array for click handler
              let imageIndexInPreview = 0;
              if (thumb.type === 'image') {
                let count = 0;
                for (let i = 0; i < index; i++) {
                  if (tractorDetails.thumbnails[i].type === 'image') {
                    count++;
                  }
                }
                imageIndexInPreview = count;
              }

              return (
                <TouchableOpacity
                  key={thumb.id}
                  style={dynamicStyles.thumbnail}
                  onPress={() => thumb.type === 'image' && handleImagePress(imageIndexInPreview)}
                  activeOpacity={thumb.type === 'image' ? 0.7 : 1}
                  disabled={thumb.type === 'more'}>
                  {thumb.type === 'more' ? (
                    <View style={dynamicStyles.thumbnailMore}>
                      <Text style={dynamicStyles.thumbnailMoreText}>
                        + {thumb.count} more
                      </Text>
                    </View>
                  ) : (
                    <View style={dynamicStyles.thumbnailImage}>
                      <View
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: colors.backgroundGray,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Text
                          style={[
                            Typography.regularSm,
                            {
                              fontSize: moderateScale(10),
                              color: colors.textTertiary,
                            },
                          ]}>
                          Image {index + 1}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Product Information Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.productTitle}>
            {params?.tractorModel || tractorDetails.model}
          </Text>
          <Text style={dynamicStyles.productSeries}>
            {tractorDetails.series}
          </Text>
          <Text style={dynamicStyles.productDescription}>
            {showFullDescription
              ? tractorDetails.fullDescription
              : tractorDetails.description}
          </Text>
          <TouchableOpacity
            onPress={() => setShowFullDescription(!showFullDescription)}
            activeOpacity={0.7}>
            <Text style={dynamicStyles.readMoreLink}>
              {showFullDescription ? 'Read less' : 'Read more'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Specifications Card */}
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.specificationsTitle}>Specifications</Text>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={dynamicStyles.tabScrollView}
            contentContainerStyle={[dynamicStyles.tabContainer, dynamicStyles.tabScrollContent]}>
            {(['engine', 'tyre', 'dimension', 'transmission'] as SpecificationTab[]).map(
              tab => {
                const isSelected = selectedTab === tab;
                let tabLabel = '';
                switch (tab) {
                  case 'dimension':
                    tabLabel = 'Dimension';
                    break;
                  case 'transmission':
                    tabLabel = 'Transmission';
                    break;
                  default:
                    tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
                }
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      dynamicStyles.tab,
                      isSelected && dynamicStyles.tabSelected,
                    ]}
                    onPress={() => setSelectedTab(tab)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        dynamicStyles.tabText,
                        isSelected && dynamicStyles.tabTextSelected,
                      ]}>
                      {tabLabel}
                    </Text>
                  </TouchableOpacity>
                );
              },
            )}
          </ScrollView>

          {/* Specifications List */}
          {currentSpecs.map((spec, index) => (
            <SpecRow
              key={index}
              label={spec.label}
              value={spec.value}
              moderateScale={moderateScale}
            />
          ))}
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={previewModalVisible}
        images={previewImages}
        initialIndex={selectedImageIndex}
        onClose={handleCloseModal}
        onReplaceImage={handleReplaceImage}
      />
      </View>
  );
}

