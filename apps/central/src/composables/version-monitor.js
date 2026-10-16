import { inject } from 'vue';

import useCallWait from './call-wait';
import useEventListener from './event-listener';
import { useRequestData } from '../request-data';

// useVersionMonitor() watches for indications that a new version of Central has
// been deployed. When it detects a likely version change, it either reloads the
// page automatically or prompts the user to do so.
export default () => {
  const { i18n, toast, location } = inject('container');
  const { centralVersion } = useRequestData();
  const { callWait } = useCallWait();

  // Continually request /version.txt, checking for a change.
  const checkVersion = async () => {
    const previousVersion = centralVersion.versionText;

    try {
      await centralVersion.request({
        url: '/version.txt',
        clear: false,
        alert: false
      });
    } catch (error) {
      // Keep sending requests unless the error was a 404 response. A 404
      // response is what's expected in local development.
      return error.response != null && error.response.status === 404;
    }

    // If there hasn't been a change, keep sending requests.
    if (previousVersion == null || centralVersion.versionText === previousVersion)
      return false;

    // Alert the user about the version change, then keep alerting them. One
    // benefit of this approach is that the user should see the toast even if
    // there is another toast (say, about session expiration).
    callWait(
      'versionChange',
      () => {
        toast.show(i18n.t('alert.versionChange'), { autoHide: false })
          .cta(i18n.t('action.refreshPage'), () => { location.reload(); });
      },
      (count) => (count === 0 ? 0 : 60000)
    );
    return true;
  };
  callWait('checkVersion', checkVersion, (tries) => (tries === 0 ? 15000 : 60000));

  // getodk/central#2073
  const start = Date.now();
  useEventListener(window, 'vite:preloadError', (event) => {
    // Don't reload right after app startup, as that can break e2e tests.
    if (Date.now() - start >= 30000) {
      event.preventDefault();
      location.reload();
    }
  });
};
