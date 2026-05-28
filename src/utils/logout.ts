import FirebaseService from '../Service/FirebaseService';
import {SCREEN_NAMES} from '../constants/screenNames';
import {
  clearPendingNavigation,
  clearSession,
  getUserRole,
} from './session';

export type LogoutNavigation = {
  reset: (state: {
    index: number;
    routes: Array<{name: string}>;
  }) => void;
};

/**
 * Fast logout: clear local session and navigate immediately.
 * FCM unregister runs in the background (iPad/iOS token fetch can take 10+ seconds).
 */
export async function performLogout(
  navigation: LogoutNavigation,
  options?: {onModalClose?: () => void},
): Promise<void> {
  const role = await getUserRole();
  const cachedToken = FirebaseService.getCurrentToken();
  FirebaseService.unregisterFcmOnLogout(role, cachedToken);

  await Promise.all([
    clearSession(),
    clearPendingNavigation().catch(() => undefined),
  ]);

  options?.onModalClose?.();

  navigation.reset({
    index: 0,
    routes: [{name: SCREEN_NAMES.Login}],
  });
}
