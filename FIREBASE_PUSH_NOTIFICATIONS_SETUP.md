# Firebase Push Notifications Setup

This guide documents the Firebase push notification setup for the React Native app.

## Overview

The app uses `@react-native-firebase/messaging` for Firebase Cloud Messaging (FCM) push notifications with support for:
- ✅ Foreground notifications (when app is open)
- ✅ Background notifications (when app is in background)
- ✅ Quit state notifications (when app is closed)
- ✅ Android notification channels
- ✅ Permission handling for Android 13+

## Configuration Files

### 1. Package Dependencies
The following packages are installed in `package.json`:
- `@react-native-firebase/app` - Firebase core
- `@react-native-firebase/messaging` - FCM messaging
- `@notifee/react-native` - Enhanced notifications for Android

### 2. Android Configuration

#### `android/build.gradle`
- Google Services classpath: `com.google.gms:google-services:4.4.0`

#### `android/app/build.gradle`
- Google Services plugin applied at the end
- Firebase dependencies included via autolinking

#### `android/app/google-services.json`
- Firebase project configuration file
- Contains project ID, API keys, and package name

#### `android/app/src/main/AndroidManifest.xml`
- Required permissions:
  - `POST_NOTIFICATIONS` (Android 13+)
  - `VIBRATE`
- Firebase metadata for default notification channel and icon

#### `android/app/src/main/java/com/farmer/MainApplication.kt`
- Creates notification channel on app startup
- Channel ID: `default_channel`

### 3. JavaScript/TypeScript Configuration

#### `index.js`
- Background message handler registered
- Handles notifications when app is in background/quit state

#### `App.tsx`
- Firebase initialization on app startup
- Foreground notification handler
- Notification opened handlers

#### `src/Service/FirebaseService.ts`
- Singleton service for Firebase operations
- Handles:
  - Permission requests
  - FCM token management
  - Notification listeners
  - Token refresh

## How It Works

### Initialization Flow

1. **App Startup** (`App.tsx`):
   - Creates notification channel (Android)
   - Initializes Firebase service
   - Sets up notification listeners

2. **Firebase Service** (`FirebaseService.ts`):
   - Requests notification permissions
   - Gets FCM token
   - Sets up token refresh listener
   - Checks for initial notification

3. **Notification Channels**:
   - Android: Created in `MainApplication.kt` and `App.tsx`
   - Channel ID: `default_channel`
   - High importance with vibration and sound

### Notification States

#### Foreground (App Open)
- Handler: `messaging().onMessage()` in `App.tsx`
- Displays notification using Notifee
- Shows notification even when app is active

#### Background (App Minimized)
- Handler: `setBackgroundMessageHandler()` in `index.js`
- Firebase automatically displays notification payloads
- Custom handler for data-only messages

#### Quit State (App Closed)
- Checked via `getInitialNotification()` in `App.tsx`
- Notification opens app when tapped
- Handler runs on app startup

## Getting FCM Token

The FCM token is obtained automatically during initialization. To get it:

```typescript
import FirebaseService from './src/Service/FirebaseService';

// Get current token
const token = FirebaseService.getCurrentToken();

// Or get fresh token
const token = await FirebaseService.getToken();
```

## Sending Test Notifications

### Using Firebase Console

1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Enter FCM token (from app logs)
4. Enter title and message
5. Click "Test"

### Using cURL

```bash
curl -X POST https://fcm.googleapis.com/v1/projects/captain-sarthi-app/messages:send \
  -H "Authorization: Bearer YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "USER_FCM_TOKEN",
      "notification": {
        "title": "Test Notification",
        "body": "This is a test message"
      }
    }
  }'
```

## Testing

1. **Build and run the app**:
   ```bash
   npm run android
   ```

2. **Check logs for FCM token**:
   - Look for "Firebase: FCM Token obtained successfully"
   - Token will be logged (first 20 chars)

3. **Send test notification**:
   - Use Firebase Console or API
   - App should receive and display notification

4. **Test different states**:
   - **Foreground**: Keep app open, send notification
   - **Background**: Minimize app, send notification
   - **Quit**: Close app, send notification, tap to open

## Troubleshooting

### Token Not Received
- Check `google-services.json` is in `android/app/`
- Verify package name matches Firebase project
- Check app logs for initialization errors

### Notifications Not Showing
- Verify notification permissions are granted
- Check notification channel is created (Android)
- Ensure background handler is registered in `index.js`

### Android 13+ Permission Issues
- The app automatically requests `POST_NOTIFICATIONS` permission
- Check app settings if permission was denied

## Files Modified/Created

1. `android/app/google-services.json` - Firebase config
2. `android/app/build.gradle` - Google Services plugin
3. `android/build.gradle` - Google Services classpath
4. `android/app/src/main/AndroidManifest.xml` - Permissions & metadata
5. `android/app/src/main/java/com/farmer/MainApplication.kt` - Notification channel
6. `index.js` - Background handler
7. `App.tsx` - Foreground handlers & initialization
8. `src/Service/FirebaseService.ts` - Firebase service

## Next Steps

- [ ] Send FCM token to your backend server
- [ ] Implement notification action handlers
- [ ] Add deep linking support for notification navigation
- [ ] Customize notification icons and sounds
- [ ] Add notification badges and categories




