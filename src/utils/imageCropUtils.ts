import ImagePicker from 'react-native-image-crop-picker';
import {Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {isEmulatorSync} from 'react-native-device-info';

type CropImageOptions = {
  width?: number;
  height?: number;
  cropping?: boolean;
  cropperCircleOverlay?: boolean;
  compressImageQuality?: number;
  freeStyleCropEnabled?: boolean;
};

const isPermissionGranted = (result: string) =>
  result === RESULTS.GRANTED || result === RESULTS.LIMITED;

const isUserCancelled = (error: any) => {
  const errorMessage = error?.message || '';
  return (
    errorMessage.includes('User cancelled') ||
    errorMessage.includes('cancelled') ||
    error?.code === 'E_PICKER_CANCELLED'
  );
};

/**
 * Crop an image from the provided URI
 * @param imageUri - The URI of the image to crop
 * @param options - Cropping options
 * @returns Promise<string | null> - The cropped image URI or null if cancelled
 */
export const cropImage = async (
  imageUri: string,
  options: CropImageOptions = {},
): Promise<string | null> => {
  try {
    const {
      width = 400,
      height = 400,
      cropping = true,
      cropperCircleOverlay = true,
      compressImageQuality = 0.8,
      freeStyleCropEnabled = false,
    } = options;

    const croppedImage = await ImagePicker.openCropper({
      path: imageUri,
      width,
      height,
      cropping,
      cropperCircleOverlay,
      compressImageQuality,
      freeStyleCropEnabled,
      mediaType: 'photo',
      includeBase64: false,
    });

    return croppedImage.path || null;
  } catch (error: any) {
    if (isUserCancelled(error)) {
      console.log('[ImageCrop] User cancelled cropping');
      return null;
    }
    console.error('[ImageCrop] Error cropping image:', error);
    throw error;
  }
};

/**
 * Request camera permission
 */
const requestCameraPermission = async (): Promise<boolean> => {
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

    return false;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

/**
 * Request photo library permission (iOS only; Android uses the system photo picker).
 */
const requestGalleryPermission = async (): Promise<boolean> => {
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

    return false;
  } catch (error) {
    console.error('Error requesting photo library permission:', error);
    return false;
  }
};

/**
 * Pick and crop an image from camera
 * @param options - Cropping options
 * @returns Promise<string | null> - The cropped image URI or null if cancelled
 */
export const pickAndCropImageFromCamera = async (
  options: CropImageOptions = {},
): Promise<string | null> => {
  try {
    if (Platform.OS === 'ios' && isEmulatorSync()) {
      throw new Error(
        'Camera is not available on the iOS Simulator. Please use a physical device or choose from gallery.',
      );
    }

    const hasCameraPermission = await requestCameraPermission();
    if (!hasCameraPermission) {
      throw new Error(
        'Camera permission is required. Please enable it in Settings.',
      );
    }

    const {
      width = 400,
      height = 400,
      cropping = true,
      cropperCircleOverlay = true,
      compressImageQuality = 0.8,
      freeStyleCropEnabled = false,
    } = options;

    console.log('[ImageCrop] Opening camera picker...');
    const image = await ImagePicker.openCamera({
      width,
      height,
      cropping,
      cropperCircleOverlay,
      compressImageQuality,
      freeStyleCropEnabled,
      mediaType: 'photo',
      includeBase64: false,
    });

    return image.path || null;
  } catch (error: any) {
    if (isUserCancelled(error)) {
      console.log('[ImageCrop] User cancelled camera picker');
      return null;
    }
    console.error('[ImageCrop] Error picking image from camera:', error);
    throw error;
  }
};

/**
 * Pick and crop an image from gallery
 * @param options - Cropping options
 * @returns Promise<string | null> - The cropped image URI or null if cancelled
 */
export const pickAndCropImageFromGallery = async (
  options: CropImageOptions = {},
): Promise<string | null> => {
  try {
    const hasGalleryPermission = await requestGalleryPermission();
    if (!hasGalleryPermission) {
      throw new Error(
        'Photo library permission is required. Please enable it in Settings.',
      );
    }

    const {
      width = 400,
      height = 400,
      cropping = true,
      cropperCircleOverlay = true,
      compressImageQuality = 0.8,
      freeStyleCropEnabled = false,
    } = options;

    console.log('[ImageCrop] Opening gallery picker...');
    const image = await ImagePicker.openPicker({
      width,
      height,
      cropping,
      cropperCircleOverlay,
      compressImageQuality,
      freeStyleCropEnabled,
      mediaType: 'photo',
      includeBase64: false,
    });

    return image.path || null;
  } catch (error: any) {
    if (isUserCancelled(error)) {
      console.log('[ImageCrop] User cancelled gallery picker');
      return null;
    }
    console.error('[ImageCrop] Error picking image from gallery:', error);
    throw error;
  }
};
