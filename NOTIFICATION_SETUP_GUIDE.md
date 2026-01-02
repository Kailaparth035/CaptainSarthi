# Push Notification Setup Guide - Complete Fix

## ✅ What Was Fixed

### 1. **Foreground Notifications**
- ✅ Added Alert display for foreground notifications (both Android & iOS)
- ✅ Improved logging with detailed notification data
- ✅ Better error handling

### 2. **Background Notifications**
- ✅ Enhanced background handler in `index.js` with better logging
- ✅ Proper Promise handling
- ✅ Data payload processing

### 3. **Error Handling & Logging**
- ✅ Comprehensive logging throughout the notification flow
- ✅ Setup summary on initialization
- ✅ Better error messages with stack traces

### 4. **Token Management**
- ✅ Enhanced token logging (shows first 20 chars for security)
- ✅ Better error handling for token retrieval
- ✅ Token validation

## 📋 Current Setup Status

### Android ✅
- [x] `google-services.json` configured
- [x] Notification channel created in `MainApplication.kt`
- [x] Permissions in `AndroidManifest.xml`:
  - `POST_NOTIFICATIONS` (Android 13+)
  - `VIBRATE`
- [x] Default notification channel ID: `default`
- [x] Background message handler registered in `index.js`

### iOS ✅
- [x] Firebase initialized in `AppDelegate.swift`
- [x] APNS token registration
- [x] Notification authorization request
- [x] `UNUserNotificationCenterDelegate` implemented
- [x] `UIBackgroundModes` with `remote-notification` in `Info.plist`
- ⚠️ **IMPORTANT**: Ensure `GoogleService-Info.plist` is in `ios/Farmer/` directory

## 🔔 How Notifications Work Now

### Foreground (App is Open)
1. Notification received → `FirebaseService.onMessage()` triggered
2. **Alert is displayed** to the user immediately
3. Custom callback in `App.tsx` processes the notification
4. Full notification data is logged to console

### Background (App is Minimized)
1. Notification received → `setBackgroundMessageHandler()` in `index.js` processes it
2. If payload contains `notification` field, **Firebase automatically displays** the notification
3. User taps notification → `onNotificationOpenedApp()` callback triggered
4. Custom handler in `App.tsx` processes the tap

### Quit State (App is Closed)
1. Notification received → **Firebase automatically displays** the notification
2. User taps notification → App opens
3. `getInitialNotification()` retrieves the notification
4. `onNotificationOpened` callback in `App.tsx` processes it

## 🧪 Testing Notifications

### Step 1: Check Setup
1. Build and run the app
2. Check console logs for:
   ```
   Firebase: ✅ Initialization complete
   Firebase: ✅ Initial FCM token obtained successfully
   ```
3. Copy the FCM token from logs

### Step 2: Send Test Notification

#### Using Firebase Console:
1. Go to Firebase Console → Cloud Messaging
2. Click "Send test message"
3. Enter FCM token
4. Enter title and message
5. Click "Test"

#### Using cURL (with notification field):
```bash
curl -X POST https://fcm.googleapis.com/v1/projects/captain-sarthi-app/messages:send \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "USER_FCM_TOKEN",
      "notification": {
        "title": "Test Notification",
        "body": "This is a test message"
      },
      "data": {
        "customKey": "customValue"
      }
    }
  }'
```

### Step 3: Test All States

1. **Foreground Test**:
   - Keep app open
   - Send notification
   - Should see Alert popup immediately

2. **Background Test**:
   - Press home button (app goes to background)
   - Send notification
   - Should see notification in system tray
   - Tap notification → app opens and callback fires

3. **Quit State Test**:
   - Force close the app
   - Send notification
   - Should see notification in system tray
   - Tap notification → app opens and callback fires

## 🔍 Troubleshooting

### Notifications Not Appearing?

1. **Check Permissions**:
   - Android: Settings → Apps → Captain Saathi → Notifications (should be ON)
   - iOS: Settings → Notifications → Captain Saathi (should be ON)

2. **Check Logs**:
   - Look for "Firebase: ✅ Initialization complete"
   - Look for "Firebase: ✅ Initial FCM token obtained"
   - Check for any error messages

3. **Verify Token**:
   - Token should be a long string (usually 150+ characters)
   - If token is null, check Firebase configuration files

4. **Check Notification Payload**:
   - Must include `notification` field for automatic display:
     ```json
     {
       "notification": {
         "title": "Title",
         "body": "Body"
       }
     }
     ```

5. **iOS Specific**:
   - Ensure `GoogleService-Info.plist` exists in `ios/Farmer/`
   - Run `cd ios && pod install && cd ..`
   - Rebuild the app

6. **Android Specific**:
   - Ensure `google-services.json` is in `android/app/`
   - Clean build: `npm run clean:android && npm run android`
   - Check notification channel exists (should be created automatically)

## 📝 Important Notes

1. **Notification Payload Format**:
   - For automatic display, include `notification` field
   - `data` field is for custom app logic
   - Both can be used together

2. **Foreground Notifications**:
   - Currently shows Alert (native popup)
   - For better UX, consider installing `@notifee/react-native` for Android
   - iOS handles foreground notifications via AppDelegate

3. **Token Management**:
   - Token is automatically refreshed when needed
   - Store token on your backend for sending notifications
   - Token changes when app is reinstalled or data is cleared

4. **Background Handler**:
   - Must be registered in `index.js` BEFORE `AppRegistry.registerComponent`
   - Runs in a headless JS task
   - Must return a Promise

## 🚀 Next Steps (Optional Improvements)

1. **Install @notifee/react-native** for better Android notifications:
   ```bash
   npm install @notifee/react-native
   ```

2. **Add notification actions** (buttons on notifications)

3. **Implement deep linking** from notification data

4. **Add notification sound customization**

5. **Create notification categories** for different types

