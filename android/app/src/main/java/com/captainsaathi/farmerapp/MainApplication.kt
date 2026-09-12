package com.captainsaathi.farmerapp

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ClipData
import android.content.ContentValues
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.view.View
import android.view.ViewGroup
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.uimanager.ViewManager
import java.io.ByteArrayOutputStream
import org.json.JSONArray
import org.json.JSONTokener

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(CertificatePdfPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    createNotificationChannel()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channelId = "default"
      val channelName = "Default Notifications"
      val channelDescription = "Default notification channel for push notifications"
      val importance = NotificationManager.IMPORTANCE_HIGH
      val channel = NotificationChannel(channelId, channelName, importance).apply {
        description = channelDescription
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 250, 250, 250)
      }

      val notificationManager = getSystemService(NotificationManager::class.java)
      notificationManager.createNotificationChannel(channel)
    }
  }
}

/**
 * Writes the exact rendered certificate HTML to the device Downloads folder.
 * Android's MediaStore owns the file, so no broad storage permission or print
 * dialog is required on supported Android versions.
 */
private class CertificatePdfModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private var printWebView: WebView? = null

  override fun getName(): String = "CertificatePdf"

  /**
   * The certificate preview is HTML rendered by WebView. React Native's local
   * asset URL is not readable by that WebView, so expose both logos as data
   * URIs. The same assets are also inserted in the printable HTML below.
   */
  @ReactMethod
  fun getBrandAssets(promise: Promise) {
    try {
      val captainLogo = drawableDataUri("certificate_captain_tractors_logo")
      val saathiLogo = drawableDataUri("certificate_captain_saathi_logo")
      if (captainLogo.isBlank() || saathiLogo.isBlank()) {
        throw IllegalStateException("Certificate logo assets are unavailable.")
      }

      promise.resolve(
        Arguments.createMap().apply {
          putString("captainLogoUri", captainLogo)
          putString("saathiLogoUri", saathiLogo)
        },
      )
    } catch (error: Exception) {
      promise.reject("CERTIFICATE_ASSETS_FAILED", "Could not load certificate logos.", error)
    }
  }

  /** Opens a successfully saved MediaStore certificate in an installed PDF viewer. */
  @ReactMethod
  fun openCertificate(uriText: String, promise: Promise) {
    launchCertificateIntent(uriText, false, promise)
  }

  /** Opens Android's share sheet for a successfully saved MediaStore certificate. */
  @ReactMethod
  fun shareCertificate(uriText: String, promise: Promise) {
    launchCertificateIntent(uriText, true, promise)
  }

  private fun launchCertificateIntent(uriText: String, share: Boolean, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Certificate action is not available right now.")
      return
    }

    activity.runOnUiThread {
      try {
        val certificateUri = Uri.parse(uriText)
        if (certificateUri.scheme != "content") {
          throw IllegalArgumentException("Certificate download URI is invalid.")
        }

        val intent =
          if (share) {
            Intent(Intent.ACTION_SEND).apply {
              type = "application/pdf"
              putExtra(Intent.EXTRA_STREAM, certificateUri)
              clipData = ClipData.newRawUri("Captain Saathi certificate", certificateUri)
            }
          } else {
            Intent(Intent.ACTION_VIEW).apply {
              setDataAndType(certificateUri, "application/pdf")
              clipData = ClipData.newRawUri("Captain Saathi certificate", certificateUri)
            }
          }

        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        val chooserTitle = if (share) "Share certificate" else "Open certificate"
        activity.startActivity(Intent.createChooser(intent, chooserTitle))
        promise.resolve(null)
      } catch (error: Exception) {
        val action = if (share) "share" else "open"
        promise.reject(
          "CERTIFICATE_ACTION_FAILED",
          "Could not $action the certificate PDF.",
          error,
        )
      }
    }
  }

  @ReactMethod
  fun save(html: String, fileName: String, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
      promise.reject(
        "PDF_DOWNLOAD_UNSUPPORTED",
        "Certificate download requires Android 10 or later.",
      )
      return
    }

    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "Certificate download is not available right now.")
      return
    }

    activity.runOnUiThread {
      try {
        disposePrintWebView()
        val rootView = activity.findViewById<ViewGroup>(android.R.id.content)
          ?: throw IllegalStateException("Certificate print view could not be attached.")
        val webView = WebView(activity).apply {
          setBackgroundColor(android.graphics.Color.WHITE)
          // The generated HTML is fully escaped. JavaScript is enabled only to
          // confirm that remote farmer photos and embedded logo images have
          // finished loading before the Android print adapter is created.
          settings.javaScriptEnabled = true
          settings.domStorageEnabled = false
          settings.loadWithOverviewMode = true
          settings.useWideViewPort = true
          settings.loadsImagesAutomatically = true
          settings.blockNetworkImage = false
          settings.blockNetworkLoads = false
          layoutParams = FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
          )
          // The WebView must be attached to render reliably, but it is added
          // behind the React view below so the dealer never sees a temporary
          // certificate preview while the PDF is being created.
          isVerticalScrollBarEnabled = false
          isHorizontalScrollBarEnabled = false
        }
        printWebView = webView
        rootView.addView(webView, 0)

        var generationStarted = false
        webView.webViewClient = object : WebViewClient() {
          private var downloadFailed = false

          private fun failDownload(code: String, message: String, error: Throwable? = null) {
            if (downloadFailed) {
              return
            }

            downloadFailed = true
            disposePrintWebView()
            if (error == null) {
              promise.reject(code, message)
            } else {
              promise.reject(code, message, error)
            }
          }

          private fun createPdf(view: WebView) {
            view.postVisualStateCallback(1L, object : WebView.VisualStateCallback() {
              override fun onComplete(requestId: Long) {
                try {
                  writePdfToDownloads(view, fileName, promise)
                } catch (error: Exception) {
                  failDownload("PDF_WRITE_FAILED", "Could not save the certificate PDF.", error)
                }
              }
            })
          }

          private fun waitForImagesThenPrint(view: WebView, attemptsRemaining: Int) {
            view.evaluateJavascript(
              """(function () {
                    var images = Array.prototype.slice.call(document.images || []);
                    return images.every(function (image) {
                      return image.complete && image.naturalWidth > 0;
                    });
                  })();""".trimIndent(),
            ) { result ->
              val allImagesLoaded = result == "true"
              if (!allImagesLoaded && attemptsRemaining > 0) {
                view.postDelayed(
                  { waitForImagesThenPrint(view, attemptsRemaining - 1) },
                  250L,
                )
              } else {
                // A visual-state callback after the image wait ensures
                // MediaStore receives the fully painted certificate.
                createPdf(view)
              }
            }
          }

          override fun onPageFinished(view: WebView, url: String) {
            if (generationStarted || downloadFailed) {
              return
            }
            generationStarted = true

            view.postDelayed({
              // Allow the document itself to lay out before checking image
              // readiness. The retry window is ten seconds for slow networks.
              waitForImagesThenPrint(view, 40)
            }, 250L)
          }

          override fun onRenderProcessGone(
            view: WebView,
            detail: RenderProcessGoneDetail,
          ): Boolean {
            // Returning true is essential: it stops an isolated Android
            // WebView renderer failure from terminating the dealer app.
            failDownload(
              "PDF_WEBVIEW_UNAVAILABLE",
              "The device WebView stopped while preparing the certificate PDF. Please try again.",
            )
            return true
          }
        }
        val printHtml = html
          .replace("__CAPTAIN_TRACTORS_LOGO__", drawableDataUri("certificate_captain_tractors_logo"))
          .replace("__CAPTAIN_SAATHI_LOGO__", drawableDataUri("certificate_captain_saathi_logo"))
        webView.loadDataWithBaseURL(
          "file:///android_asset/",
          printHtml,
          "text/html",
          "UTF-8",
          null,
        )
      } catch (error: Exception) {
        disposePrintWebView()
        promise.reject("PDF_PREPARATION_FAILED", "Could not prepare the certificate PDF.", error)
      }
    }
  }

  /**
   * Renders every A4 certificate page from the fully painted WebView and
   * writes it to Android's MediaStore Downloads collection. This does not use
   * the system print UI, so tapping Download always saves the PDF directly.
   */
  private fun writePdfToDownloads(webView: WebView, fileName: String, promise: Promise) {
    fun readPageMetrics(onResult: (JSONArray) -> Unit) {
      webView.evaluateJavascript(
      """(function () {
            return JSON.stringify(
              Array.prototype.slice.call(document.querySelectorAll('.page')).map(function (page) {
                var rect = page.getBoundingClientRect();
                return {
                  top: rect.top + window.scrollY,
                  width: rect.width,
                  height: rect.height
                };
              })
            );
          })();""".trimIndent(),
      ) { rawPages ->
        try {
          val pageArray = JSONArray(JSONTokener(rawPages).nextValue().toString())
          if (pageArray.length() == 0) {
            throw IllegalStateException("Certificate pages could not be rendered.")
          }
          onResult(pageArray)
        } catch (error: Exception) {
          disposePrintWebView()
          promise.reject("PDF_RENDER_FAILED", "Could not render the certificate PDF.", error)
        }
      }
    }

    readPageMetrics { initialPages ->
      val firstPage = initialPages.getJSONObject(0)
      val pageWidth = firstPage.getDouble("width").toInt().coerceAtLeast(1)
      val documentHeight =
        (0 until initialPages.length())
          .maxOf { index ->
            val page = initialPages.getJSONObject(index)
            page.getDouble("top") + page.getDouble("height")
          }
          .toInt()
          .coerceAtLeast(1)

      // Drawing a screen-sized WebView clips the bottom of A4 content. Lay it
      // out to the full document dimensions before capturing every page.
      webView.layoutParams = FrameLayout.LayoutParams(pageWidth, documentHeight)
      webView.measure(
        View.MeasureSpec.makeMeasureSpec(pageWidth, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(documentHeight, View.MeasureSpec.EXACTLY),
      )
      webView.layout(0, 0, pageWidth, documentHeight)

      webView.post {
        webView.postVisualStateCallback(2L, object : WebView.VisualStateCallback() {
          override fun onComplete(requestId: Long) {
            // Re-read metrics after the full-height layout so each PDF page
            // exactly matches the final rendered certificate.
            readPageMetrics { renderedPages ->
              saveRenderedPagesToDownloads(webView, renderedPages, fileName, promise)
            }
          }
        })
      }
    }
  }

  private fun saveRenderedPagesToDownloads(
    webView: WebView,
    pageArray: JSONArray,
    fileName: String,
    promise: Promise,
  ) {
    val safeFileName =
      if (fileName.endsWith(".pdf", ignoreCase = true)) fileName else "$fileName.pdf"
    val contentValues =
      ContentValues().apply {
        put(MediaStore.Downloads.DISPLAY_NAME, safeFileName)
        put(MediaStore.Downloads.MIME_TYPE, "application/pdf")
        put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        put(MediaStore.Downloads.IS_PENDING, 1)
      }
    val resolver = reactApplicationContext.contentResolver
    val destinationUri =
      resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
        ?: throw IllegalStateException("Could not create the certificate download.")
    val pdf = PdfDocument()

    try {
      val pdfWidth = 595
      val pdfHeight = 842
      for (index in 0 until pageArray.length()) {
        val pageInfo = pageArray.getJSONObject(index)
        val sourceTop = pageInfo.getDouble("top").toFloat()
        val sourceWidth = pageInfo.getDouble("width").toFloat()
        val sourceHeight = pageInfo.getDouble("height").toFloat()
        if (sourceWidth <= 0f || sourceHeight <= 0f) {
          throw IllegalStateException("Certificate page size is invalid.")
        }

        val page =
          pdf.startPage(
            PdfDocument.PageInfo.Builder(pdfWidth, pdfHeight, index + 1).create(),
          )
        val canvas = page.canvas
        canvas.drawColor(Color.WHITE)
        canvas.save()
        canvas.scale(pdfWidth / sourceWidth, pdfHeight / sourceHeight)
        canvas.translate(0f, -sourceTop)
        webView.draw(canvas)
        canvas.restore()
        pdf.finishPage(page)
      }

      resolver.openOutputStream(destinationUri, "w")?.use { output ->
        pdf.writeTo(output)
      } ?: throw IllegalStateException("Could not open the certificate download.")

      resolver.update(
        destinationUri,
        ContentValues().apply {
          put(MediaStore.Downloads.IS_PENDING, 0)
        },
        null,
        null,
      )
      promise.resolve(destinationUri.toString())
    } catch (error: Exception) {
      runCatching { resolver.delete(destinationUri, null, null) }
      promise.reject("PDF_WRITE_FAILED", "Could not save the certificate PDF.", error)
    } finally {
      pdf.close()
      disposePrintWebView()
    }
  }

  private fun disposePrintWebView() {
    printWebView?.let { webView ->
      (webView.parent as? ViewGroup)?.removeView(webView)
      webView.destroy()
    }
    printWebView = null
  }

  private fun drawableDataUri(resourceName: String): String {
    val resources = reactApplicationContext.resources
    val resourceId =
      resources.getIdentifier(
        resourceName,
        "drawable",
        reactApplicationContext.packageName,
      )
    if (resourceId == 0) {
      return ""
    }

    val bitmap = BitmapFactory.decodeResource(
      resources,
      resourceId,
      BitmapFactory.Options().apply { inScaled = false },
    ) ?: return ""
    return try {
      val bytes = ByteArrayOutputStream()
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes)
      "data:image/png;base64,${Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP)}"
    } finally {
      // The same logo is rendered in preview and PDF generation. Releasing
      // the decoded bitmap immediately avoids a large native-memory spike on
      // lower-memory dealer devices during certificate download.
      bitmap.recycle()
    }
  }
}

private class CertificatePdfPackage : ReactPackage {
  override fun createNativeModules(
    reactContext: ReactApplicationContext,
  ): List<NativeModule> = listOf(CertificatePdfModule(reactContext))

  override fun createViewManagers(
    reactContext: ReactApplicationContext,
  ): List<ViewManager<*, *>> = emptyList()
}
