# Fix Gradle Cache Corruption - IMMEDIATE FIX

## ⚠️ CRITICAL: Run These Commands Now

The Gradle cache is corrupted. **Copy and paste these commands into your terminal:**

```bash
# 1. Navigate to android directory
cd /Users/abcom/Documents/CaptainSathi/android

# 2. Stop Gradle daemon
./gradlew --stop

# 3. Remove local build artifacts
rm -rf .gradle app/.cxx app/build build

# 4. Remove corrupted React Native cache (THIS IS THE KEY FIX)
rm -rf ~/.gradle/caches/8.13/transforms/a469fcdf8d09732ec288312ef7b5994a

# 5. Remove entire transforms cache
rm -rf ~/.gradle/caches/8.13/transforms

# 6. Now try clean
./gradlew clean
```

## Or Use the Fix Script

```bash
cd /Users/abcom/Documents/CaptainSathi/android
./fix-cache.sh
./gradlew clean
```

## Or Use NPM Script

```bash
npm run clean:android:full
```

## If Still Not Working - Nuclear Option

```bash
cd /Users/abcom/Documents/CaptainSathi/android

# Stop everything
./gradlew --stop

# Delete ALL Gradle 8.13 cache
rm -rf ~/.gradle/caches/8.13

# Delete local artifacts
rm -rf .gradle app/.cxx app/build build

# Clean
./gradlew clean
```

**The corrupted cache path is:**
`~/.gradle/caches/8.13/transforms/a469fcdf8d09732ec288312ef7b5994a`

**You MUST delete this directory manually** - the clean script can't access it due to permissions.









