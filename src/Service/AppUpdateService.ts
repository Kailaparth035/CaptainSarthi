import remoteConfig from '@react-native-firebase/remote-config';
import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {isVersionLower} from '../utils/appVersion';
import {fetchLatestStoreVersion} from '../utils/storeVersion';

const REMOTE_CONFIG_KEYS = {
  forceUpdateEnabledAndroid: 'force_update_enabled_android',
  forceUpdateEnabledIos: 'force_update_enabled_ios',
  minVersionAndroid: 'min_version_android',
  minVersionIos: 'min_version_ios',
  skipForceUpdateAndroid: 'skip_force_update_android',
  skipForceUpdateIos: 'skip_force_update_ios',
} as const;

export const STORE_URLS = {
  android:
    'https://play.google.com/store/apps/details?id=com.captainsaathi.farmerapp',
  ios: 'https://apps.apple.com/in/app/captain-saathi/id6762212070',
} as const;

export type ForceUpdateResult = {
  required: boolean;
  storeUrl: string;
  currentVersion: string;
  minimumVersion: string;
  latestStoreVersion: string | null;
};

class AppUpdateService {
  private static initialized = false;

  private static async ensureRemoteConfigInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await remoteConfig().setDefaults({
      [REMOTE_CONFIG_KEYS.forceUpdateEnabledAndroid]: 'false',
      [REMOTE_CONFIG_KEYS.forceUpdateEnabledIos]: __DEV__ ? 'true' : 'false',
      [REMOTE_CONFIG_KEYS.minVersionAndroid]: '1.0.0',
      [REMOTE_CONFIG_KEYS.minVersionIos]: __DEV__ ? '1.2.4' : '1.0.0',
      [REMOTE_CONFIG_KEYS.skipForceUpdateAndroid]: 'false',
      [REMOTE_CONFIG_KEYS.skipForceUpdateIos]: 'false',
    });

    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: __DEV__ ? 0 : 60 * 60 * 1000,
    });

    this.initialized = true;
  }

  private static getRemoteConfigValue(key: string): string {
    try {
      return remoteConfig().getValue(key).asString().trim();
    } catch {
      return '';
    }
  }

  private static async getFirebaseMinimumVersion(): Promise<{
    enabled: boolean;
    minimumVersion: string;
    skipped: boolean;
  }> {
    const isAndroid = Platform.OS === 'android';
    const enabledKey = isAndroid
      ? REMOTE_CONFIG_KEYS.forceUpdateEnabledAndroid
      : REMOTE_CONFIG_KEYS.forceUpdateEnabledIos;
    const minVersionKey = isAndroid
      ? REMOTE_CONFIG_KEYS.minVersionAndroid
      : REMOTE_CONFIG_KEYS.minVersionIos;
    const skipKey = isAndroid
      ? REMOTE_CONFIG_KEYS.skipForceUpdateAndroid
      : REMOTE_CONFIG_KEYS.skipForceUpdateIos;

    try {
      await this.ensureRemoteConfigInitialized();
      await remoteConfig().fetchAndActivate();
    } catch (error) {
      console.warn('[AppUpdateService] Remote Config fetch failed:', error);
      return {enabled: false, minimumVersion: '', skipped: false};
    }

    return {
      enabled:
        this.getRemoteConfigValue(enabledKey).toLowerCase() === 'true',
      minimumVersion: this.getRemoteConfigValue(minVersionKey),
      skipped: this.getRemoteConfigValue(skipKey).toLowerCase() === 'true',
    };
  }

  private static resolveMinimumVersion(
    storeVersion: string | null,
    firebaseMinimumVersion: string,
    firebaseEnabled: boolean,
  ): string | null {
    let minimumVersion = storeVersion;

    if (firebaseEnabled && firebaseMinimumVersion) {
      if (
        !minimumVersion ||
        isVersionLower(minimumVersion, firebaseMinimumVersion)
      ) {
        minimumVersion = firebaseMinimumVersion;
      }
    }

    return minimumVersion;
  }

  static async checkForForceUpdate(): Promise<ForceUpdateResult> {
    const currentVersion = DeviceInfo.getVersion();
    const storeUrl =
      Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;

    const fallback: ForceUpdateResult = {
      required: false,
      storeUrl,
      currentVersion,
      minimumVersion: currentVersion,
      latestStoreVersion: null,
    };

    try {
      const [latestStoreVersion, firebaseConfig] = await Promise.all([
        fetchLatestStoreVersion(),
        this.getFirebaseMinimumVersion(),
      ]);

      console.log('[AppUpdateService] Version check:', {
        platform: Platform.OS,
        currentVersion,
        latestStoreVersion,
        firebaseEnabled: firebaseConfig.enabled,
        firebaseMinimumVersion: firebaseConfig.minimumVersion,
        firebaseSkipped: firebaseConfig.skipped,
      });

      if (firebaseConfig.skipped) {
        return fallback;
      }

      const minimumVersion = this.resolveMinimumVersion(
        latestStoreVersion,
        firebaseConfig.minimumVersion,
        firebaseConfig.enabled,
      );

      if (!minimumVersion) {
        console.warn(
          '[AppUpdateService] Could not determine store minimum version',
        );
        return fallback;
      }

      const required = isVersionLower(currentVersion, minimumVersion);

      console.log('[AppUpdateService] Update required:', required, {
        currentVersion,
        minimumVersion,
      });

      return {
        required,
        storeUrl,
        currentVersion,
        minimumVersion,
        latestStoreVersion,
      };
    } catch (error) {
      console.warn('[AppUpdateService] Force update check failed:', error);
      return fallback;
    }
  }
}

export default AppUpdateService;
