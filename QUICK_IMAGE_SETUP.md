# Quick Setup: Splash Screen + App Icon

## 🎯 Two Different Images Needed

### 1. Splash Screen Image
**Location**: `android/app/src/main/res/drawable/splash_screen.png`
- Square format (1:1 ratio)
- Recommended: 1080x1080px
- Shows when app launches

### 2. App Icon Image  
**Location**: `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Square format (1:1 ratio) 
- Recommended: 1024x1024px
- Shows on device home screen

## 📋 Quick Steps

### Step 1: Add Splash Screen Image
```bash
# Copy your splash screen image
cp /path/to/your/splash-image.png android/app/src/main/res/drawable/splash_screen.png
```

Then update `bootsplash.xml` line 13:
- Change: `android:src="@drawable/splash_screen_placeholder"`
- To: `android:src="@drawable/splash_screen"`

### Step 2: Add App Icon
```bash
# Copy your app icon to all mipmap folders
ICON_PATH="/path/to/your/app-icon.png"

cp "$ICON_PATH" android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp "$ICON_PATH" android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp "$ICON_PATH" android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp "$ICON_PATH" android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp "$ICON_PATH" android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

### Step 3: Rebuild
```bash
npm run clean:android
yarn run android
```

## ✅ Current Configuration

- **Splash Screen**: Uses `splash_screen_placeholder` (gray square) - ready for your image
- **App Icon**: Uses existing `ic_launcher.png` - ready to replace
- **Both Independent**: Splash screen and app icon are completely separate

## 📝 Files to Update

1. **Splash Screen**: 
   - Add: `android/app/src/main/res/drawable/splash_screen.png`
   - Update: `android/app/src/main/res/drawable/bootsplash.xml` (line 13)

2. **App Icon**:
   - Replace: `android/app/src/main/res/mipmap-*/ic_launcher.png` (all 5 folders)

That's it! Both images work independently.









