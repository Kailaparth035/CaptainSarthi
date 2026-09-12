import VersionCheck from 'react-native-version-check';
import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';

const ANDROID_PACKAGE = 'com.captainsaathi.farmerapp';
const IOS_APP_ID = '6762212070';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.captainsaathi.farmerapp';

const APP_STORE_URL =
  'https://apps.apple.com/in/app/captain-saathi/id6762212070';

export type AppUpdateCheckResult =
  | {
      showModal: true;
      latestVersion: string;
      currentVersion: string;
      storeUrl: string;
    }
  | {
      showModal: false;
    };

function isUpdateNeeded(currentVersion: string, latestVersion: string): boolean {
  const normalize = (version: string) =>
    version
      .trim()
      .split('.')
      .map(part => parseInt(part.replace(/[^0-9].*$/, ''), 10) || 0);

  const currentParts = normalize(currentVersion);
  const latestParts = normalize(latestVersion);
  const length = Math.max(currentParts.length, latestParts.length);

  for (let i = 0; i < length; i += 1) {
    const currentPart = currentParts[i] ?? 0;
    const latestPart = latestParts[i] ?? 0;

    if (latestPart > currentPart) {
      return true;
    }
    if (latestPart < currentPart) {
      return false;
    }
  }

  return false;
}

async function fetchPlayStoreVersionFallback(): Promise<string | null> {
  try {
    const response = await fetch(
      `${PLAY_STORE_URL}&hl=en&gl=in`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const patterns = [
      /\[\[\["([\d.]+)"\]\]/,
      /Current Version.+?>([\d.-]+)<\/span>/,
      /"([\d]+\.[\d]+\.[\d]+)"\]\]/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return null;
  } catch (error) {
    console.warn('[checkAppUpdate] Play Store fallback failed:', error);
    return null;
  }
}

async function fetchAppStoreVersionFallback(): Promise<string | null> {
  try {
    const response = await fetch(
      `https://itunes.apple.com/in/lookup?id=${IOS_APP_ID}`,
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.results?.[0]?.version?.trim() || null;
  } catch (error) {
    console.warn('[checkAppUpdate] App Store fallback failed:', error);
    return null;
  }
}

async function getLatestStoreVersion(): Promise<string | null> {
  let latestVersion: string | undefined;

  try {
    latestVersion = await VersionCheck.getLatestVersion({
      provider: Platform.OS === 'ios' ? 'appStore' : 'playStore',
      packageName: ANDROID_PACKAGE,
      appID: IOS_APP_ID,
      country: 'in',
      ignoreErrors: true,
    });
  } catch (error) {
    console.warn('[checkAppUpdate] VersionCheck.getLatestVersion failed:', error);
  }

  if (latestVersion) {
    return latestVersion;
  }

  return Platform.OS === 'android'
    ? fetchPlayStoreVersionFallback()
    : fetchAppStoreVersionFallback();
}

export const checkAppUpdate = async (): Promise<AppUpdateCheckResult> => {
  try {
    const currentVersion = DeviceInfo.getVersion();
    const latestVersion = await getLatestStoreVersion();

    console.log('[checkAppUpdate] Versions:', {
      platform: Platform.OS,
      currentVersion,
      latestVersion,
    });

    if (!latestVersion) {
      return {showModal: false};
    }

    const updateNeeded = isUpdateNeeded(currentVersion, latestVersion);

    console.log('[checkAppUpdate] Update needed:', updateNeeded);

    if (updateNeeded) {
      return {
        showModal: true,
        latestVersion,
        currentVersion,
        storeUrl: Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL,
      };
    }

    return {showModal: false};
  } catch (error) {
    console.log('Version Check Error', error);
    return {showModal: false};
  }
};
