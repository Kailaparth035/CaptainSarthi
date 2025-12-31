# Firebase Push Notifications - Usage Examples

## Quick Start

The Firebase push notification setup is already configured and ready to use. Here are common usage examples:

## Getting the FCM Token

```typescript
import FirebaseService from './src/Service/FirebaseService';

// Get the current token (cached)
const token = FirebaseService.getCurrentToken();

// Get a fresh token
const freshToken = await FirebaseService.getToken();

// Send token to your backend
if (token) {
  await fetch('https://your-api.com/register-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fcmToken: token }),
  });
}
```

## Listening for Token Refresh

```typescript
import FirebaseService from './src/Service/FirebaseService';

// Token refresh is already handled in App.tsx
// But you can also listen for it manually:
const unsubscribe = FirebaseService.onTokenRefresh((newToken) => {
  console.log('New token:', newToken);
  // Send new token to your backend
  // Unsubscribe when done (usually not needed during app lifetime)
  // unsubscribe();
});
```

## Handling Notifications

### Foreground Notifications
Already handled in `App.tsx`. Notifications will automatically display when the app is in foreground.

### Background/Quit State Notifications
Already handled. To add custom logic:

```typescript
// In App.tsx, you can extend the handlers:
messaging().onNotificationOpenedApp((remoteMessage) => {
  console.log('Notification opened:', remoteMessage);
  
  // Navigate to specific screen based on notification data
  if (remoteMessage.data?.screen) {
    navigation.navigate(remoteMessage.data.screen);
  }
});

// Check if app was opened from notification
messaging().getInitialNotification().then((remoteMessage) => {
  if (remoteMessage) {
    // Handle navigation or other actions
    console.log('App opened from notification:', remoteMessage);
  }
});
```

## Sending Test Notification (Firebase Console)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `captain-sarthi-app`
3. Navigate to **Cloud Messaging**
4. Click **Send test message**
5. Enter your FCM token (check app logs)
6. Enter title and message
7. Click **Test**

## Notification Payload Examples

### Basic Notification
```json
{
  "message": {
    "token": "USER_FCM_TOKEN",
    "notification": {
      "title": "Hello!",
      "body": "This is a test notification"
    }
  }
}
```

### Notification with Data
```json
{
  "message": {
    "token": "USER_FCM_TOKEN",
    "notification": {
      "title": "New Message",
      "body": "You have a new message"
    },
    "data": {
      "screen": "Messages",
      "messageId": "123",
      "type": "chat"
    }
  }
}
```

### Data-Only Message (No Notification UI)
```json
{
  "message": {
    "token": "USER_FCM_TOKEN",
    "data": {
      "type": "silent_update",
      "action": "refresh_data"
    }
  }
}
```

## Checking Permission Status

```typescript
import FirebaseService from './src/Service/FirebaseService';
import messaging from '@react-native-firebase/messaging';

// Request permission (already done in initialization)
const hasPermission = await FirebaseService.requestPermission();

// Check authorization status (iOS)
const authStatus = await messaging().requestPermission();
const enabled =
  authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  authStatus === messaging.AuthorizationStatus.PROVISIONAL;
```

## Deleting Token (Logout)

```typescript
import FirebaseService from './src/Service/FirebaseService';

// When user logs out
await FirebaseService.deleteToken();
// Also delete from your backend
```

## Debugging

Check app logs for:
- `Firebase: Starting initialization...`
- `Firebase: FCM Token obtained successfully`
- `Firebase: Initialization completed successfully`
- `App: Foreground notification received:` (when notification arrives in foreground)
- `Background notification received:` (when notification arrives in background)

## Common Issues

**Token is null:**
- Check `google-services.json` is in `android/app/`
- Verify package name matches Firebase project
- Check internet connection

**Notifications not showing:**
- Verify permissions are granted
- Check notification channel exists (Android)
- Ensure background handler is in `index.js`

**Permission denied:**
- User denied permission in system settings
- Check app settings and enable notifications manually


