/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import App from './App';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

// Ensure icon fonts are loaded (helps on some setups)
// This is important for React Native Vector Icons to work properly
try {
  // Preload fonts to ensure they're available immediately
  if (Ionicons && typeof Ionicons.loadFont === 'function') {
    Ionicons.loadFont().catch((err) => {
      console.warn('Failed to load Ionicons font:', err);
    });
  }
  if (MaterialCommunityIcons && typeof MaterialCommunityIcons.loadFont === 'function') {
    MaterialCommunityIcons.loadFont().catch((err) => {
      console.warn('Failed to load MaterialCommunityIcons font:', err);
    });
  }
} catch (e) {
  console.warn('Error loading vector icon fonts:', e);
}

// Register background handler for Android
// This handler runs in a headless JS task when the app is in the background
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification received:', remoteMessage);
  // Handle background notification here
  // This function must return a Promise
});

AppRegistry.registerComponent(appName, () => App);
