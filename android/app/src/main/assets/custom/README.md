# Gilroy Font Setup

## Font Files Required

Place the following font files in this directory (`src/assets/fonts/`):

- `Gilroy-Regular.ttf`
- `Gilroy-Medium.ttf`
- `Gilroy-SemiBold.ttf`
- `Gilroy-Bold.ttf`

## Download Fonts

You can download Gilroy fonts from:
- [Google Fonts](https://fonts.google.com/specimen/Gilroy) (if available)
- [Font Squirrel](https://www.fontsquirrel.com/fonts/gilroy)
- Or purchase from the official source

## After Adding Font Files

1. **Link the fonts** (already configured in `react-native.config.js`):
   ```bash
   npx react-native-asset
   ```

2. **Clear Metro cache and restart**:
   ```bash
   yarn start --reset-cache
   ```

3. **Rebuild the app**:
   - iOS: Clean build folder in Xcode and rebuild
   - Android: `cd android && ./gradlew clean && cd ..` then rebuild

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

