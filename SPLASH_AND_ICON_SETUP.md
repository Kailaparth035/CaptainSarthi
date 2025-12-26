# Splash Screen and App Icon Setup Guide

## Overview
You need **TWO different images**:
1. **Splash Screen Image** - Shows when app launches (square format)
2. **App Icon** - Shows on device home screen/app drawer (square format, will be made round by Android)

## Step 1: Prepare Your Images

### Splash Screen Image
- **Name**: `splash_screen.png`
- **Format**: PNG (with transparency if needed)
- **Shape**: Square (1:1 aspect ratio)
- **Recommended Size**: 1080x1080px or higher
- **Location**: `android/app/src/main/res/drawable/splash_screen.png`

### App Icon Image
- **Name**: `ic_launcher.png` (and `ic_launcher_round.png` for round version)
- **Format**: PNG
- **Shape**: Square (1:1 aspect ratio) - Android will make it round automatically
- **Recommended Size**: 1024x1024px (for all densities)
- **Location**: Multiple mipmap folders (see Step 2)

## Step 2: Add Splash Screen Image

### Quick Method (Single Image):
```bash
# Place your splash screen image here:
cp /path/to/your/splash-image.png android/app/src/main/res/drawable/splash_screen.png
```

### Best Quality Method (Multiple Densities):
For best quality, add different sizes to density folders:

| Density | Folder | Size (Square) |
|---------|--------|---------------|
| mdpi    | drawable-mdpi | 108x108px |
| hdpi    | drawable-hdpi | 162x162px |
| xhdpi   | drawable-xhdpi | 216x216px |
| xxhdpi  | drawable-xxhdpi | 324x324px |
| xxxhdpi | drawable-xxxhdpi | 432x432px |

**Or use single image** (simpler):
- Place `splash_screen.png` in `android/app/src/main/res/drawable/`
- Android will scale it automatically

## Step 3: Add App Icon Images

### Replace App Icons in All Density Folders:

You need to replace the app icon in these folders:
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`

### App Icon Sizes for Each Density:

| Density | Folder | Size (Square) |
|---------|--------|---------------|
| mdpi    | mipmap-mdpi | 48x48px |
| hdpi    | mipmap-hdpi | 72x72px |
| xhdpi   | mipmap-xhdpi | 96x96px |
| xxhdpi  | mipmap-xxhdpi | 144x144px |
| xxxhdpi | mipmap-xxxhdpi | 192x192px |

### Quick Method (Single Size):
```bash
# Replace all icons with one image (Android will scale)
# Copy your icon to each mipmap folder:
cp /path/to/your/app-icon.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp /path/to/your/app-icon.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp /path/to/your/app-icon.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp /path/to/your/app-icon.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp /path/to/your/app-icon.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

**Note**: You can also create `ic_launcher_round.png` versions for round icons (optional).

## Step 4: Update bootsplash.xml (If Needed)

The splash screen is already configured to use `splash_screen.png`. Just make sure:
- File exists: `android/app/src/main/res/drawable/splash_screen.png`
- Or update `bootsplash.xml` if you want a different filename

## Step 5: Rebuild the App

After adding both images:

```bash
# Clean and rebuild
npm run clean:android
yarn run android
```

## Current Configuration

### Splash Screen:
- **File**: `android/app/src/main/res/drawable/splash_screen.png`
- **Reference**: `bootsplash.xml` → `@drawable/splash_screen`
- **Theme**: `BootTheme` (currently not active, but ready)

### App Icon:
- **Files**: `android/app/src/main/res/mipmap-*/ic_launcher.png`
- **Reference**: `AndroidManifest.xml` → `@mipmap/ic_launcher`
- **Shows**: On device home screen, app drawer, settings

## Summary

1. **Splash Screen Image** → `android/app/src/main/res/drawable/splash_screen.png`
2. **App Icon Image** → `android/app/src/main/res/mipmap-*/ic_launcher.png` (all folders)

Both images are **completely independent** - you can use different images for each!

## Example Workflow

```bash
# 1. Add splash screen image
cp ~/Downloads/my-splash.png android/app/src/main/res/drawable/splash_screen.png

# 2. Add app icon to all mipmap folders
cp ~/Downloads/my-icon.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp ~/Downloads/my-icon.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp ~/Downloads/my-icon.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp ~/Downloads/my-icon.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp ~/Downloads/my-icon.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# 3. Rebuild
npm run clean:android
yarn run android
```









