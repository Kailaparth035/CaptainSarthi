# Firebase Push Notification Setup - Background & Killed State

## ✅ Current Setup Status

The Firebase notification setup is configured to show push notifications in:
- ✅ **Background mode** (app is in background)
- ✅ **Killed state** (app is completely closed)

## 📋 Configuration Files

### 1. **index.js** - Background Message Handler
- Background handler is registered using `messaging().setBackgroundMessageHandler()`
- This handler runs when the app receives notifications in background/killed state
- **Important**: If the notification payload contains a `notification` field, Firebase will automatically display it

### 2. **AndroidManifest.xml** - Android Configuration
- ✅ `POST_NOTIFICATIONS` permission (required for Android 13+)
- ✅ `VIBRATE` permission
- ✅ Default notification channel configured
- ✅ Default notification icon set

### 3. **FirebaseService.ts** - Notification Handlers
- Foreground notifications: `onMessage()` handler
- Background/Quit state: `onNotificationOpenedApp()` and `getInitialNotification()`

## 🔔 How It Works

### Background & Killed State Notifications

For notifications to **automatically display** in background/killed state, the server must send a payload with a `notification` field:

```json
{
  "notification": {
    "title": "Notification Title",
    "body": "Notification Body"
  },
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

**OR** just notification field:

```json
{
  "notification": {
    "title": "Notification Title",
    "body": "Notification Body"
  }
}
```

### Data-Only Messages

If the server sends only `data` field (no `notification` field), the notification will NOT automatically display. You would need to manually create a notification in the background handler.

## 📱 Testing

### Test Background Notifications:
1. Open the app
2. Press home button (app goes to background)
3. Send a push notification with `notification` field
4. Notification should appear in the notification tray

### Test Killed State Notifications:
1. Completely close the app (swipe away from recent apps)
2. Send a push notification with `notification` field
3. Notification should appear in the notification tray
4. Tapping the notification will open the app

## ⚠️ Important Notes

1. **Notification Payload Structure**: The server MUST include a `notification` field in the payload for automatic display in background/killed state.

2. **Android 13+ (API 33+)**: The app requests `POST_NOTIFICATIONS` permission on first launch.

3. **Notification Channel**: React Native Firebase automatically creates a default notification channel. The AndroidManifest specifies this channel.

4. **Background Handler**: The background handler in `index.js` is mainly for processing data-only messages. For notifications with `notification` field, Firebase handles display automatically.

## 🔧 Server-Side Requirements

When sending push notifications from your server (Firebase Admin SDK or FCM API), ensure:

```javascript
// Example using Firebase Admin SDK
const message = {
  notification: {
    title: 'Notification Title',
    body: 'Notification Body',
  },
  data: {
    // Optional: additional data
    screen: 'HomeScreen',
    id: '123'
  },
  token: userFcmToken, // or topic: 'all'
};

await admin.messaging().send(message);
```

## ✅ Verification Checklist

- [x] Background message handler registered in `index.js`
- [x] Android permissions in AndroidManifest.xml
- [x] Default notification channel configured
- [x] Firebase initialized in App.tsx
- [x] Notification handlers set up in App.tsx
- [x] Google Services plugin applied in build.gradle
- [x] google-services.json file present

## 🐛 Troubleshooting

If notifications don't show in background/killed state:

1. **Check notification payload**: Must include `notification` field
2. **Check permissions**: Ensure `POST_NOTIFICATIONS` is granted (Android 13+)
3. **Check logs**: Look for "Background notification received" in logs
4. **Verify FCM token**: Ensure the token is valid and registered
5. **Test with Firebase Console**: Send a test notification from Firebase Console to verify setup

















