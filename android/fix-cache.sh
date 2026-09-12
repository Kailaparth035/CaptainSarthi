#!/bin/bash

echo "🔧 Fixing Gradle cache corruption..."

# Stop Gradle daemon
echo "1. Stopping Gradle daemon..."
./gradlew --stop 2>/dev/null || true

# Remove local build artifacts FIRST (before clean tries to access them)
echo "2. Removing local build artifacts..."
rm -rf .gradle
rm -rf app/.cxx
rm -rf app/build
rm -rf build

# Remove corrupted React Native transforms cache
echo "3. Removing corrupted React Native cache..."
rm -rf ~/.gradle/caches/8.13/transforms/a469fcdf8d09732ec288312ef7b5994a 2>/dev/null || true

# Remove all transforms cache (more thorough)
echo "4. Clearing transforms cache..."
rm -rf ~/.gradle/caches/8.13/transforms 2>/dev/null || true

# Clear Gradle daemon
echo "5. Clearing Gradle daemon..."
rm -rf ~/.gradle/daemon 2>/dev/null || true

# Clear prefab cache
echo "6. Clearing prefab cache..."
rm -rf ~/.gradle/caches/8.13/transforms-* 2>/dev/null || true

echo ""
echo "✅ Cache cleared! Now you can run: ./gradlew clean"

