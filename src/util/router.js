/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// These functions are defined here rather than in src/router.js in order to
// avoid dependency cycles.

/*
preservesData() returns `true` if the data for `key` should not be cleared when
the route changes from `from` to `to`. Otherwise it returns `false`.

  - key. A request key or '*'.
  - to. A Route object.
  - from. A Route object.
*/
export const preservesData = (key, to, from) => {
  // First navigation
  if (from.matched.length === 0) return true;
  const { preserveData } = to.matched[to.matched.length - 1].meta;
  if (preserveData[key] == null) return false;
  const fromName = from.matched[from.matched.length - 1].name;
  const params = preserveData[key][fromName];
  if (params == null) return false;
  for (const param of params) {
    if (to.params[param] !== from.params[param]) return false;
  }
  return true;
};

/*
canRoute() returns `false` if response data exists that violates a validateData
condition specified for the `to` route. Otherwise it returns `true`.

  - to. A Route object.
  - from. A Route object.
  - store. The Vuex store.
*/
export const canRoute = (to, from, store) => {
  const { validateData } = to.matched[to.matched.length - 1].meta;
  for (const [key, validator] of validateData) {
    // If the data for the request key will be cleared after the navigation is
    // confirmed, we do not need to validate it.
    if (preservesData('*', to, from) || preservesData(key, to, from)) {
      const value = store.state.request.data[key];
      if (value != null && !validator(value)) return false;
    }
  }
  return true;
};
