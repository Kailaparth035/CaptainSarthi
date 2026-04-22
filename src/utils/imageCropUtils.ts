import ImagePicker from 'react-native-image-crop-picker';
import {Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

type CropImageOptions = {
  width?: number;
  height?: number;
  cropping?: boolean;
  cropperCircleOverlay?: boolean;
  compressImageQuality?: number;
  freeStyleCropEnabled?: boolean;
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
    // User cancelled cropping - check for various cancellation messages
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('User cancelled') ||
      errorMessage.includes('cancelled') ||
      error?.code === 'E_PICKER_CANCELLED'
    ) {
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

    if (result === RESULTS.GRANTED) {
      return true;
    }

    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    }

    return false;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

/**
 * Request storage/photo library permission
 */
const requestStoragePermission = async (): Promise<boolean> => {
  try {
    let permission;
    if (Platform.OS === 'ios') {
      permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
    } else {
      const androidVersion = typeof Platform.Version === 'number' 
        ? Platform.Version 
        : parseInt(Platform.Version as string, 10);
      
      if (androidVersion >= 33) {
        permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
      } else {
        permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
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

    return false;
  } catch (error) {
    console.error('Error requesting storage permission:', error);
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
    // Request camera permission first
    await requestCameraPermission();

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
    // User cancelled - check for various cancellation messages
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('User cancelled') ||
      errorMessage.includes('cancelled') ||
      error?.code === 'E_PICKER_CANCELLED'
    ) {
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
    // Request storage permission first
    await requestStoragePermission();

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
    // User cancelled - check for various cancellation messages
    const errorMessage = error?.message || '';
    if (
      errorMessage.includes('User cancelled') ||
      errorMessage.includes('cancelled') ||
      error?.code === 'E_PICKER_CANCELLED'
    ) {
      console.log('[ImageCrop] User cancelled gallery picker');
      return null;
    }
    console.error('[ImageCrop] Error picking image from gallery:', error);
    throw error;
  }
};

