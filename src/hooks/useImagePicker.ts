import {useState} from 'react';
import {launchCamera, launchImageLibrary, ImagePickerResponse, MediaType} from 'react-native-image-picker';
import {Alert, Platform} from 'react-native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

type ImagePickerOptions = {
  mediaType?: MediaType;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
};

type UseImagePickerReturn = {
  pickImage: (source: 'camera' | 'gallery', options?: ImagePickerOptions) => Promise<string | null>;
  isPicking: boolean;
};

export function useImagePicker(): UseImagePickerReturn {
  const [isPicking, setIsPicking] = useState(false);

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

      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos. Please enable it in your device settings.',
        );
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    try {
      let permission;
      if (Platform.OS === 'ios') {
        permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
      } else {
        // For Android 13+ (API 33+), use READ_MEDIA_IMAGES
        // For older versions, use READ_EXTERNAL_STORAGE
        const androidVersion = Platform.Version as number;
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

      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Storage permission is required to access photos. Please enable it in your device settings.',
        );
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

      if (source === 'camera') {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          setIsPicking(false);
          return null;
        }

        response = await launchCamera({
          mediaType: defaultOptions.mediaType as 'photo',
          quality: defaultOptions.quality,
          maxWidth: defaultOptions.maxWidth,
          maxHeight: defaultOptions.maxHeight,
          saveToPhotos: true,
        });
      } else {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
          setIsPicking(false);
          return null;
        }

        response = await launchImageLibrary({
          mediaType: defaultOptions.mediaType as 'photo',
          quality: defaultOptions.quality,
          maxWidth: defaultOptions.maxWidth,
          maxHeight: defaultOptions.maxHeight,
          selectionLimit: 1,
        });
      }

      if (response.didCancel) {
        console.log('User cancelled image picker');
        setIsPicking(false);
        return null;
      }

      if (response.errorCode) {
        console.error('Image picker error code:', response.errorCode);
        console.error('Image picker error message:', response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        setIsPicking(false);
        return null;
      }

      if (response.errorMessage) {
        console.error('Image picker error:', response.errorMessage);
        Alert.alert('Error', response.errorMessage);
        setIsPicking(false);
        return null;
      }

      if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        const uri = asset.uri;
        console.log('Image selected:', uri);
        setIsPicking(false);
        return uri || null;
      }

      console.log('No image selected');
      setIsPicking(false);
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setIsPicking(false);
      return null;
    }
  };

  return {
    pickImage,
    isPicking,
  };
}

