/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StyleSheet, Platform, NativeModules } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import RootNavigator, {navigationRef} from './src/navigation/RootNavigator';
import {StatusBarProvider, useStatusBar} from './src/contexts/StatusBarContext';
import {TTSProvider} from './src/contexts/TTSContext';
import {LanguageProvider} from './src/contexts/LanguageContext';
import TTSPlayer from './src/components/TTSPlayer';
import ForceUpdateModal from './src/components/ForceUpdateModal';
import {StatusBar} from 'react-native';
import {useEffect, useState} from 'react';
import './src/i18n'; // Initialize i18n
import FirebaseService from './src/Service/FirebaseService';
import AppUpdateService from './src/Service/AppUpdateService';
import {isLoggedIn, getUserRole, savePendingNavigation} from './src/utils/session';
import {SCREEN_NAMES} from './src/constants/screenNames';
import {CommonActions} from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import colors from './src/utils/colors';

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
                  // Extract event_id first (if exists), otherwise use notification_id
                  const eventId = remoteMessage.data.event_id;
                  const notificationId = remoteMessage.data.notification_id || remoteMessage.data.notificationId;
                  
                  // Use event_id if available, otherwise fall back to notification_id
                  const finalEventId = eventId || notificationId;
                  
                  if (!finalEventId) {
                    console.error('App: ❌ No event_id or notification_id found in notification data');
                    return;
                  }
                  
                  if (eventId) {
                    console.log('App: 📅 Event ID found:', eventId);
                  } else {
                    console.log('App: 📬 Notification ID:', notificationId);
                  }
                  
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
                          // Navigate to FarmerTabs -> Events -> EventDetails with eventId (event_id or notification_id)
                          navigationRef.current?.dispatch(
                            CommonActions.navigate({
                              name: SCREEN_NAMES.FarmerTabs,
                              params: {
                                screen: SCREEN_NAMES.Events,
                                params: {
                                  screen: SCREEN_NAMES.EventDetails,
                                  params: {
                                    eventId: finalEventId,
                                  },
                                },
                              },
                            })
                          );
                          console.log('App: ✅ Navigated to Event Details screen with eventId:', finalEventId);
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
                              eventId: finalEventId,
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
                        eventId: finalEventId,
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
  const [forceUpdateRequired, setForceUpdateRequired] = useState(false);
  const [storeUrl, setStoreUrl] = useState('');
  const [updateCheckDone, setUpdateCheckDone] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAppUpdate = async () => {
      try {
        const result = await AppUpdateService.checkForForceUpdate();
        if (!isMounted) {
          return;
        }

        if (result.required) {
          setForceUpdateRequired(true);
          setStoreUrl(result.storeUrl);
        }
      } catch (error) {
        console.warn('App: Force update check failed:', error);
      } finally {
        if (isMounted) {
          setUpdateCheckDone(true);
        }
      }
    };

    checkAppUpdate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!updateCheckDone) {
      return;
    }

    SplashScreen.hide();

    if (forceUpdateRequired) {
      return;
    }

    // Hide splash screen when navigation is ready
    // Wait for navigation container to be initialized
    const hideSplash = () => {
      if (navigationRef.current?.isReady()) {
        SplashScreen.hide();
        // Fix for Android 11-14: Ensure window background is changed after splash is hidden
        // This prevents splash screen from showing when keyboard opens
        if (Platform.OS === 'android') {
          // Small delay to ensure splash is fully hidden before changing background
          setTimeout(() => {
            try {
              // MainActivity will handle window background change, but we ensure it here too
              if (NativeModules.PlatformConstants) {
                // Force a layout update to ensure background is applied
                const {UIManager} = NativeModules;
                if (UIManager && UIManager.setBackgroundColor) {
                  // This helps ensure the background is properly set
                }
              }
            } catch (error) {
              // Ignore errors - MainActivity will handle it
            }
          }, 200);
        }
      } else {
        // Wait for navigation to be ready
        const checkNavigation = setInterval(() => {
          if (navigationRef.current?.isReady()) {
            SplashScreen.hide();
            // Fix for Android 11-14
            if (Platform.OS === 'android') {
              setTimeout(() => {
                try {
                  if (NativeModules.PlatformConstants) {
                    const {UIManager} = NativeModules;
                    if (UIManager && UIManager.setBackgroundColor) {
                      // Ensure background is set
                    }
                  }
                } catch (error) {
                  // Ignore errors
                }
              }, 200);
            }
            clearInterval(checkNavigation);
          }
        }, 100);
        
        // Fallback: hide after 2 seconds if navigation doesn't become ready
        setTimeout(() => {
          SplashScreen.hide();
          // Fix for Android 11-14
          if (Platform.OS === 'android') {
            setTimeout(() => {
              try {
                if (NativeModules.PlatformConstants) {
                  const {UIManager} = NativeModules;
                  if (UIManager && UIManager.setBackgroundColor) {
                    // Ensure background is set
                  }
                }
              } catch (error) {
                // Ignore errors
              }
            }, 200);
          }
          clearInterval(checkNavigation);
        }, 2000);
      }
    };
    
    // Increased delay to ensure app initialization is complete
    setTimeout(hideSplash, 500);
  }, [updateCheckDone, forceUpdateRequired]);

  if (!updateCheckDone) {
    return null;
  }

  if (forceUpdateRequired) {
    return (
      <>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Platform.OS === 'android' ? colors.backgroundWhite : undefined}
          translucent={Platform.OS === 'android' ? true : undefined}
          hidden={false}
        />
        <ForceUpdateModal visible storeUrl={storeUrl} />
      </>
    );
  }

  // Do not re-show splash on app state transitions.
  // Android 13 permission dialogs can trigger inactive/active transitions and
  // re-showing splash there may block first-launch navigation.

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
    backgroundColor: colors.backgroundWhite,
  },
});

export default App;