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

import { onMounted, ref } from 'vue';
import useEventListener from './event-listener';

export default function useFeatureFlags() {
  const features = ref({
    'new-web-forms': false
  });

  const cheatKeys = {
    w: false,
    f: false
  };

  function updateCheatKeys(event, isKeydownEvent) {
    if (event.key.toLowerCase() === 'w') {
      cheatKeys.w = isKeydownEvent;
    }
    if (event.key.toLowerCase() === 'f') {
      cheatKeys.f = isKeydownEvent;
    }

    if (cheatKeys.w && cheatKeys.f) {
      features.value['new-web-forms'] = true;
    } else {
      features.value['new-web-forms'] = false;
    }
  }

  function reset(event) {
    if (event.target.classList.contains('btn-web-form')) {
      cheatKeys.w = false;
      cheatKeys.f = false;
      features.value['new-web-forms'] = false;
    }
  }

  const keydownEventHandler = (e) => updateCheatKeys(e, true);
  const keyupEventHandler = (e) => updateCheatKeys(e, false);

  useEventListener(document, 'keydown', keydownEventHandler);
  useEventListener(document, 'keyup', keyupEventHandler);
  useEventListener(document, 'focusout', reset);

  onMounted(() => {
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log(
        '%c ODK Central Alpha Features: \n\n%c- Press and hold the %cW and F %ckeyboard keys on a screen with a form preview button to access the new %cWeb Forms%c preview.\n\n',
        'background-color: #009ecc; font-size: 18px; color: white',
        '',
        'font-weight: bold; font-size: 14px;',
        '',
        'font-weight: bold; font-size: 14px;',
        '',
      );
    }
  });

  return { features };
}
