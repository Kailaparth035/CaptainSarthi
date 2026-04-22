package com.captainsaathi.farmerapp

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import org.devio.rn.splashscreen.SplashScreen

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreen.show(this) // Show splash screen on every app launch/reopen
    setTheme(R.style.AppTheme) // Switch away from LaunchTheme so keyboard redraws don't show splash
    super.onCreate(savedInstanceState)

    // Fix for Android 11-14: Change window background after splash is hidden
    // This prevents splash screen from showing when keyboard opens
    Handler(Looper.getMainLooper()).postDelayed({
      try {
        // Change window background to white to prevent splash from showing on keyboard open
        window.setBackgroundDrawableResource(R.drawable.white_background)
      } catch (e: Exception) {
        // Ignore if drawable not found
      }
    }, 1000) // Delay to ensure splash is hidden first
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Farmer"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
