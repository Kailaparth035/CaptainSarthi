// Central font family names. Ensure the font files are placed in src/assets/fonts
// and correctly named (e.g., Gilroy-Regular.ttf, Gilroy-Bold.ttf).
// After adding fonts, run: yarn start --reset-cache
// On iOS, also rebuild the app after adding new fonts.

export const FontFamilies = {
  Gilroy: {
    Regular: 'Gilroy-Regular',
    Medium: 'Gilroy-Medium',
    SemiBold: 'Gilroy-SemiBold',
    Bold: 'Gilroy-Bold',
  },
};

export type FontFamilyName = keyof typeof FontFamilies;


