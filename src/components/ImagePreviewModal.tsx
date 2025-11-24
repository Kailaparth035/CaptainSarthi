import React, {useState, useRef, useMemo} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

export type ImageItem = {
  id: string;
  uri?: string | null;
  source?: any; // For require() images
  placeholder?: string;
};

type ImagePreviewModalProps = {
  visible: boolean;
  images: ImageItem[];
  initialIndex?: number;
  onClose: () => void;
  onReplaceImage?: (imageId: string) => void;
};

export default function ImagePreviewModal({
  visible,
  images,
  initialIndex = 0,
  onClose,
  onReplaceImage,
}: ImagePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const {moderateScale} = useDeviceMetrics();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const MODAL_HEIGHT = SCREEN_HEIGHT * 0.5; // Half screen height

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modal: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        },
        modalContent: {
          height: MODAL_HEIGHT,
          width: '100%',
          backgroundColor: colors.backgroundWhite,
          borderTopLeftRadius: moderateScale(20),
          borderTopRightRadius: moderateScale(20),
          overflow: 'hidden',
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: moderateScale(16),
          paddingTop: moderateScale(16),
          paddingBottom: moderateScale(12),
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        headerTitle: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textPrimary,
          marginLeft: moderateScale(12),
        },
        closeButton: {
          width: moderateScale(36),
          height: moderateScale(36),
          borderRadius: moderateScale(18),
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        imageCounter: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textSecondary,
          backgroundColor: colors.backgroundGray,
          paddingHorizontal: moderateScale(12),
          paddingVertical: moderateScale(6),
          borderRadius: moderateScale(16),
        },
        scrollContainer: {
          flex: 1,
          width: SCREEN_WIDTH,
        },
        imageContainer: {
          width: SCREEN_WIDTH,
          height: MODAL_HEIGHT - moderateScale(120), // Subtract header and footer height
          justifyContent: 'center',
          alignItems: 'center',
        },
        image: {
          width: SCREEN_WIDTH - moderateScale(32),
          height: MODAL_HEIGHT - moderateScale(180),
          resizeMode: 'contain',
          marginHorizontal: moderateScale(16),
        },
        placeholderContainer: {
          width: SCREEN_WIDTH - moderateScale(32),
          height: MODAL_HEIGHT - moderateScale(180),
          backgroundColor: colors.backgroundGray,
          borderRadius: moderateScale(12),
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: moderateScale(16),
        },
        placeholderText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
          textAlign: 'center',
        },
        footer: {
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : moderateScale(16),
          paddingHorizontal: moderateScale(16),
          paddingTop: moderateScale(12),
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
        replaceButton: {
          backgroundColor: colors.primary,
          borderRadius: moderateScale(8),
          paddingVertical: moderateScale(14),
          paddingHorizontal: moderateScale(24),
          alignItems: 'center',
          justifyContent: 'center',
        },
        replaceButtonText: {
          ...Typography.semiBoldMd,
          fontSize: moderateScale(16),
          color: colors.textWhite,
        },
      }),
    [moderateScale, insets],
  );

  // Scroll to initial index when modal opens
  React.useEffect(() => {
    if (visible && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * SCREEN_WIDTH,
          animated: false,
        });
      }, 100);
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex, SCREEN_WIDTH]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const handleReplaceImage = () => {
    if (onReplaceImage && images[currentIndex]) {
      onReplaceImage(images[currentIndex].id);
    }
  };

  const renderImage = (image: ImageItem, index: number) => {
    if (image.source) {
      // Handle require() images
      return (
        <Image
          source={image.source}
          style={styles.image}
          resizeMode="contain"
        />
      );
    } else if (image.uri) {
      // Handle URI images
      return (
        <Image
          source={{uri: image.uri}}
          style={styles.image}
          resizeMode="contain"
        />
      );
    } else {
      // Placeholder
      return (
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            {image.placeholder || 'No image available'}
          </Text>
        </View>
      );
    }
  };

  if (!visible || images.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View style={styles.modal}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}>
                <Ionicons
                  name="close"
                  size={moderateScale(24)}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Image preview</Text>
            </View>
            {images.length > 1 && (
              <Text style={styles.imageCounter}>
                {currentIndex + 1} / {images.length}
              </Text>
            )}
          </View>

          {/* Image ScrollView */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.scrollContainer}
            contentContainerStyle={{
              alignItems: 'center',
              width: SCREEN_WIDTH * images.length,
            }}
            bounces={false}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH}
            snapToAlignment="start">
            {images.map((image, index) => (
              <View key={image.id} style={styles.imageContainer}>
                {renderImage(image, index)}
              </View>
            ))}
          </ScrollView>

          {/* Footer with Replace button */}
          {onReplaceImage && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.replaceButton}
                onPress={handleReplaceImage}
                activeOpacity={0.8}>
                <Text style={styles.replaceButtonText}>Replace image</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
