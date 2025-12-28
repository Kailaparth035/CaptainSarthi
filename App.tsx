/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StyleSheet, Platform } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import {StatusBarProvider, useStatusBar} from './src/contexts/StatusBarContext';
import {TTSProvider} from './src/contexts/TTSContext';
import {LanguageProvider} from './src/contexts/LanguageContext';
import TTSPlayer from './src/components/TTSPlayer';
import {StatusBar} from 'react-native';
import {useEffect} from 'react';
import './src/i18n'; // Initialize i18n
import FirebaseService from './src/Service/FirebaseService';
import messaging from '@react-native-firebase/messaging';

function App() {
  useEffect(() => {
    // Initialize Firebase
    FirebaseService.initialize();

    // Set up foreground message handler
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('App: Foreground notification:', remoteMessage);
      // You can show a local notification here using react-native-push-notification
      // or display an in-app notification
      if (remoteMessage.notification) {
        // Handle foreground notification display
        console.log('App: Notification title:', remoteMessage.notification.title);
        console.log('App: Notification body:', remoteMessage.notification.body);
      }
    });

    // Set up background/quit state notification handler
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('App: Notification opened from background:', remoteMessage);
      // Handle navigation or other actions when notification is opened
    });

    // Check if app was opened from a notification (quit state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App: Notification opened from quit state:', remoteMessage);
          // Handle navigation or other actions when app is opened from notification
        }
      });

    return () => {
      unsubscribeForeground();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
      <StatusBarProvider>
        <TTSProvider>
          <AppContent />
        </TTSProvider>
      </StatusBarProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const {currentConfig} = useStatusBar();

  return (
    <>
      <StatusBar 
        barStyle={currentConfig.barStyle}
        backgroundColor={Platform.OS === 'android' ? currentConfig.backgroundColor : undefined}
        translucent={Platform.OS === 'android' ? true : undefined}
        hidden={false}
      />
      <SafeAreaView style={styles.container} edges={[]}>
        <RootNavigator />
        <TTSPlayer />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;