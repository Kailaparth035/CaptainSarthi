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

  const requestStoragePermission = async (onError?: (message: string) => void): Promise<boolean> => {
    try {
      let permission;
      if (Platform.OS === 'ios') {
        // For iOS 14+, use PHOTO_LIBRARY for read/write access
        // For iOS 11-13, PHOTO_LIBRARY also works
        permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
        // For Android 13+ (API 33+), use READ_MEDIA_IMAGES
        // For older versions, use READ_EXTERNAL_STORAGE
        const androidVersion = typeof Platform.Version === 'number' 
          ? Platform.Version 
          : parseInt(Platform.Version as string, 10);
        
        console.log('[ImagePicker] Android version:', androidVersion);
        
        if (androidVersion >= 33) {
          permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
          console.log('[ImagePicker] Using READ_MEDIA_IMAGES permission for Android 13+');
        } else {
          permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
          console.log('[ImagePicker] Using READ_EXTERNAL_STORAGE permission for Android < 13');
        }
      }

      const result = await check(permission);

      if (result === RESULTS.GRANTED) {
        return true;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return requestResult === RESULTS.GRANTED;
      }

      if (result === RESULTS.BLOCKED) {
        const message = 'Storage permission is required to access photos. Please enable it in your device settings.';
        if (onError) {
          onError(message);
        }
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting storage permission:', error);
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
        console.log('[ImagePicker] Requesting storage permission...');
        const hasPermission = await requestStoragePermission(options.onError);
        if (!hasPermission) {
          console.log('[ImagePicker] Storage permission not granted, but attempting to launch gallery anyway...');
          // Still try to launch - react-native-image-picker might handle permission request
        } else {
          console.log('[ImagePicker] Storage permission granted');
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

