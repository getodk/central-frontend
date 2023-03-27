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
import { readonly, ref } from 'vue';

export default () => {
  const widening = ref(false);
  let timeoutId;
  const toggle = (value) => {
    const app = document.querySelector('#app');
    if (app == null) return;
    if (value)
      app.classList.add('full-width');
    else
      app.classList.remove('full-width');

    // TODO. Do something else for testing?
    if (process.env.NODE_ENV !== 'test') {
      widening.value = true;
      if (timeoutId != null) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => { widening.value = false; }, 550);
    }
  };
  return { toggle, widening: readonly(widening) };
};
