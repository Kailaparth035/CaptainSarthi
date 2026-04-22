import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize Firebase
    FirebaseApp.configure()

    // Request notification authorization
    UNUserNotificationCenter.current().delegate = self
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().requestAuthorization(
      options: authOptions,
      completionHandler: { granted, error in
        if let error = error {
          print("Error requesting notification authorization: \(error.localizedDescription)")
        } else {
          print("Notification authorization granted: \(granted)")
        }
      }
    )
    
    application.registerForRemoteNotifications()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Farmer",
      in: window,
      launchOptions: launchOptions
    )

    // Keep launch UI until JS calls SplashScreen.hide() (see App.tsx)
    RNSplashScreen.show()

    return true
  }

  // Register for remote notifications
  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    // Set APNS token for Firebase Messaging
    Messaging.messaging().apnsToken = deviceToken
    print("APNS token registered with Firebase")
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("Failed to register for remote notifications: \(error.localizedDescription)")
  }
  
  // Handle notification when app is in foreground
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    let userInfo = notification.request.content.userInfo
    print("Notification received in foreground: \(userInfo)")
    
    // Show notification even when app is in foreground
    if #available(iOS 14.0, *) {
      completionHandler([[.banner, .sound, .badge]])
    } else {
      completionHandler([[.alert, .sound, .badge]])
    }
  }
  
  // Handle notification tap
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    print("Notification tapped: \(userInfo)")
    completionHandler()
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
    // FIXED → Use sharedSettings and jsBundleURL
    return RCTBundleURLProvider.sharedSettings()
      .jsBundleURL(forBundleRoot: "index")
    #else
    // Production bundle
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
