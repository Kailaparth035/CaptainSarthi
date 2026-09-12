declare module 'react-native-version-check' {
  type NeedUpdateOptions = {
    currentVersion?: string;
    latestVersion?: string;
    depth?: number;
    forceUpdate?: boolean;
    provider?: string | (() => Promise<string>);
    packageName?: string;
    appID?: string;
    country?: string;
    ignoreErrors?: boolean;
  };

  type NeedUpdateResult = {
    isNeeded: boolean;
    currentVersion: string;
    latestVersion: string;
    storeUrl: string;
  };

  const VersionCheck: {
    getCurrentVersion(): string;
    getLatestVersion(options?: NeedUpdateOptions): Promise<string>;
    needUpdate(options?: NeedUpdateOptions): Promise<NeedUpdateResult | null>;
    getStoreUrl(options?: NeedUpdateOptions): Promise<string>;
    getPlayStoreUrl(options?: {packageName?: string}): Promise<string>;
    getAppStoreUrl(options?: {appID?: string; country?: string}): Promise<string>;
  };

  export default VersionCheck;
}
