import { inject } from 'vue';

import useEventListener from './event-listener';

// useVersionMonitor() watches for indications that a new version of Central has
// been deployed. When it detects a likely version change, it either reloads the
// page automatically or prompts the user to do so.
export default () => {
  const location = inject('location');

  // getodk/central#2073
  useEventListener(window, 'vite:preloadError', () => { location.reload(); });
};
