import React, {useState, useMemo, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../utils/colors';
import useDeviceMetrics from '../utils/responsiveCustom';
import {Typography} from '../utils/typography';
import Video from 'react-native-video';
import {isYouTubeUrl, extractYouTubeVideoId} from '../utils/youtubeUtils';

type VideoPlayerProps = {
  thumbnailUri?: string;
  thumbnailSource?: any; // For local image sources (require())
  videoUri?: string;
  title?: string;
  containerStyle?: any; // Allow custom container style
};

export default function VideoPlayer({
  thumbnailUri,
  thumbnailSource,
  videoUri,
  title,
  containerStyle,
}: VideoPlayerProps) {
  const {moderateScale} = useDeviceMetrics();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const videoRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: '100%',
          height: '100%',
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
          width: moderateScale(70),
          height: moderateScale(70),
          borderRadius: moderateScale(45),
          backgroundColor: '#FFF8E7', // Light cream/beige color
          alignItems: 'center',
          borderWidth:5,
          borderColor:'#F69D2A4D',
          justifyContent: 'center',
          shadowColor: colors.shadowColor,
          shadowOffset: {
            width: 0,
            height: moderateScale(4),
          },
          shadowOpacity: 0.3,
          shadowRadius: moderateScale(8),
          elevation: 8,
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
          width: screenWidth,
          height: screenHeight * 0.6,
          justifyContent: 'center',
          alignItems: 'center',
        },
        videoPlayer: {
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
        },
        videoControls: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          paddingBottom: moderateScale(20),
          paddingTop: moderateScale(12),
          paddingHorizontal: moderateScale(16),
        },
        controlsRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: moderateScale(8),
        },
        controlButton: {
          width: moderateScale(44),
          height: moderateScale(44),
          borderRadius: moderateScale(22),
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: moderateScale(8),
        },
        seekBarContainer: {
          flex: 1,
          marginHorizontal: moderateScale(8),
        },
        timeContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: moderateScale(4),
        },
        timeText: {
          ...Typography.regularSm,
          color: colors.textWhite,
          fontSize: moderateScale(12),
        },
        volumeContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: moderateScale(8),
        },
        volumeSlider: {
          flex: 1,
          marginLeft: moderateScale(8),
        },
        loadingContainer: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        errorContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: moderateScale(20),
        },
        errorText: {
          ...Typography.regularMd,
          color: colors.textWhite,
          textAlign: 'center',
          marginTop: moderateScale(12),
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
    [moderateScale, screenWidth, screenHeight],
  );

  // Format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = async () => {
    if (videoUri) {
      // Check if it's a YouTube URL - if so, open in YouTube app/browser
      if (isYouTubeUrl(videoUri)) {
        try {
          const videoId = extractYouTubeVideoId(videoUri);
          
          if (videoId) {
            // Try to open in YouTube app first (iOS/Android)
            const youtubeAppUrl = Platform.select({
              ios: `youtube://watch?v=${videoId}`,
              android: `vnd.youtube:${videoId}`,
            });
            
            if (youtubeAppUrl) {
              try {
                // Try opening YouTube app directly (without canOpenURL check)
                await Linking.openURL(youtubeAppUrl);
                return;
              } catch (appError) {
                // YouTube app not available, fall through to browser
                console.log('YouTube app not available, opening in browser');
              }
            }
          }
          
          // Fallback to opening in browser - just open directly
          await Linking.openURL(videoUri);
        } catch (error) {
          console.error('Error opening YouTube URL:', error);
          // Last resort: try opening in browser
          try {
            await Linking.openURL(videoUri);
          } catch (browserError) {
            console.error('Error opening in browser:', browserError);
          }
        }
        return;
      }
      
      // For non-YouTube videos, open the modal
      setShowVideoModal(true);
      setIsPlaying(true);
      setVideoError(null);
      setIsVideoLoading(true);
      setShowControls(true);
      resetControlsTimeout();
    } else {
      setShowVideoModal(true);
    }
  };

  const handleClose = () => {
    setShowVideoModal(false);
    setIsPlaying(false);
    setVideoError(null);
    setCurrentTime(0);
    setDuration(0);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    resetControlsTimeout();
  };

  const handleVideoLoad = (data: any) => {
    setIsVideoLoading(false);
    setVideoError(null);
    setDuration(data.duration);
    resetControlsTimeout();
  };

  const handleVideoError = (error: any) => {
    setIsVideoLoading(false);
    setVideoError('Failed to load video. Please try again.');
    console.error('Video error:', error);
  };

  const handleProgress = (data: any) => {
    if (!isSeeking) {
      setCurrentTime(data.currentTime);
    }
  };

  const handleSeek = (value: number) => {
    setIsSeeking(true);
    setCurrentTime(value);
    if (videoRef.current) {
      videoRef.current.seek(value);
    }
    setTimeout(() => setIsSeeking(false), 100);
    resetControlsTimeout();
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
    setIsPlaying(false);
  };

  const handleSeekComplete = (value: number) => {
    setIsSeeking(false);
    setCurrentTime(value);
    if (videoRef.current) {
      videoRef.current.seek(value);
    }
    setIsPlaying(true);
    resetControlsTimeout();
  };

  const handleRewind = () => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.seek(newTime);
    }
    resetControlsTimeout();
  };

  const handleForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.seek(newTime);
    }
    resetControlsTimeout();
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    resetControlsTimeout();
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 1);
    resetControlsTimeout();
  };

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    // Only auto-hide controls when video is playing
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleVideoPress = () => {
    if (showControls) {
      setShowControls(false);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      resetControlsTimeout();
    }
  };

  // Cleanup timeout on unmount or when modal closes
  useEffect(() => {
    if (!showVideoModal && controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showVideoModal]);

  // Show controls when paused
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    } else {
      resetControlsTimeout();
    }
  }, [isPlaying]);

  return (
    <>
      <TouchableOpacity
        style={[dynamicStyles.container, containerStyle]}
        onPress={handlePlay}
        activeOpacity={0.9}>
        {thumbnailUri || thumbnailSource ? (
          <Image
            source={thumbnailSource || {uri: thumbnailUri}}
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
              size={moderateScale(45)}
              color={colors.primary}
              style={dynamicStyles.playIcon}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Video Modal */}
      <Modal
        visible={showVideoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}>
        <View style={dynamicStyles.videoModal}>
          <TouchableOpacity
            style={dynamicStyles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}>
            <Ionicons
              name="close"
              size={moderateScale(24)}
              color={colors.textWhite}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={dynamicStyles.videoContainer}
            activeOpacity={1}
            onPress={handleVideoPress}>
            {videoUri ? (
              <>
                <Video
                  ref={videoRef}
                  source={{uri: videoUri}}
                  style={dynamicStyles.videoPlayer}
                  paused={!isPlaying}
                  resizeMode="contain"
                  onLoad={handleVideoLoad}
                  onError={handleVideoError}
                  onProgress={handleProgress}
                  controls={false}
                  playInBackground={false}
                  playWhenInactive={false}
                  volume={volume}
                  muted={volume === 0}
                />
                
                {isVideoLoading && (
                  <View style={dynamicStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.textWhite} />
                    <Text
                      style={[
                        dynamicStyles.errorText,
                        {marginTop: moderateScale(12)},
                      ]}>
                      Loading video...
                    </Text>
                  </View>
                )}

                {videoError && (
                  <View style={dynamicStyles.errorContainer}>
                    <Ionicons
                      name="alert-circle"
                      size={moderateScale(48)}
                      color={colors.statusError}
                    />
                    <Text style={dynamicStyles.errorText}>{videoError}</Text>
                    <TouchableOpacity
                      style={[
                        dynamicStyles.controlButton,
                        {marginTop: moderateScale(16)},
                      ]}
                      onPress={handleClose}
                      activeOpacity={0.7}>
                      <Text style={[dynamicStyles.errorText, {color: colors.textWhite}]}>
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!isVideoLoading && !videoError && showControls && (
                  <View style={dynamicStyles.videoControls}>
                    {/* Main Controls Row */}
                    <View style={dynamicStyles.controlsRow}>
                      <TouchableOpacity
                        style={dynamicStyles.controlButton}
                        onPress={handleRewind}
                        activeOpacity={0.7}>
                        <Ionicons
                          name="replay-10"
                          size={moderateScale(22)}
                          color={colors.textWhite}
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={dynamicStyles.controlButton}
                        onPress={togglePlayPause}
                        activeOpacity={0.7}>
                        <Ionicons
                          name={isPlaying ? 'pause' : 'play'}
                          size={moderateScale(24)}
                          color={colors.textWhite}
                        />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={dynamicStyles.controlButton}
                        onPress={handleForward}
                        activeOpacity={0.7}>
                        <Ionicons
                          name="forward-10"
                          size={moderateScale(22)}
                          color={colors.textWhite}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Seek Bar */}
                    <View style={dynamicStyles.seekBarContainer}>
                      <Slider
                        style={{width: '100%', height: moderateScale(40)}}
                        minimumValue={0}
                        maximumValue={duration || 1}
                        value={currentTime}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor={colors.primary}
                        onValueChange={handleSeek}
                        onSlidingStart={handleSeekStart}
                        onSlidingComplete={handleSeekComplete}
                      />
                      <View style={dynamicStyles.timeContainer}>
                        <Text style={dynamicStyles.timeText}>
                          {formatTime(currentTime)}
                        </Text>
                        <Text style={dynamicStyles.timeText}>
                          {formatTime(duration)}
                        </Text>
                      </View>
                    </View>

                    {/* Volume Control */}
                    <View style={dynamicStyles.volumeContainer}>
                      <TouchableOpacity
                        style={dynamicStyles.controlButton}
                        onPress={toggleMute}
                        activeOpacity={0.7}>
                        <Ionicons
                          name={volume > 0 ? 'volume-high' : 'volume-mute'}
                          size={moderateScale(20)}
                          color={colors.textWhite}
                        />
                      </TouchableOpacity>
                      <Slider
                        style={dynamicStyles.volumeSlider}
                        minimumValue={0}
                        maximumValue={1}
                        value={volume}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                        thumbTintColor={colors.primary}
                        onValueChange={handleVolumeChange}
                      />
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={dynamicStyles.errorContainer}>
                <Ionicons
                  name="videocam"
                  size={moderateScale(48)}
                  color={colors.textTertiary}
                />
                <Text
                  style={[
                    dynamicStyles.placeholderText,
                    {color: colors.textWhite, fontSize: moderateScale(16)},
                  ]}>
                  {title || 'Tractor Video'}
                </Text>
                <Text
                  style={[
                    dynamicStyles.placeholderText,
                    {
                      color: colors.textTertiary,
                      fontSize: moderateScale(14),
                      marginTop: moderateScale(8),
                    },
                  ]}>
                  No video available
                </Text>
                <TouchableOpacity
                  style={[
                    dynamicStyles.controlButton,
                    {marginTop: moderateScale(16)},
                  ]}
                  onPress={handleClose}
                  activeOpacity={0.7}>
                  <Text style={[dynamicStyles.errorText, {color: colors.textWhite}]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

