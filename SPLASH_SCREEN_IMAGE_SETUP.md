# Splash Screen Image Setup - Square Image

## How to Add Your Custom Square Image

### Step 1: Prepare Your Image
- **Format**: PNG (recommended) or JPG
- **Shape**: Square (1:1 aspect ratio)
- **Recommended Size**: 1080x1080px or higher
- **Name**: `splash_image.png`

### Step 2: Add Image to Android Resources

You need to add your image to multiple density folders for different screen sizes:

1. **Copy your image to these folders:**
   ```
   android/app/src/main/res/drawable-mdpi/splash_image.png     (108x108dp = ~108px)
   android/app/src/main/res/drawable-hdpi/splash_image.png     (108x108dp = ~162px)
   android/app/src/main/res/drawable-xhdpi/splash_image.png    (108x108dp = ~216px)
   android/app/src/main/res/drawable-xxhdpi/splash_image.png   (108x108dp = ~324px)
   android/app/src/main/res/drawable-xxxhdpi/splash_image.png  (108x108dp = ~432px)
   ```

2. **Or use a single image (simpler):**
   - Place your image in: `android/app/src/main/res/drawable/splash_image.png`
   - Android will scale it automatically (not ideal but works)

### Step 3: Image Sizes for Each Density

For best quality, create different sizes:

| Density | Folder | Size (Square) |
|---------|--------|---------------|
| mdpi    | drawable-mdpi | 108x108px |
| hdpi    | drawable-hdpi | 162x162px |
| xhdpi   | drawable-xhdpi | 216x216px |
| xxhdpi  | drawable-xxhdpi | 324x324px |
| xxxhdpi | drawable-xxxhdpi | 432x432px |

### Step 4: Quick Setup (Single Image)

**Easiest method - use one image:**

1. **Add your square image:**
   - Place your square image file in: `android/app/src/main/res/drawable/splash_image.png`
   - The image should be square (1:1 aspect ratio)
   - Recommended size: 1080x1080px or higher

2. **Update bootsplash.xml to use your image:**
   - Open: `android/app/src/main/res/drawable/bootsplash.xml`
   - Change `@drawable/splash_image_placeholder` to `@drawable/splash_image`

3. **Rebuild the app:**
   ```bash
   cd android && ./gradlew clean && cd ..
   yarn run android
   ```

### Step 5: Verify

After adding your image:
1. The splash screen will show your square image centered on a white background
2. The image will maintain its square aspect ratio
3. It will be centered on the screen

## Current Configuration

- **Background**: White (#FFFFFF)
- **Image**: Square, centered
- **Theme**: BootTheme (splash screen theme)
- **Image Name**: `splash_image.png` (or `.jpg`)

## Troubleshooting

**Image not showing?**
- Make sure the file is named exactly `splash_image.png` (or `.jpg`)
- Check that the file is in `android/app/src/main/res/drawable/` folder
- Clean and rebuild: `cd android && ./gradlew clean && cd .. && yarn run android`

**Image looks stretched?**
- Make sure your image is square (1:1 aspect ratio)
- Use PNG format for best quality

**Want to change background color?**
- Edit `android/app/src/main/res/drawable/bootsplash.xml`
- Change the color value in the `<color>` tag

## Example: Using Your Promotional Image

Based on your description, you can use the promotional image with:
- Two men shaking hands
- Red tractor in background
- "Captain Sathi" branding

Just make sure to:
1. Crop it to square format (1:1)
2. Save as `splash_image.png`
3. Place in `android/app/src/main/res/drawable/` folder

