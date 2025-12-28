/**
 * Firebase Service
 * Handles Firebase initialization and push notifications
 */

import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';

class FirebaseService {
  private static instance: FirebaseService;
  private fcmToken: string | null = null;
  private onTokenRefreshCallback: ((token: string) => void) | null = null;
  private onNotificationCallback: ((notification: any) => void) | null = null;
  private onNotificationOpenedCallback: ((notification: any) => void) | null = null;

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
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

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
   */
  onTokenRefresh(callback: (token: string) => void): () => void {
    this.onTokenRefreshCallback = callback;
    return messaging().onTokenRefresh((token) => {
      this.fcmToken = token;
      console.log('Firebase: Token refreshed:', token);
      callback(token);
    });
  }

  /**
   * Set callback for foreground notifications
   */
  onMessage(callback: (notification: any) => void): () => void {
    this.onNotificationCallback = callback;
    return messaging().onMessage(async (remoteMessage) => {
      console.log('Firebase: Foreground notification received:', remoteMessage);
      callback(remoteMessage);
    });
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
   * Initialize Firebase service
   */
  async initialize(): Promise<void> {
    try {
      // Request permission
      await this.requestPermission();

      // Get initial token
      await this.getToken();

      // Set up token refresh listener
      this.onTokenRefresh((token) => {
        console.log('Firebase: Token refreshed to:', token);
        // You can send this token to your backend here
      });

      // Check if app was opened from a notification (quit state)
      await this.getInitialNotification();
    } catch (error) {
      console.error('Firebase: Error initializing:', error);
    }
  }
}

export default FirebaseService.getInstance();
