import {useState} from 'react';
import {launchCamera, launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

type ImagePickerOptions = {
  mediaType?: MediaType;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  onError?: (message: string) => void;
};

type UseImagePickerReturn = {
  pickImage: (source: 'camera' | 'gallery', options?: ImagePickerOptions) => Promise<string | null>;
  isPicking: boolean;
};

export function useImagePicker(): UseImagePickerReturn {
  const [isPicking, setIsPicking] = useState(false);

  const requestCameraPermission = async (onError?: (message: string) => void): Promise<boolean> => {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        return true;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }

      if (result === RESULTS.BLOCKED) {
        const message = 'Camera permission is required to take photos. Please enable it in your device settings.';
        if (onError) {
          onError(message);
        }
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const requestGalleryPermission = async (onError?: (message: string) => void): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      // Android uses the system photo picker and does not require storage permissions.
      return true;
    }

    try {
      const permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        return true;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }

      if (result === RESULTS.BLOCKED) {
        const message =
          'Photo library permission is required to access photos. Please enable it in your device settings.';
        onError?.(message);
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting photo library permission:', error);
      return false;
    }
  };

  const pickImage = async (
    source: 'camera' | 'gallery',
    options: ImagePickerOptions = {},
  ): Promise<string | null> => {
    setIsPicking(true);

    try {
      const defaultOptions: ImagePickerOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 2000,
        maxHeight: 2000,
        ...options,
      };

      let response: ImagePickerResponse;

      console.log(`[ImagePicker] Starting ${source} picker...`);

      if (source === 'camera') {
        console.log('[ImagePicker] Requesting camera permission...');
        const hasPermission = await requestCameraPermission(options.onError);
        if (!hasPermission) {
          console.log('[ImagePicker] Camera permission not granted, but attempting to launch camera anyway...');
          // Still try to launch - react-native-image-picker might handle permission request
        } else {
          console.log('[ImagePicker] Camera permission granted');
        }
        console.log('[ImagePicker] Launching camera...');

        response = await launchCamera({
          mediaType: defaultOptions.mediaType as 'photo',
          quality: defaultOptions.quality,
          maxWidth: defaultOptions.maxWidth,
          maxHeight: defaultOptions.maxHeight,
          saveToPhotos: Platform.OS === 'ios', // Only save to photos on iOS
        });
      } else {
        const hasPermission = await requestGalleryPermission(options.onError);
        if (!hasPermission) {
          setIsPicking(false);
          return null;
        }
        console.log('[ImagePicker] Launching gallery...');

        response = await launchImageLibrary({
          mediaType: defaultOptions.mediaType as 'photo',
          quality: defaultOptions.quality,
          maxWidth: defaultOptions.maxWidth,
          maxHeight: defaultOptions.maxHeight,
          selectionLimit: 1,
          includeBase64: false, // Don't include base64 for better performance
        });
      }

      console.log('[ImagePicker] Response received:', {
        didCancel: response.didCancel,
        errorCode: response.errorCode,
        errorMessage: response.errorMessage,
        assetsCount: response.assets?.length || 0,
      });

      if (response.didCancel) {
        console.log('[ImagePicker] User cancelled image picker');
        setIsPicking(false);
        return null;
      }

      if (response.errorCode) {
        console.error('[ImagePicker] Error code:', response.errorCode);
        console.error('[ImagePicker] Error message:', response.errorMessage);
        const errorMessage = response.errorMessage || 'Failed to pick image';
        if (options.onError) {
          options.onError(errorMessage);
        }
        setIsPicking(false);
        return null;
      }

      if (response.errorMessage) {
        console.error('[ImagePicker] Error:', response.errorMessage);
        if (options.onError) {
          options.onError(response.errorMessage);
        }
        setIsPicking(false);
        return null;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const uri = asset.uri;
        console.log('[ImagePicker] Image selected successfully:', uri);
        console.log('[ImagePicker] Asset details:', {
          uri: asset.uri,
          type: asset.type,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
        });
        setIsPicking(false);
        return uri || null;
      }

      console.log('[ImagePicker] No image selected - no assets in response');
      setIsPicking(false);
      return null;
    } catch (error) {
      console.error('[ImagePicker] Exception caught:', error);
      const errorMessage = 'Failed to pick image. Please try again.';
      if (options.onError) {
        options.onError(errorMessage);
      }
      setIsPicking(false);
      return null;
    }
  };

  return {
    pickImage,
    isPicking,
  };
}

