/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StyleSheet, Platform, AppState, AppStateStatus } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import RootNavigator, {navigationRef} from './src/navigation/RootNavigator';
import {StatusBarProvider, useStatusBar} from './src/contexts/StatusBarContext';
import {TTSProvider} from './src/contexts/TTSContext';
import {LanguageProvider} from './src/contexts/LanguageContext';
import TTSPlayer from './src/components/TTSPlayer';
import {StatusBar} from 'react-native';
import {useEffect} from 'react';
import './src/i18n'; // Initialize i18n
import FirebaseService from './src/Service/FirebaseService';
import {isLoggedIn, getUserRole, savePendingNavigation} from './src/utils/session';
import {SCREEN_NAMES} from './src/constants/screenNames';
import {CommonActions} from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';

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
          async (remoteMessage) => {
            console.log('App: 🔔 Notification opened from background/quit state');
            console.log('App: Notification data:', JSON.stringify(remoteMessage, null, 2));
            
            // Handle navigation or other actions when notification is opened
            if (remoteMessage.data) {
              console.log('App: 📦 Custom data:', remoteMessage.data);
              
              // Check if click_action is OPEN_NOTIFICATION_DETAIL
              if (remoteMessage.data.click_action === 'OPEN_NOTIFICATION_DETAIL') {
                console.log('App: 📬 Notification click action detected: OPEN_NOTIFICATION_DETAIL');
                
                try {
                  // Extract notification_id from notification data
                  const notificationId = remoteMessage.data.notification_id || remoteMessage.data.notificationId;
                  
                  if (!notificationId) {
                    console.error('App: ❌ No notification_id found in notification data');
                    return;
                  }
                  
                  console.log('App: 📬 Notification ID:', notificationId);
                  
                  // Check if user is logged in
                  const loggedIn = await isLoggedIn();
                  
                  if (loggedIn) {
                    // Check if user is a farmer
                    const userRole = await getUserRole();
                    const isFarmer = userRole === 'farmer';
                    
                    if (isFarmer) {
                      console.log('App: ✅ Farmer logged in - navigating to Event Details screen with notification_id');
                      
                      // Function to attempt navigation
                      const attemptNavigation = (retries = 0) => {
                        if (navigationRef.current?.isReady()) {
                          // Navigate to FarmerTabs -> Events -> EventDetails with notification_id as eventId
                          navigationRef.current?.dispatch(
                            CommonActions.navigate({
                              name: SCREEN_NAMES.FarmerTabs,
                              params: {
                                screen: SCREEN_NAMES.Events,
                                params: {
                                  screen: SCREEN_NAMES.EventDetails,
                                  params: {
                                    eventId: notificationId,
                                  },
                                },
                              },
                            })
                          );
                          console.log('App: ✅ Navigated to Event Details screen with notification_id:', notificationId);
                        } else if (retries < 5) {
                          // Retry after a short delay (max 5 retries)
                          console.log(`App: ⚠️ Navigation not ready yet, retrying... (${retries + 1}/5)`);
                          setTimeout(() => attemptNavigation(retries + 1), 500);
                        } else {
                          console.log('App: ⚠️ Navigation not ready after retries, storing pending navigation');
                          savePendingNavigation({
                            action: 'OPEN_NOTIFICATION_DETAIL',
                            screen: SCREEN_NAMES.EventDetails,
                            params: {
                              eventId: notificationId,
                            },
                          });
                        }
                      };
                      
                      // Wait a bit for navigation to be ready, then attempt navigation
                      setTimeout(() => attemptNavigation(), 500);
                    } else {
                      console.log('App: ⚠️ User is not a farmer, ignoring notification click');
                    }
                  } else {
                    console.log('App: ⚠️ User not logged in - storing pending navigation');
                    // Store pending navigation to handle after login
                    await savePendingNavigation({
                      action: 'OPEN_NOTIFICATION_DETAIL',
                      screen: SCREEN_NAMES.EventDetails,
                      params: {
                        eventId: notificationId,
                      },
                    });
                  }
                } catch (error) {
                  console.error('App: ❌ Error handling notification click:', error);
                }
              }
              
              // Check if click_action is OPEN_EVENT_DETAIL
              if (remoteMessage.data.click_action === 'OPEN_EVENT_DETAIL') {
                console.log('App: 📅 Notification click action detected: OPEN_EVENT_DETAIL');
                
                try {
                  // Extract event_id from notification data
                  const eventId = remoteMessage.data.event_id;
                  
                  if (!eventId) {
                    console.error('App: ❌ No event_id found in notification data');
                    return;
                  }
                  
                  console.log('App: 📅 Event ID:', eventId);
                  
                  // Check if user is logged in
                  const loggedIn = await isLoggedIn();
                  
                  if (loggedIn) {
                    // Check if user is a farmer
                    const userRole = await getUserRole();
                    const isFarmer = userRole === 'farmer';
                    
                    if (isFarmer) {
                      console.log('App: ✅ Farmer logged in - navigating to Event Details screen');
                      
                      // Function to attempt navigation
                      const attemptNavigation = (retries = 0) => {
                        if (navigationRef.current?.isReady()) {
                          // Navigate to FarmerTabs -> Events -> EventDetails with eventId
                          navigationRef.current?.dispatch(
                            CommonActions.navigate({
                              name: SCREEN_NAMES.FarmerTabs,
                              params: {
                                screen: SCREEN_NAMES.Events,
                                params: {
                                  screen: SCREEN_NAMES.EventDetails,
                                  params: {
                                    eventId: eventId,
                                  },
                                },
                              },
                            })
                          );
                          console.log('App: ✅ Navigated to Event Details screen with eventId:', eventId);
                        } else if (retries < 5) {
                          // Retry after a short delay (max 5 retries)
                          console.log(`App: ⚠️ Navigation not ready yet, retrying... (${retries + 1}/5)`);
                          setTimeout(() => attemptNavigation(retries + 1), 500);
                        } else {
                          console.log('App: ⚠️ Navigation not ready after retries, storing pending navigation');
                          savePendingNavigation({
                            action: 'OPEN_EVENT_DETAIL',
                            screen: SCREEN_NAMES.EventDetails,
                            params: {
                              eventId: eventId,
                            },
                          });
                        }
                      };
                      
                      // Wait a bit for navigation to be ready, then attempt navigation
                      setTimeout(() => attemptNavigation(), 500);
                    } else {
                      console.log('App: ⚠️ User is not a farmer, ignoring notification click');
                    }
                  } else {
                    console.log('App: ⚠️ User not logged in - storing pending navigation');
                    // Store pending navigation to handle after login
                    await savePendingNavigation({
                      action: 'OPEN_EVENT_DETAIL',
                      screen: SCREEN_NAMES.EventDetails,
                      params: {
                        eventId: eventId,
                      },
                    });
                  }
                } catch (error) {
                  console.error('App: ❌ Error handling event notification click:', error);
                }
              }
              
              // Check if click_action is OPEN_STORY_DETAIL
              if (remoteMessage.data.click_action === 'OPEN_STORY_DETAIL') {
                console.log('App: 📖 Notification click action detected: OPEN_STORY_DETAIL');
                
                try {
                  // Extract story_id from notification data
                  const storyId = remoteMessage.data.story_id || remoteMessage.data.storyId;
                  
                  if (!storyId) {
                    console.error('App: ❌ No story_id found in notification data');
                    return;
                  }
                  
                  console.log('App: 📖 Story ID:', storyId);
                  
                  // Check if user is logged in
                  const loggedIn = await isLoggedIn();
                  
                  if (loggedIn) {
                    // Check if user is a farmer
                    const userRole = await getUserRole();
                    const isFarmer = userRole === 'farmer';
                    
                    if (isFarmer) {
                      console.log('App: ✅ Farmer logged in - navigating to Story Details screen');
                      
                      // Function to attempt navigation
                      const attemptNavigation = (retries = 0) => {
                        if (navigationRef.current?.isReady()) {
                          // Navigate to FarmerTabs -> Stories -> StoryDetails with storyId
                          navigationRef.current?.dispatch(
                            CommonActions.navigate({
                              name: SCREEN_NAMES.FarmerTabs,
                              params: {
                                screen: SCREEN_NAMES.Stories,
                                params: {
                                  screen: SCREEN_NAMES.StoryDetails,
                                  params: {
                                    storyId: storyId,
                                    fromScreen: 'Notifications',
                                  },
                                },
                              },
                            })
                          );
                          console.log('App: ✅ Navigated to Story Details screen with storyId:', storyId);
                        } else if (retries < 5) {
                          // Retry after a short delay (max 5 retries)
                          console.log(`App: ⚠️ Navigation not ready yet, retrying... (${retries + 1}/5)`);
                          setTimeout(() => attemptNavigation(retries + 1), 500);
                        } else {
                          console.log('App: ⚠️ Navigation not ready after retries, storing pending navigation');
                          savePendingNavigation({
                            action: 'OPEN_STORY_DETAIL',
                            screen: SCREEN_NAMES.StoryDetails,
                            params: {
                              storyId: storyId,
                            },
                          });
                        }
                      };
                      
                      // Wait a bit for navigation to be ready, then attempt navigation
                      setTimeout(() => attemptNavigation(), 500);
                    } else {
                      console.log('App: ⚠️ User is not a farmer, ignoring notification click');
                    }
                  } else {
                    console.log('App: ⚠️ User not logged in - storing pending navigation');
                    // Store pending navigation to handle after login
                    await savePendingNavigation({
                      action: 'OPEN_STORY_DETAIL',
                      screen: SCREEN_NAMES.StoryDetails,
                      params: {
                        storyId: storyId,
                      },
                    });
                  }
                } catch (error) {
                  console.error('App: ❌ Error handling story notification click:', error);
                }
              }
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

  useEffect(() => {
    // Hide splash screen when navigation is ready
    // Wait for navigation container to be initialized
    const hideSplash = () => {
      if (navigationRef.current?.isReady()) {
        SplashScreen.hide();
      } else {
        // Wait for navigation to be ready
        const checkNavigation = setInterval(() => {
          if (navigationRef.current?.isReady()) {
            SplashScreen.hide();
            clearInterval(checkNavigation);
          }
        }, 100);
        
        // Fallback: hide after 2 seconds if navigation doesn't become ready
        setTimeout(() => {
          SplashScreen.hide();
          clearInterval(checkNavigation);
        }, 2000);
      }
    };
    
    // Increased delay to ensure app initialization is complete
    setTimeout(hideSplash, 500);
  }, []);

  // Monitor app state to show splash when app comes to foreground
  useEffect(() => {
    const appState = AppState.currentState;
    
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // When app comes to foreground from background
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App: App came to foreground - showing splash screen');
        // Show splash screen when app comes to foreground
        SplashScreen.show();
        
        // Hide splash after navigation is ready
        const hideSplash = () => {
          if (navigationRef.current?.isReady()) {
            SplashScreen.hide();
          } else {
            const checkNavigation = setInterval(() => {
              if (navigationRef.current?.isReady()) {
                SplashScreen.hide();
                clearInterval(checkNavigation);
              }
            }, 100);
            
            setTimeout(() => {
              SplashScreen.hide();
              clearInterval(checkNavigation);
            }, 2000);
          }
        };
        
        setTimeout(hideSplash, 500);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

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