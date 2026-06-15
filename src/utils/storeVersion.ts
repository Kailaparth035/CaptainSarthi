import {Platform} from 'react-native';

const ANDROID_PACKAGE = 'com.captainsaathi.farmerapp';
const IOS_APP_ID = '6762212070';
const IOS_COUNTRY = 'in';

const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}&hl=en&gl=in`;
const ITUNES_LOOKUP_URL = `https://itunes.apple.com/${IOS_COUNTRY}/lookup?id=${IOS_APP_ID}`;

function parseVersion(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return /^\d+(\.\d+){0,2}$/.test(trimmed) ? trimmed : null;
}

async function fetchAndroidStoreVersion(): Promise<string | null> {
  try {
    const response = await fetch(PLAY_STORE_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.warn(
        '[storeVersion] Play Store request failed:',
        response.status,
      );
      return null;
    }

    const html = await response.text();
    const patterns = [
      /\[\[\["([\d.]+)"\]\]/,
      /"([\d]+\.[\d]+\.[\d]+)"\]\]/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      const version = parseVersion(match?.[1]);
      if (version) {
        return version;
      }
    }

    return null;
  } catch (error) {
    console.warn('[storeVersion] Failed to fetch Android store version:', error);
    return null;
  }
}

async function fetchIosStoreVersion(): Promise<string | null> {
  try {
    const response = await fetch(ITUNES_LOOKUP_URL);
    if (!response.ok) {
      console.warn('[storeVersion] App Store request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const version = parseVersion(data?.results?.[0]?.version);
    return version;
  } catch (error) {
    console.warn('[storeVersion] Failed to fetch iOS store version:', error);
    return null;
  }
}

export async function fetchLatestStoreVersion(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    return fetchIosStoreVersion();
  }
  return fetchAndroidStoreVersion();
}
