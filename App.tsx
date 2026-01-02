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
    const initFirebase = async () => {
      try {
        await FirebaseService.initialize(
          // Foreground notification handler
          async (remoteMessage) => {
            console.log('App: 📬 Foreground notification received');
            console.log('App: Notification data:', JSON.stringify(remoteMessage, null, 2));
            
            if (remoteMessage.notification) {
              console.log('App: 📋 Title:', remoteMessage.notification.title);
              console.log('App: 📋 Body:', remoteMessage.notification.body);
            }
            
            if (remoteMessage.data) {
              console.log('App: 📦 Data payload:', remoteMessage.data);
              // Handle custom data here
            }
          },
          // Background/Quit state notification handler
          (remoteMessage) => {
            console.log('App: 🔔 Notification opened from background/quit state');
            console.log('App: Notification data:', JSON.stringify(remoteMessage, null, 2));
            
            // Handle navigation or other actions when notification is opened
            if (remoteMessage.data) {
              console.log('App: 📦 Custom data:', remoteMessage.data);
              // Example: Navigate based on notification data
              // navigationRef.current?.navigate(remoteMessage.data.screen);
            }
          },
          // Token refresh handler
          (token) => {
            console.log('App: 🔄 FCM token refreshed');
            console.log('App: New token (first 20 chars):', token.substring(0, 20) + '...');
            
            // Send the token to your backend server here
            // Example: 
            // try {
            //   await api.updateFCMToken(token);
            //   console.log('App: ✅ Token sent to backend');
            // } catch (error) {
            //   console.error('App: ❌ Failed to send token to backend:', error);
            // }
          },
        );
        console.log('App: ✅ Firebase initialization completed successfully');
      } catch (error) {
        console.error('App: ❌ Firebase initialization failed:', error);
      }
    };

    initFirebase();

    // Cleanup on unmount
    return () => {
      console.log('App: Cleaning up Firebase listeners...');
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