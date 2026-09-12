#!/bin/bash

echo "📸 Image Setup Script for Splash Screen and App Icon"
echo ""
echo "This script helps you set up:"
echo "  1. Splash Screen Image (splash_screen.png)"
echo "  2. App Icon (ic_launcher.png)"
echo ""
echo "⚠️  You need to manually copy your images to the correct locations."
echo ""
echo "SPLASH SCREEN:"
echo "  Copy your splash image to:"
echo "    android/app/src/main/res/drawable/splash_screen.png"
echo ""
echo "APP ICON:"
echo "  Copy your app icon to all these folders:"
echo "    android/app/src/main/res/mipmap-mdpi/ic_launcher.png"
echo "    android/app/src/main/res/mipmap-hdpi/ic_launcher.png"
echo "    android/app/src/main/res/mipmap-xhdpi/ic_launcher.png"
echo "    android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png"
echo "    android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"
echo ""
echo "After adding images, rebuild:"
echo "  npm run clean:android"
echo "  yarn run android"
echo ""









