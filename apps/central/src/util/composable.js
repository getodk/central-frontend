/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { inject } from 'vue';

/* Some composables don't use state and can return a static result. Other
composables have their own state that they manage. Still others only use state
stored in the container. In that last case, we usually don't need to return a
different result to each component. Instead, memoizeForContainer() can be used
to return the same result to each component that injects the same container. In
production, there is only ever one container. memoizeForContainer() will also
work in testing, where typically each test creates its own container. */
// eslint-disable-next-line import/prefer-default-export
export const memoizeForContainer = (composable) => {
  const map = new WeakMap();
  return () => {
    const container = inject('container');
    if (!map.has(container)) map.set(container, composable(container));
    return map.get(container);
  };
};
