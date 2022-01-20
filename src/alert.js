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
import { readonly, shallowReactive } from 'vue';

// Only a single alert is shown at a time. This function returns an object that
// manages the data for the alert. Regardless of where an alert is rendered, its
// data will be stored in this object.
export default () => {
  const data = shallowReactive({
    // `true` if the alert should be visible and `false` if not.
    state: false,
    type: 'danger',
    message: null,
    at: new Date()
  });
  const set = (type) => (message) => {
    data.state = true;
    data.type = type;
    data.message = message;
    data.at = new Date();
  };
  const blank = () => {
    data.state = false;
    data.message = null;
  };
  const alert = { data: readonly(data), blank };
  for (const type of ['success', 'info', 'warning', 'danger'])
    alert[type] = set(type);
  return alert;
};
