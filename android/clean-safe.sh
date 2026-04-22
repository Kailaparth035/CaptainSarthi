#!/bin/bash

echo "🧹 Safe Clean - Removing build artifacts without Gradle clean..."

# Stop Gradle daemon
./gradlew --stop 2>/dev/null || true

# Remove all build artifacts manually (safer than gradlew clean)
echo "Removing build directories..."
rm -rf .gradle
rm -rf app/.cxx
rm -rf app/build
rm -rf build
rm -rf .idea
rm -rf *.iml
rm -rf app/*.iml

echo ""
echo "✅ Build artifacts removed!"
echo ""
echo "If you need to clear Gradle cache, run:"
echo "  rm -rf ~/.gradle/caches/8.13/transforms"
echo ""
echo "Now you can build: ./gradlew assembleDebug"









