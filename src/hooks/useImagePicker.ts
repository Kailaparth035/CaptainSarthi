import {useState} from 'react';
import {
  launchCamera,
  launchImageLibrary,
  ImagePickerResponse,
  MediaType,
} from 'react-native-image-picker';
import ImageCropPicker from 'react-native-image-crop-picker';
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

const isPermissionGranted = (result: string) =>
  result === RESULTS.GRANTED || result === RESULTS.LIMITED;

const isUserCancelled = (error: any) => {
  const errorMessage = error?.message || '';
  return (
    error?.code === 'E_PICKER_CANCELLED' ||
    errorMessage.includes('User cancelled') ||
    errorMessage.includes('cancelled')
  );
};

const normalizeImagePath = (path?: string | null): string | null => {
  if (!path) {
    return null;
  }
  if (path.startsWith('file://') || path.startsWith('content://')) {
    return path;
  }
  return `file://${path}`;
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

      if (isPermissionGranted(result)) {
        return true;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return isPermissionGranted(requestResult);
      }

      if (result === RESULTS.BLOCKED) {
        const message =
          'Camera permission is required to take photos. Please enable it in your device settings.';
        onError?.(message);
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
      return true;
    }

    try {
      const permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      const result = await check(permission);

      if (isPermissionGranted(result)) {
        return true;
      }

      if (result === RESULTS.DENIED) {
        const requestResult = await request(permission);
        return isPermissionGranted(requestResult);
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

  const pickImageWithCropPicker = async (
    source: 'camera' | 'gallery',
    options: ImagePickerOptions,
  ): Promise<string | null> => {
    // Upload the original image without downscaling/compression so the file
    // size matches the picked image (kept consistent with Android).
    const quality = options.quality ?? 1;

    if (source === 'camera') {
      const hasPermission = await requestCameraPermission(options.onError);
      if (!hasPermission) {
        return null;
      }

      const image = await ImageCropPicker.openCamera({
        mediaType: 'photo',
        cropping: false,
        compressImageQuality: quality,
        includeBase64: false,
      });
      return normalizeImagePath(image.path);
    }

    const hasPermission = await requestGalleryPermission(options.onError);
    if (!hasPermission) {
      return null;
    }

    const image = await ImageCropPicker.openPicker({
      mediaType: 'photo',
      cropping: false,
      compressImageQuality: quality,
      includeBase64: false,
      multiple: false,
    });

    return normalizeImagePath(image.path);
  };

  const pickImageWithNativePicker = async (
    source: 'camera' | 'gallery',
    options: ImagePickerOptions,
  ): Promise<string | null> => {
    // Upload the original image: no downscaling (no maxWidth/maxHeight) and
    // full quality by default so the file size matches the picked image.
    // maxWidth/maxHeight are only applied when explicitly passed via options.
    const defaultOptions: ImagePickerOptions = {
      mediaType: 'photo',
      quality: 1,
      ...options,
    };

    let response: ImagePickerResponse;

    // Only include maxWidth/maxHeight when they are provided. Passing
    // `undefined` values crashes the native picker (Options.java getInt).
    const sizeOptions: {maxWidth?: number; maxHeight?: number} = {};
    if (defaultOptions.maxWidth !== undefined) {
      sizeOptions.maxWidth = defaultOptions.maxWidth;
    }
    if (defaultOptions.maxHeight !== undefined) {
      sizeOptions.maxHeight = defaultOptions.maxHeight;
    }

    if (source === 'camera') {
      const hasPermission = await requestCameraPermission(options.onError);
      if (!hasPermission) {
        console.log('[ImagePicker] Camera permission not granted');
      }

      response = await launchCamera({
        mediaType: defaultOptions.mediaType as 'photo',
        quality: defaultOptions.quality,
        ...sizeOptions,
        saveToPhotos: false,
      });
    } else {
      response = await launchImageLibrary({
        mediaType: defaultOptions.mediaType as 'photo',
        quality: defaultOptions.quality,
        ...sizeOptions,
        selectionLimit: 1,
        includeBase64: false,
      });
    }

    if (response.didCancel) {
      return null;
    }

    if (response.errorCode || response.errorMessage) {
      const errorMessage = response.errorMessage || 'Failed to pick image';
      options.onError?.(errorMessage);
      return null;
    }

    if (response.assets && response.assets.length > 0) {
      return response.assets[0].uri || null;
    }

    return null;
  };

  const pickImage = async (
    source: 'camera' | 'gallery',
    options: ImagePickerOptions = {},
  ): Promise<string | null> => {
    setIsPicking(true);

    try {
      console.log(`[ImagePicker] Starting ${source} picker on ${Platform.OS}...`);

      if (Platform.OS === 'ios') {
        return await pickImageWithCropPicker(source, options);
      }

      return await pickImageWithNativePicker(source, options);
    } catch (error: any) {
      if (isUserCancelled(error)) {
        console.log('[ImagePicker] User cancelled image picker');
        return null;
      }

      console.error('[ImagePicker] Exception caught:', error);
      options.onError?.('Failed to pick image. Please try again.');
      return null;
    } finally {
      setIsPicking(false);
    }
  };

  return {
    pickImage,
    isPicking,
  };
}
