import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';

type VideoPlayerProps = {
  thumbnailUri?: string;
  videoUri?: string;
  title?: string;
};

export default function VideoPlayer({
  thumbnailUri,
  videoUri,
  title,
}: VideoPlayerProps) {
  const {moderateScale} = useDeviceMetrics();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
          aspectRatio: 16 / 9,
          borderRadius: moderateScale(12),
          overflow: 'hidden',
          backgroundColor: colors.backgroundGray,
          position: 'relative',
        },
        thumbnail: {
          width: '100%',
          height: '100%',
          backgroundColor: colors.backgroundGray,
        },
        playButtonContainer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        playButton: {
          width: moderateScale(60),
          height: moderateScale(60),
          borderRadius: moderateScale(30),
          backgroundColor: colors.primary,
          borderWidth: moderateScale(4),
          borderColor: colors.backgroundWhite,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors.shadowColor,
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        },
        playIcon: {
          marginLeft: moderateScale(4), // Slight offset for visual centering
        },
        videoModal: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        videoContainer: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
        closeButton: {
          position: 'absolute',
          top: moderateScale(50),
          right: moderateScale(20),
          width: moderateScale(40),
          height: moderateScale(40),
          borderRadius: moderateScale(20),
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        },
        placeholderContainer: {
          width: '100%',
          height: '100%',
          backgroundColor: colors.backgroundGray,
          alignItems: 'center',
          justifyContent: 'center',
        },
        placeholderText: {
          ...Typography.regularMd,
          fontSize: moderateScale(14),
          color: colors.textTertiary,
        },
      }),
    [moderateScale],
  );

  const handlePlay = () => {
    if (videoUri) {
      setShowVideoModal(true);
      setIsPlaying(true);
      // Here you would integrate with a video player library
      // For now, we'll just show a modal
    }
  };

  return (
    <>
      <TouchableOpacity
        style={dynamicStyles.container}
        onPress={handlePlay}
        activeOpacity={0.9}>
        {thumbnailUri ? (
          <Image
            source={{uri: thumbnailUri}}
            style={dynamicStyles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={dynamicStyles.placeholderContainer}>
            <Text style={dynamicStyles.placeholderText}>
              {title || 'Tractor Video'}
            </Text>
          </View>
        )}
        <View style={dynamicStyles.playButtonContainer}>
          <View style={dynamicStyles.playButton}>
            <Ionicons
              name="play"
              size={moderateScale(30)}
              color={colors.textWhite}
              style={dynamicStyles.playIcon}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Video Modal - Placeholder for actual video player */}
      <Modal
        visible={showVideoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowVideoModal(false);
          setIsPlaying(false);
        }}>
        <View style={dynamicStyles.videoModal}>
          <TouchableOpacity
            style={dynamicStyles.closeButton}
            onPress={() => {
              setShowVideoModal(false);
              setIsPlaying(false);
            }}>
            <Ionicons
              name="close"
              size={moderateScale(24)}
              color={colors.textWhite}
            />
          </TouchableOpacity>
          <View style={dynamicStyles.videoContainer}>
            <Text
              style={[
                dynamicStyles.placeholderText,
                {color: colors.textWhite, fontSize: moderateScale(16)},
              ]}>
              Video Player
            </Text>
            <Text
              style={[
                dynamicStyles.placeholderText,
                {color: colors.textWhite, fontSize: moderateScale(14), marginTop: moderateScale(8)},
              ]}>
              Integrate react-native-video for full functionality
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

