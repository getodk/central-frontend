import { inject } from 'vue';

import useEventListener from './event-listener';

// useVersionMonitor() watches for indications that a new version of Central has
// been deployed. When it detects a likely version change, it either reloads the
// page automatically or prompts the user to do so.
export default () => {
  const location = inject('location');

  // getodk/central#2073
  const start = Date.now();
  useEventListener(window, 'vite:preloadError', () => {
    // Don't reload right after app startup, as that can break e2e tests.
    if (Date.now() - start >= 30000) location.reload();
  });
};
