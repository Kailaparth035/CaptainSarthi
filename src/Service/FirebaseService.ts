/**
 * Firebase Service
 * Handles Firebase initialization and push notifications
 */

import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid, Alert, AppState, AppStateStatus} from 'react-native';
import {isEmulatorSync} from 'react-native-device-info';
import {getUserRole} from '../utils/session';
import {postData} from './Apimethod';
import Apis from './constant';

function formatMessagingError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  const err = error as {message?: string; code?: string; nativeErrorMessage?: string};
  const parts = [err?.code, err?.message || err?.nativeErrorMessage].filter(Boolean);
  return parts.length ? parts.join(' — ') : String(error);
}

class FirebaseService {
  private static instance: FirebaseService;
  private fcmToken: string | null = null;
  private onTokenRefreshCallback: ((token: string) => void) | null = null;
  private onNotificationCallback: ((notification: any) => void) | null = null;
  private onNotificationOpenedCallback: ((notification: any) => void) | null = null;
  private unsubscribeTokenRefresh: (() => void) | null = null;
  private unsubscribeForeground: (() => void) | null = null;
  private appStateSubscription: any = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private retryCount: number = 0;
  private readonly MAX_RETRIES = 3;
  private readonly IOS_TOKEN_EXTRA_RETRIES = 4;

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
   * iOS: must register for remote messages before getToken() or Firebase throws
   * [messaging/unregistered]. Do not swallow registration failures then call getToken.
   */
  private async ensureRegisteredForRemoteMessages(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }
    await messaging().registerDeviceForRemoteMessages();
  }

  /**
   * Get FCM token with retry logic
   */
  async getToken(retry: number = 0): Promise<string | null> {
    const maxAttempts =
      Platform.OS === 'ios'
        ? this.MAX_RETRIES + this.IOS_TOKEN_EXTRA_RETRIES
        : this.MAX_RETRIES;

    try {
      await this.ensureRegisteredForRemoteMessages();

      const token = await messaging().getToken();
      this.fcmToken = token;
      this.retryCount = 0; // Reset retry count on success
      console.log('Firebase: FCM Token obtained:', token);
      console.log('Firebase: Token length:', token?.length || 0);

      if (!token) {
        console.warn('Firebase: FCM token is null or empty');
        if (retry < maxAttempts) {
          const delayMs =
            Platform.OS === 'ios' ? 1500 * (retry + 1) : 1000 * (retry + 1);
          console.log(
            `Firebase: Retrying token retrieval (attempt ${retry + 1}/${maxAttempts})...`,
          );
          await new Promise<void>(resolve =>
            setTimeout(() => resolve(), delayMs),
          );
          return this.getToken(retry + 1);
        }
      }

      return token;
    } catch (error) {
      const detail = formatMessagingError(error);
      console.warn('Firebase: Error getting token:', detail);

      if (retry < maxAttempts) {
        const delayMs =
          Platform.OS === 'ios' ? 1500 * (retry + 1) : 1000 * (retry + 1);
        console.log(
          `Firebase: Retrying token retrieval after error (attempt ${retry + 1}/${maxAttempts})...`,
        );
        await new Promise<void>(resolve =>
          setTimeout(() => resolve(), delayMs),
        );
        return this.getToken(retry + 1);
      }

      return null;
    }
  }

  /**
   * Re-fetch token after app resume. Always uses getToken() so iOS registration runs first.
   */
  async validateToken(): Promise<string | null> {
    const previous = this.fcmToken;
    try {
      const freshToken = await this.getToken(0);
      if (
        freshToken &&
        previous !== freshToken &&
        this.onTokenRefreshCallback
      ) {
        this.onTokenRefreshCallback(freshToken);
      }
      return freshToken;
    } catch (error) {
      console.error(
        'Firebase: Error validating token:',
        formatMessagingError(error),
      );
      return this.getToken(0);
    }
  }

  /**
   * Delete FCM token
   */
  async deleteToken(): Promise<void> {
    try {
      await this.ensureRegisteredForRemoteMessages();
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
   * Get FCM token with a timeout (for non-blocking flows like post-login).
   */
  async getTokenWithTimeout(timeoutMs: number = 5000): Promise<string | null> {
    const cached = this.getCurrentToken();
    if (cached) {
      return cached;
    }

    try {
      return await Promise.race([
        this.getToken(0),
        new Promise<null>(resolve =>
          setTimeout(() => resolve(null), timeoutMs),
        ),
      ]);
    } catch {
      return null;
    }
  }

  /**
   * Unregister FCM token on logout. Runs in background — do not await on profile screen.
   * Pass role and cached token captured before clearSession() to avoid races.
   */
  unregisterFcmOnLogout(
    role: string | null,
    cachedToken: string | null = this.getCurrentToken(),
  ): void {
    void this.unregisterFcmOnLogoutAsync(role, cachedToken);
  }

  private async unregisterFcmOnLogoutAsync(
    role: string | null,
    cachedToken: string | null,
  ): Promise<void> {
    try {
      const deviceToken =
        cachedToken ?? (await this.getTokenWithTimeout(4000));
      if (!deviceToken) {
        console.log(
          '[Firebase] FCM token not available for logout unregister',
        );
        return;
      }

      const bodyData = {device_token: deviceToken};

      if (role === 'farmer') {
        await postData(Apis.FARMER_FCM_UNREGISTER, bodyData);
        console.log('[Firebase] Farmer FCM token unregistered on logout');
      } else {
        await postData(Apis.DEALER_FCM_UNREGISTER, bodyData);
        console.log('[Firebase] Dealer FCM token unregistered on logout');
      }
    } catch (error) {
      console.error('[Firebase] FCM unregister on logout failed:', error);
    }
  }

  /**
   * Register device FCM token with backend after login. Runs in background — do not await on login screen.
   */
  registerFcmAfterLogin(role: string): void {
    void this.registerFcmAfterLoginAsync(role);
  }

  private async registerFcmAfterLoginAsync(role: string): Promise<void> {
    try {
      const deviceToken = await this.getTokenWithTimeout(6000);
      if (!deviceToken) {
        console.log('[Firebase] FCM token not available for post-login registration');
        return;
      }

      const deviceType = Platform.OS === 'android' ? 'android' : 'ios';
      const bodyData = {device_token: deviceToken, device_type: deviceType};

      if (role === 'farmer') {
        await postData(Apis.FARMER_FCM_REGISTER, bodyData);
        console.log('[Firebase] Farmer FCM token registered after login');
      } else if (role === 'dealer') {
        await postData(Apis.DEALER_FCM_REGISTER, bodyData);
        console.log('[Firebase] Dealer FCM token registered after login');
      }
    } catch (error) {
      console.error('[Firebase] Post-login FCM registration failed:', error);
    }
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
      console.log(
        'Firebase: Foreground notification received:',
        JSON.stringify(remoteMessage, null, 2),
      );

      if (remoteMessage.notification) {
        const {title, body} = remoteMessage.notification;
        let showAlert = true;
        try {
          const userRole = await getUserRole();
          if (userRole === 'farmer') {
            showAlert = false;
          }
        } catch (e) {
          console.warn('Firebase: Could not read user role for foreground alert:', formatMessagingError(e));
        }
        if (showAlert) {
          Alert.alert(
            title || 'Notification',
            body || 'You have a new notification',
            [{text: 'OK'}],
            {cancelable: true},
          );
        }
      }

      if (callback) {
        callback(remoteMessage);
      }
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
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.onTokenRefreshCallback = null;
    this.onNotificationCallback = null;
    this.onNotificationOpenedCallback = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Firebase service
   * Sets up all notification handlers (foreground, background, quit state)
   * Prevents multiple simultaneous initializations
   */
  async initialize(
    onForegroundNotification?: (notification: any) => void,
    onNotificationOpened?: (notification: any) => void,
    onTokenRefresh?: (token: string) => void,
  ): Promise<void> {
    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      console.log('Firebase: Initialization already in progress, waiting...');
      return this.initializationPromise;
    }

    // If already initialized, just update callbacks
    if (this.isInitialized) {
      console.log('Firebase: Already initialized, updating callbacks...');
      if (onForegroundNotification) {
        this.onMessage(onForegroundNotification);
      }
      if (onNotificationOpened) {
        this.onNotificationOpenedApp(onNotificationOpened);
      }
      if (onTokenRefresh) {
        this.onTokenRefresh(onTokenRefresh);
      }
      return Promise.resolve();
    }

    // Create initialization promise
    this.initializationPromise = this._doInitialize(
      onForegroundNotification,
      onNotificationOpened,
      onTokenRefresh
    );

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  /**
   * Internal initialization method
   */
  private async _doInitialize(
    onForegroundNotification?: (notification: any) => void,
    onNotificationOpened?: (notification: any) => void,
    onTokenRefresh?: (token: string) => void,
  ): Promise<void> {
    try {
      console.log('Firebase: Initializing Firebase service...');
      console.log('Firebase: Platform:', Platform.OS);
      // Note: Firebase app auto-initializes from native config files
      // (google-services.json for Android, GoogleService-Info.plist for iOS)

      // Delay permission request for Android 15+ (API 35+) to avoid blocking UI on first launch
      // Request permission after a delay to ensure app UI is loaded first
      const androidVersion = Platform.OS === 'android' 
        ? (typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version as string, 10))
        : 0;
      
      let hasPermission = false;
      let token: string | null = null;
      
      if (androidVersion >= 35) {
        // For Android 15+, delay permission request to avoid blocking onboarding
        console.log('Firebase: Android 15+ detected - delaying permission request to avoid blocking UI');
        setTimeout(async () => {
          console.log('Firebase: Requesting notification permissions (delayed)...');
          const permissionGranted = await this.requestPermission();
          if (!permissionGranted) {
            console.warn('Firebase: ⚠️ Notification permission not granted. Notifications may not work.');
          } else {
            console.log('Firebase: ✅ Notification permission granted');
            // Get token after permission is granted
            const fcmToken = await this.getToken();
            if (fcmToken) {
              console.log('Firebase: ✅ FCM token obtained after permission grant');
            }
          }
        }, 2000); // Delay 2 seconds to allow app to load
        // For Android 15+, skip immediate permission request and token retrieval
        hasPermission = false; // Will be set in delayed callback
        token = null; // Will be requested after permission
      } else {
        // For older Android versions, request permission immediately
        console.log('Firebase: Requesting notification permissions...');
        hasPermission = await this.requestPermission();
        if (!hasPermission) {
          console.warn('Firebase: ⚠️ Notification permission not granted. Notifications may not work.');
        } else {
          console.log('Firebase: ✅ Notification permission granted');
        }
        
        // Get initial token with retry logic for older versions
        console.log('Firebase: Getting FCM token...');
        token = await this.getToken();
        if (token) {
          console.log('Firebase: ✅ Initial FCM token obtained successfully');
          console.log('Firebase: 📱 Token (first 20 chars):', token.substring(0, 20) + '...');
          // You can send this token to your backend here
        } else {
          const simHint = isEmulatorSync()
            ? ' Simulators often cannot receive a real FCM token; use a physical device for push.'
            : ' Check notification permission, Firebase iOS setup (APNs key), and GoogleService-Info.plist.';
          console.warn(
            'Firebase: FCM token not available after retries.' + simHint,
          );
        }
      }

      // Set up token refresh listener (always set up, but use callback if provided)
      this.onTokenRefresh((newToken) => {
        console.log('Firebase: 🔄 Token refreshed to:', newToken.substring(0, 20) + '...');
        if (onTokenRefresh) {
          onTokenRefresh(newToken);
        }
        // You can send this token to your backend here
      });

      // Set up foreground notification handler
      if (onForegroundNotification) {
        console.log('Firebase: Setting up foreground notification handler...');
        this.onMessage(onForegroundNotification);
      } else {
        // Set up default handler even if no callback provided
        this.onMessage((remoteMessage) => {
          console.log('Firebase: Foreground notification (no custom handler):', remoteMessage);
        });
      }

      // Set up background/quit state notification handler
      if (onNotificationOpened) {
        console.log('Firebase: Setting up notification opened handler...');
        this.onNotificationOpenedApp(onNotificationOpened);
      }

      // Check if app was opened from a notification (quit state)
      console.log('Firebase: Checking for initial notification...');
      const initialNotification = await this.getInitialNotification();
      if (initialNotification) {
        console.log('Firebase: ✅ App was opened from a notification');
      }

      // Set up app state monitoring to re-validate token when app comes to foreground
      this.setupAppStateMonitoring();

      this.isInitialized = true;
      console.log('Firebase: ✅ Initialization complete');
      console.log('Firebase: 📋 Setup Summary:');
      console.log('  - Permission:', hasPermission ? '✅ Granted' : '❌ Denied');
      console.log('  - FCM Token:', token ? '✅ Obtained' : '❌ Failed');
      console.log('  - Foreground Handler: ✅ Set up');
      console.log('  - Background Handler: ✅ Set up (in index.js)');
      console.log('  - App State Monitoring: ✅ Set up');
    } catch (error) {
      console.error('Firebase: ❌ Error initializing:', error);
      console.error('Firebase: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Set up app state monitoring to re-validate token when app comes to foreground
   */
  private setupAppStateMonitoring(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    let appState = AppState.currentState;
    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        console.log('Firebase: App came to foreground, validating token...');
        try {
          await this.validateToken();
          console.log('Firebase: ✅ Token validated after app state change');
        } catch (error) {
          console.error('Firebase: Error validating token after app state change:', error);
        }
      }
      appState = nextAppState;
    });
  }
}

export default FirebaseService.getInstance();
