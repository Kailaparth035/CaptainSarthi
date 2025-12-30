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

function App() {
  useEffect(() => {
    // Initialize Firebase with all notification handlers
    FirebaseService.initialize(
      // Foreground notification handler
      async (remoteMessage) => {
        console.log('App: Foreground notification received:', remoteMessage);
        if (remoteMessage.notification) {
          console.log('App: Notification title:', remoteMessage.notification.title);
          console.log('App: Notification body:', remoteMessage.notification.body);
          // You can show a local notification here or display an in-app notification
          // For example, using react-native-push-notification or a custom in-app notification component
        }
      },
      // Background/Quit state notification handler
      (remoteMessage) => {
        console.log('App: Notification opened from background/quit state:', remoteMessage);
        // Handle navigation or other actions when notification is opened
        // You can navigate to a specific screen based on notification data
        if (remoteMessage.data) {
          // Example: Navigate based on notification data
          // navigationRef.current?.navigate(remoteMessage.data.screen);
        }
      },
      // Token refresh handler
      (token) => {
        console.log('App: FCM token refreshed:', token);
        // Send the token to your backend server here
        // Example: await api.updateFCMToken(token);
      },
    );

    // Cleanup on unmount
    return () => {
      FirebaseService.cleanup();
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