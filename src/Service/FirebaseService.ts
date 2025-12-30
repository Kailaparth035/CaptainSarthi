/**
 * Firebase Service
 * Handles Firebase initialization and push notifications
 */

import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid} from 'react-native';

class FirebaseService {
  private static instance: FirebaseService;
  private fcmToken: string | null = null;
  private onTokenRefreshCallback: ((token: string) => void) | null = null;
  private onNotificationCallback: ((notification: any) => void) | null = null;
  private onNotificationOpenedCallback: ((notification: any) => void) | null = null;
  private unsubscribeTokenRefresh: (() => void) | null = null;
  private unsubscribeForeground: (() => void) | null = null;

  private constructor() {}

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // For Android 13+ (API 33+), we need to request POST_NOTIFICATIONS permission
        const androidVersion = typeof Platform.Version === 'number' 
          ? Platform.Version 
          : parseInt(Platform.Version as string, 10);

        if (androidVersion >= 33) {
          // Android 13+ requires POST_NOTIFICATIONS permission
          console.log('Firebase: Requesting POST_NOTIFICATIONS permission for Android 13+');
          
          try {
            // Check if permission is already granted
            const checkResult = await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );

            if (checkResult) {
              console.log('Firebase: Notification permission already granted');
              return true;
            }

            // Request permission - this will show the system permission dialog
            console.log('Firebase: Requesting notification permission...');
            const requestResult = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            console.log('Firebase: Notification permission request result:', requestResult);

            if (requestResult === PermissionsAndroid.RESULTS.GRANTED) {
              console.log('Firebase: Notification permission granted');
              return true;
            } else {
              console.log('Firebase: Notification permission denied');
              return false;
            }
          } catch (error) {
            console.error('Firebase: Error requesting POST_NOTIFICATIONS permission:', error);
            return false;
          }
        } else {
          // For Android < 13, Firebase messaging handles permissions automatically
          console.log('Firebase: Android < 13, using Firebase messaging permission');
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

          if (enabled) {
            console.log('Firebase: Notification permission granted');
            return true;
          } else {
            console.log('Firebase: Notification permission denied');
            return false;
          }
        }
      } else {
        // iOS
        console.log('Firebase: Requesting notification permission for iOS');
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          console.log('Firebase: iOS notification permission granted');
        } else {
          console.log('Firebase: iOS notification permission denied');
        }

        return enabled;
      }
    } catch (error) {
      console.error('Firebase: Error requesting permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      console.log('Firebase: FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Firebase: Error getting token:', error);
      return null;
    }
  }

  /**
   * Delete FCM token
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      this.fcmToken = null;
      console.log('Firebase: Token deleted');
    } catch (error) {
      console.error('Firebase: Error deleting token:', error);
    }
  }

  /**
   * Get current FCM token (cached)
   */
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Set callback for token refresh
   * Returns unsubscribe function
   */
  onTokenRefresh(callback: (token: string) => void): () => void {
    this.onTokenRefreshCallback = callback;
    
    // Unsubscribe previous listener if exists
    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
    }
    
    // Set up new listener
    this.unsubscribeTokenRefresh = messaging().onTokenRefresh((token) => {
      this.fcmToken = token;
      console.log('Firebase: Token refreshed:', token);
      callback(token);
    });
    
    return this.unsubscribeTokenRefresh;
  }

  /**
   * Set callback for foreground notifications
   * Returns unsubscribe function
   */
  onMessage(callback: (notification: any) => void): () => void {
    this.onNotificationCallback = callback;
    
    // Unsubscribe previous listener if exists
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
    }
    
    // Set up new listener
    this.unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Firebase: Foreground notification received:', remoteMessage);
      callback(remoteMessage);
    });
    
    return this.unsubscribeForeground;
  }

  /**
   * Set callback for notification opened (background/quit state)
   */
  onNotificationOpenedApp(callback: (notification: any) => void): void {
    this.onNotificationOpenedCallback = callback;
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        'Firebase: Notification opened from background state:',
        remoteMessage,
      );
      callback(remoteMessage);
    });
  }

  /**
   * Check if app was opened from a notification (quit state)
   */
  async getInitialNotification(): Promise<any> {
    try {
      const remoteMessage = await messaging().getInitialNotification();
      if (remoteMessage) {
        console.log(
          'Firebase: Notification opened from quit state:',
          remoteMessage,
        );
        if (this.onNotificationOpenedCallback) {
          this.onNotificationOpenedCallback(remoteMessage);
        }
      }
      return remoteMessage;
    } catch (error) {
      console.error('Firebase: Error getting initial notification:', error);
      return null;
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup(): void {
    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
      this.unsubscribeTokenRefresh = null;
    }
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
      this.unsubscribeForeground = null;
    }
    this.onTokenRefreshCallback = null;
    this.onNotificationCallback = null;
    this.onNotificationOpenedCallback = null;
  }

  /**
   * Initialize Firebase service
   * Sets up all notification handlers (foreground, background, quit state)
   */
  async initialize(
    onForegroundNotification?: (notification: any) => void,
    onNotificationOpened?: (notification: any) => void,
    onTokenRefresh?: (token: string) => void,
  ): Promise<void> {
    try {
      console.log('Firebase: Initializing Firebase service...');

      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('Firebase: Notification permission not granted');
      }

      // Get initial token
      const token = await this.getToken();
      if (token) {
        console.log('Firebase: Initial FCM token obtained');
        // You can send this token to your backend here
      }

      // Set up token refresh listener (always set up, but use callback if provided)
      this.onTokenRefresh((newToken) => {
        console.log('Firebase: Token refreshed to:', newToken);
        if (onTokenRefresh) {
          onTokenRefresh(newToken);
        }
        // You can send this token to your backend here
      });

      // Set up foreground notification handler
      if (onForegroundNotification) {
        this.onMessage(onForegroundNotification);
      }

      // Set up background/quit state notification handler
      if (onNotificationOpened) {
        this.onNotificationOpenedApp(onNotificationOpened);
      }

      // Check if app was opened from a notification (quit state)
      await this.getInitialNotification();

      console.log('Firebase: Initialization complete');
    } catch (error) {
      console.error('Firebase: Error initializing:', error);
      throw error;
    }
  }
}

export default FirebaseService.getInstance();
