/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { markRaw, readonly, shallowRef } from 'vue';

import { loadedAsync } from './async-components';

// Creates an object to manage the data to pass to a modal component as props.
// If the modal component is loaded async, specify the component's name.
export default (asyncComponent = undefined) => {
  const data = shallowRef({ state: false });
  const readonlyData = readonly(data);
  return markRaw({
    get data() { return readonlyData.value; },
    show: (newData = undefined) => {
      if (asyncComponent == null || loadedAsync(asyncComponent))
        data.value = { ...newData, state: true };
    },
    hide: () => { data.value = { state: false }; }
  });
};
