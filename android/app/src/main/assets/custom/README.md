# Gilroy Font Setup

## Font Files Required

Place the following font files in this directory (`src/assets/fonts/`):

- `Gilroy-Regular.ttf`
- `Gilroy-Medium.ttf`
- `Gilroy-SemiBold.ttf`
- `Gilroy-Bold.ttf`

**Important**: Font file names must match exactly (case-sensitive):
- `Gilroy-Regular.ttf` (not `gilroy-regular.ttf` or `Gilroy-Regular.TTF`)
- `Gilroy-Medium.ttf`
- `Gilroy-SemiBold.ttf`
- `Gilroy-Bold.ttf`

## Download Fonts

You can download Gilroy fonts from:
- [Google Fonts](https://fonts.google.com/specimen/Gilroy) (if available)
- [Font Squirrel](https://www.fontsquirrel.com/fonts/gilroy)
- Or purchase from the official source

## Font Linking Steps

### Step 1: Add Font Files
Place the font files (`.ttf`) in `src/assets/fonts/` directory.

### Step 2: Link Fonts
Run the font linking command:
```bash
npm run link-assets
# or
npx react-native-asset
```

This will:
- Copy fonts to `android/app/src/main/assets/fonts/`
- Copy fonts to `ios/Farmer/` directory
- Update `ios/Farmer/Info.plist` with font entries (already configured)

### Step 3: Clear Metro Cache
```bash
npm start -- --reset-cache
# or
yarn start --reset-cache
```

### Step 4: Rebuild the App

**For Android:**
```bash
cd android && ./gradlew clean && cd ..
npm run android
# or
yarn android
```

**For iOS:**
1. Open Xcode: `open ios/Farmer.xcworkspace`
2. Clean build folder: `Product` → `Clean Build Folder` (Shift + Cmd + K)
3. Rebuild: `Product` → `Build` (Cmd + B)
4. Or run from terminal: `npm run ios` or `yarn ios`

## Verification

After rebuilding, fonts should work on both platforms. If fonts don't appear:

1. **Android**: Check that fonts are in `android/app/src/main/assets/fonts/`
2. **iOS**: Check that fonts are in `ios/Farmer/` and listed in `Info.plist` under `UIAppFonts`
3. Verify font file names match exactly (case-sensitive)
4. Clear cache and rebuild again

## Usage

The fonts are now available throughout the app via the Typography utility:

```typescript
import {Typography} from '../utils/typography';

// In your styles:
const styles = StyleSheet.create({
  title: {
    ...Typography.boldXxxl,  // Bold, 24px
  },
  body: {
    ...Typography.regularMd,  // Regular, 14px
  },
  subtitle: {
    ...Typography.semiBoldLg, // SemiBold, 16px
  },
});
```

## Available Typography Styles

- **Regular**: `regular`, `regularXs`, `regularSm`, `regularMd`, `regularLg`, `regularXl`
- **Medium**: `medium`, `mediumXs`, `mediumSm`, `mediumMd`, `mediumLg`, `mediumXl`
- **SemiBold**: `semiBold`, `semiBoldXs`, `semiBoldSm`, `semiBoldMd`, `semiBoldLg`, `semiBoldXl`, `semiBoldXxl`, `semiBoldXxxl`
- **Bold**: `bold`, `boldXs`, `boldSm`, `boldMd`, `boldLg`, `boldXl`, `boldXxl`, `boldXxxl`, `boldTitle`, `boldHeading`

