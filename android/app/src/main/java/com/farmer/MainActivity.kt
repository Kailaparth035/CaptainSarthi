package com.farmer

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  private var splashHandler: Handler? = null
  private var splashOverlay: View? = null

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

  /**
   * Keep native splash screen visible for 3 seconds, then hide it
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    // Install the splash screen API (for Android 12+)
    installSplashScreen()
    
    // Call super.onCreate to initialize React Native
    super.onCreate(savedInstanceState)
    
    // Create splash overlay immediately to ensure image is visible
    // Use post to ensure view hierarchy is ready
    window.decorView.post {
      createSplashOverlay()
      
      // Keep splash screen visible for 3 seconds, then hide it
      splashHandler = Handler(Looper.getMainLooper())
      splashHandler?.postDelayed({
        hideSplashScreen()
      }, 3000) // 3000 milliseconds = 3 seconds
    }
  }

  private fun createSplashOverlay() {
    // Get the root view
    val rootView = window.decorView.rootView as? ViewGroup
    
    // Create ImageView with splash screen (now includes white background)
    splashOverlay = ImageView(this).apply {
      layoutParams = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
      scaleType = ImageView.ScaleType.CENTER_CROP
      // Use bootsplash.xml which has white background + splash image
      setImageResource(R.drawable.bootsplash)
      // Set white background color as fallback
      setBackgroundColor(0xFFFFFFFF.toInt()) // White background
    }
    
    // Add overlay to root view (on top of everything)
    rootView?.addView(splashOverlay)
  }

  private fun hideSplashScreen() {
    splashOverlay?.let {
      val rootView = window.decorView.rootView as? ViewGroup
      rootView?.removeView(it)
      splashOverlay = null
    }
  }

  override fun onDestroy() {
    super.onDestroy()
    // Clean up handler
    splashHandler?.removeCallbacksAndMessages(null)
    splashHandler = null
    // Remove splash overlay if still present
    splashOverlay?.let {
      val rootView = window.decorView.rootView as? ViewGroup
      rootView?.removeView(it)
    }
    splashOverlay = null
  }
}
