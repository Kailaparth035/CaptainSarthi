package com.farmer;

/**
 * Compatibility shim for React Native generated entrypoint.
 * Keeps old package reference working after applicationId/package migration.
 */
public final class BuildConfig {
  private BuildConfig() {}

  public static final boolean IS_NEW_ARCHITECTURE_ENABLED =
      com.captainsaathi.farmerapp.BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
  public static final boolean IS_EDGE_TO_EDGE_ENABLED =
      com.captainsaathi.farmerapp.BuildConfig.IS_EDGE_TO_EDGE_ENABLED;
}
