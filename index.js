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
try {
  // loadFont is safe to call multiple times
  // eslint-disable-next-line no-unused-expressions
  Ionicons.loadFont && Ionicons.loadFont();
  // eslint-disable-next-line no-unused-expressions
  MaterialCommunityIcons.loadFont && MaterialCommunityIcons.loadFont();
} catch (e) {
  // noop
}

// Register background handler for Android
// This handler runs in a headless JS task when the app is in the background
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification received:', remoteMessage);
  // Handle background notification here
  // This function must return a Promise
});

AppRegistry.registerComponent(appName, () => App);
