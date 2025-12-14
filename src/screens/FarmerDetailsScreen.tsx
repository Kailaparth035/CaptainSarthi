import React, {useMemo, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRoute, useNavigation} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {TabParamList} from '../navigation/TabNavigator';
import {SCREEN_NAMES} from '../constants/screenNames';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import ImagePreviewModal, {ImageItem} from '../components/ImagePreviewModal';
import {useDynamicStatusBar} from '../hooks/useDynamicStatusBar';
import {getData} from '../Service/Apimethod';
import Apis, {API_BASE_URL} from '../Service/constant';

type FarmerDetailsRouteParams = {
  farmerId: string;
  farmer_id?: string;
  farmerName: string;
  farmerPhone: string;
  farmerInitials: string;
  fromScreen?: 'Home' | 'List';
};


// Info Row Component
const InfoRow = ({
  label,
  value,
  moderateScale,
  valueUnderlined = false,
  isShowBorderBottom = true
}: {
  label: string;
  value: string;
  moderateScale: (size: number, factor?: number) => number;
  valueUnderlined?: boolean;
  isShowBorderBottom?: boolean;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: moderateScale(12),
        borderBottomWidth: isShowBorderBottom ?  1 : 0, 
        borderBottomColor: colors.borderLight,
      }}>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textTertiary,
            flex: 0.35,
          },
        ]}>
        {label}:
      </Text>
      <Text
        style={[
          Typography.regularMd,
          {
            fontSize: moderateScale(14),
            color: colors.textPrimary,
            flex: 0.65,
            textAlign: 'right',
            textDecorationLine: valueUnderlined ? 'underline' : 'none',
          },
        ]}>
        {value}
      </Text>
    </View>
  );
};

