/*
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// useEventListener() adds an event listener to an event target when the
// component is mounted, then automatically removes the listener when the
// component is unmounted. In general, Vue event handlers should be preferred
// over useEventListener() whenever possible. However, useEventListener() can be
// useful for event targets like document.body or window.

import { onBeforeUnmount, onMounted } from 'vue';

export default (target, type, callback, capture = false) => {
  onMounted(() => {
    target.addEventListener(type, callback, capture);
  });
  onBeforeUnmount(() => {
    target.removeEventListener(type, callback, capture);
  });
};