export default function FarmerDetailsScreen() {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const route = useRoute();
  const navigation = useNavigation();
  const tabNavigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const params = route.params as FarmerDetailsRouteParams;
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedTractorIndex, setSelectedTractorIndex] = useState(0);
  const [farmerDetails, setFarmerDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString('default', {month: 'short'});
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get full image URL
  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // If relative path, prepend base URL
    return `${API_BASE_URL}${imagePath}`;
  };

  // Fetch farmer details from API using clientId
  useEffect(() => {
    const fetchFarmerDetails = async () => {
      try {
        setLoading(true);
        const clientId = params?.farmer_id || params?.farmerId;
        
        if (!clientId) {
          console.error('No farmer_id provided');
          setLoading(false);
          return;
        }

        // Call API with clientId as query parameter
        const response = await getData(Apis.DEALER_FARMERS, { clientId });
        
        // Handle API response structure: { status: true, data: {...} }
        if (response?.status === true && response?.data) {
          const farmerData = response.data;
          
          // Combine firstName, middleName, lastName
          const nameParts = [
            farmerData.firstName,
            farmerData.middleName,
            farmerData.lastName,
          ].filter(Boolean);
          const fullName = nameParts.join(' ').trim();
          
          // Transform tractors array
          const transformedTractors = (farmerData.tractors || []).map((tractor: any) => ({
            id: tractor.tractorId?.toString() || '',
            tractorId: tractor.tractorId,
            model: '', // Not provided in API response
            chassisNo: tractor.chassisNo || '',
            vehicleNo: tractor.vehicleNo || '',
            engineNo: tractor.engineNo || '',
            mobile: tractor.ownerMobile || '',
            dateOfInvoice: formatDate(tractor.dateOfInvoice) || '',
            whoDrives: tractor.whoDrives || '',
            tractorImage: getImageUrl(tractor.tractorImage),
            rcImages: (tractor.rcImages || []).map((img: string) => getImageUrl(img)).filter(Boolean),
          }));
          
          // Transform API response to match expected format
          setFarmerDetails({
            id: farmerData.farmerId || params?.farmerId || '',
            farmer_id: farmerData.farmerId || '',
            firstName: farmerData.firstName || '',
            middleName: farmerData.middleName || '',
            lastName: farmerData.lastName || '',
            fullName: fullName,
            mobile: farmerData.mobile || '',
            dateOfBirth: formatDate(farmerData.dateOfBirth) || '',
            dateOfMarriage: formatDate(farmerData.dateOfMarriage) || '',
            dealershipName: farmerData.dealershipName || '',
            profileImage: getImageUrl(farmerData.profileImage),
            tractors: transformedTractors,
          });
        } else {
          // API didn't return expected structure
          console.warn('Unexpected API response format:', response);
          setFarmerDetails(null);
        }
      } catch (error) {
        console.error('Error fetching farmer details:', error);
        setFarmerDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerDetails();
  }, [params?.farmer_id, params?.farmerId]);

  // Prepare images for preview modal from API data based on selected tractor
  const previewImages: ImageItem[] = useMemo(() => {
    const images: ImageItem[] = [];
    
    if (!farmerDetails || !farmerDetails.tractors || farmerDetails.tractors.length === 0) {
      return images;
    }
    
    // Get images from the selected tractor
    const tractor = farmerDetails.tractors[selectedTractorIndex];
    if (!tractor) return images;
    
    // Add tractor main image if available
    if (tractor.tractorImage) {
      images.push({
        id: 'tractor-main',
        uri: tractor.tractorImage,
      });
    }
    
    // Add RC images if available
    if (tractor.rcImages && tractor.rcImages.length > 0) {
      tractor.rcImages.forEach((rcImage: string, index: number) => {
        images.push({
          id: `rc-${index}`,
          uri: rcImage,
        });
      });
    }
    
    return images;
  }, [farmerDetails, selectedTractorIndex]);

  const handleImagePress = (docIndex: number) => {
    setSelectedImageIndex(docIndex);
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
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: moderateScale(16),
          paddingTop: insets.top,
          marginBottom:moderateScale(7),
          paddingBottom: moderateScale(12),
          backgroundColor: colors.backgroundLight,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
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
        editButton: {
          paddingHorizontal: moderateScale(16),
          paddingVertical: moderateScale(8),
          borderRadius: moderateScale(20),
          backgroundColor: colors.primary,
        },
        editButtonText: {
          ...Typography.semiBoldMd,
          color: colors.textWhite,
          fontSize: moderateScale(14),
        },
        scrollContent: {
          paddingHorizontal: moderateScale(16),
        },
        card: {
          backgroundColor: colors.backgroundWhite,
          borderRadius: moderateScale(12),
          padding: moderateScale(16),
          marginBottom: moderateScale(16),
        },
        profileHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(20),
        },
        profileImageContainer: {
          position: 'relative',
          marginRight: moderateScale(16),
        },
        profileImage: {
          width: moderateScale(60),
          height: moderateScale(60),
          borderRadius: moderateScale(40),
          backgroundColor: colors.light_dark_yellow,
          alignItems: 'center',
          justifyContent: 'center',
        },
        profileImageText: {
          ...Typography.boldXl,
          fontSize: moderateScale(22),
          color: colors.textSecondary,
        },
        cameraIconContainer: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: moderateScale(22),
          height: moderateScale(22),
          borderRadius: moderateScale(14),
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: colors.backgroundWhite,
        },
        profileInfo: {
          flex: 1,
        },
        profileName: {
          ...Typography.boldXl,
          fontSize: moderateScale(18), 
          color: colors.textPrimary,
          marginBottom: moderateScale(4),
          textTransform: 'capitalize',
        },
        profilePhone: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
        tractorHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: moderateScale(16),
        },
        tractorTitle: {
          ...Typography.boldXl,
          fontSize: moderateScale(18),
          color: colors.textPrimary,
        },
        tractorCount: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
        tractorImageContainer: {
          alignItems: 'center',
          marginVertical: moderateScale(16),
        },
        tractorMainImage: {
          width: '100%',
          height: moderateScale(200),
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          marginBottom: moderateScale(12),
        },
        documentImagesContainer: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginTop: moderateScale(8),
        },
        documentImage: {
          // width: moderateScale(160),
          height: moderateScale(100),
          borderRadius: moderateScale(8),
          marginHorizontal:moderateScale(5),
          paddingHorizontal:moderateScale(10),
          backgroundColor: colors.backgroundGray,
        },
        placeholderImage: {
          width: '100%',
          height: '100%',
          borderRadius: moderateScale(8),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        placeholderText: {
          ...Typography.regularSm,
          fontSize: moderateScale(12),
          color: colors.textTertiary,
          textAlign: 'center',
        },
      }),
    [moderateScale, insets.top],
  );

  return (
    <View style={[dynamicStyles.container]}>
      {/* Header */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.headerLeft}>
          <TouchableOpacity
            style={dynamicStyles.backButton}
            onPress={() => {
              // If coming from Home, navigate back to Home tab
              // If coming from List, use goBack() to return to list
              if (params?.fromScreen === 'Home') {
                tabNavigation.navigate(SCREEN_NAMES.Home);
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.7}>
            <Ionicons
              name="arrow-back"
              size={moderateScale(20)}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={dynamicStyles.headerTitle}>Farmer details</Text>
        </View>
        <TouchableOpacity
          style={dynamicStyles.editButton}
          activeOpacity={0.7}
          onPress={() => {
            // Handle edit action
            console.log('Edit button pressed');
          }}>
          <Text style={dynamicStyles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      {loading ? (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : farmerDetails ? (
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={dynamicStyles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* User Details Card */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.profileHeader}>
            <View style={dynamicStyles.profileImageContainer}>
              {farmerDetails.profileImage ? (
                <Image
                  source={{uri: farmerDetails.profileImage}}
                  style={dynamicStyles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={dynamicStyles.profileImage}>
                  <Text style={dynamicStyles.profileImageText}>
                    {params?.farmerInitials || (farmerDetails.firstName?.[0] || '') + (farmerDetails.lastName?.[0] || '') || 'DW'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={dynamicStyles.cameraIconContainer}
                activeOpacity={0.7}>
                <Ionicons
                  name="camera"
                  size={moderateScale(14)}
                  color={colors.textWhite}
                />
              </TouchableOpacity>
            </View>
            <View style={dynamicStyles.profileInfo}>
              <Text style={dynamicStyles.profileName}>
                {params?.farmerName || farmerDetails.fullName || ''}
              </Text>
              <Text style={dynamicStyles.profilePhone}>
                {params?.farmerPhone || farmerDetails.mobile || ''}
              </Text>
            </View>
          </View>

          <InfoRow
            label="First name"
            value={farmerDetails.firstName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Middle name"
            value={farmerDetails.middleName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Last name"
            value={farmerDetails.lastName}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Mobile no."
            value={farmerDetails.mobile}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Date of birth"
            value={farmerDetails.dateOfBirth}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Date of marriage"
            value={farmerDetails.dateOfMarriage}
            moderateScale={moderateScale}
          />
          <InfoRow
            label="Dealership name"
            value={farmerDetails.dealershipName}            
            moderateScale={moderateScale}
            isShowBorderBottom={false}
          />
        </View>

        {/* Tractor Details Card */}
        <View style={dynamicStyles.card}>
          <View style={dynamicStyles.tractorHeader}>
            <Text style={dynamicStyles.tractorTitle}>Tractor details</Text>
            <Text style={dynamicStyles.tractorCount}>
              Tractor count: {farmerDetails.tractors.length}
            </Text>
          </View>

          {farmerDetails.tractors.map((tractor: any, index: number) => {
            // Get RC images (can be multiple)
            const rcImage1 = tractor.rcImages?.[0] || null;
            const rcImage2 = tractor.rcImages?.[1] || null;
            
            // Calculate image index for preview modal
            const getImageIndex = (imageType: 'tractor' | 'rc1' | 'rc2') => {
              let imgIndex = 0;
              if (imageType === 'tractor' && tractor.tractorImage) {
                imgIndex = 0;
              } else if (imageType === 'rc1' && rcImage1) {
                imgIndex = tractor.tractorImage ? 1 : 0;
              } else if (imageType === 'rc2' && rcImage2) {
                imgIndex = (tractor.tractorImage ? 1 : 0) + (rcImage1 ? 1 : 0);
              }
              return imgIndex;
            };
            
            return (
              <View key={tractor.id || tractor.tractorId || index}>
                {/* Tractor Main Image */}
                <View style={dynamicStyles.tractorImageContainer}>
                  <TouchableOpacity
                    style={dynamicStyles.tractorMainImage}
                    onPress={() => {
                      if (tractor.tractorImage || rcImage1 || rcImage2) {
                        setSelectedTractorIndex(index);
                        setSelectedImageIndex(getImageIndex('tractor'));
                        setPreviewModalVisible(true);
                      }
                    }}
                    activeOpacity={tractor.tractorImage ? 0.7 : 1}>
                    {tractor.tractorImage ? (
                      <Image 
                        source={{uri: tractor.tractorImage}} 
                        style={dynamicStyles.tractorMainImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={dynamicStyles.placeholderImage}>
                        <Text style={dynamicStyles.placeholderText}>No image available</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Document Images */}
                  <View style={dynamicStyles.documentImagesContainer}>
                    <TouchableOpacity
                      style={dynamicStyles.documentImage}
                      onPress={() => {
                        if (rcImage1) {
                          setSelectedTractorIndex(index);
                          setSelectedImageIndex(getImageIndex('rc1'));
                          setPreviewModalVisible(true);
                        }
                      }}
                      activeOpacity={rcImage1 ? 0.7 : 1}>
                      {rcImage1 ? (
                        <Image 
                          source={{uri: rcImage1}} 
                          style={{width:moderateScale(140),height:moderateScale(70),borderRadius: moderateScale(8)}}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={dynamicStyles.placeholderImage}>
                          <Text style={[dynamicStyles.placeholderText, {fontSize: moderateScale(10)}]}>No RC image</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={dynamicStyles.documentImage}
                      onPress={() => {
                        if (rcImage2) {
                          setSelectedTractorIndex(index);
                          setSelectedImageIndex(getImageIndex('rc2'));
                          setPreviewModalVisible(true);
                        }
                      }}
                      activeOpacity={rcImage2 ? 0.7 : 1}>
                      {rcImage2 ? (
                        <Image 
                          source={{uri: rcImage2}} 
                          style={{width:moderateScale(140),height:moderateScale(70),borderRadius: moderateScale(8)}}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={dynamicStyles.placeholderImage}>
                          <Text style={[dynamicStyles.placeholderText, {fontSize: moderateScale(10)}]}>No RC image</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

              {/* Tractor Specifications */}
              <InfoRow
                label="Model name"
                value={tractor.model}
                moderateScale={moderateScale}
              />
              <InfoRow
                label="Chassis no."
                value={tractor.chassisNo}
                moderateScale={moderateScale}
                valueUnderlined={true}
              />
              <InfoRow
                label="Vehicle no."
                value={tractor.vehicleNo}
                moderateScale={moderateScale}
              />
              <InfoRow
                label="Engine no."
                value={tractor.engineNo}
                moderateScale={moderateScale}
              />
              <InfoRow
                label="Mobile no."
                value={tractor.mobile}
                moderateScale={moderateScale}
              />
              <InfoRow
                label="Date of invoice"
                value={tractor.dateOfInvoice}
                moderateScale={moderateScale}
              />
              <InfoRow
                label="Who drives"
                value={tractor.whoDrives}
                moderateScale={moderateScale}
                isShowBorderBottom={index !== farmerDetails.tractors.length - 1}
              />
            </View>
            );
          })}
        </View>
      </ScrollView>
      ) : (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: moderateScale(20)}}>
          <Text style={[Typography.regularMd, {color: colors.textSecondary}]}>
            No farmer details found
          </Text>
        </View>
      )}

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

