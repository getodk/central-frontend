/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import VueRouter from 'vue-router';
import { nextTick } from '@vue/composition-api';

// Returns the props for a route component.
export const routeProps = (route, props) => {
  if (props == null || props === false) return {};
  if (props === true) return route.params;
  if (typeof props === 'function') return props(route);
  // Object mode
  return props;
};

/*
afterNextNavigation() provides a way to run a callback after a navigation has
been confirmed but before the next DOM update. That is mostly only needed when
response data will be updated as part of the navigation.

Because navigation is asynchronous, if response data is updated before the
navigation is confirmed, the current route component or other processes may use
the updated data. In some cases, that can lead to unexpected behavior. For
example, if the updated data violates a validateData condition, the user may be
sent to / instead.

Because router.push() and router.replace() will return a promise that resolves
after the navigation is confirmed, another approach could be to update the
response data in a then() callback. The DOM will be updated after the navigation
is confirmed: usually that will involve the old route component being unmounted
and the new route component being mounted. However, any then() callback will be
run after the DOM is updated. That means that if the response data is updated in
a then() callback, the new route component could use outdated data when it is
first set up and mounted.

afterNextNavigation() can provide an answer to some of these subtle timing
issues, allowing the response data to be updated after the navigation has been
confirmed, but before the DOM has been updated.
*/
export const afterNextNavigation = (router, callback) => {
  const removeHook = router.afterEach((to, from) => {
    callback(to, from);
    // It looks like we can't remove an afterEach hook while Vue Router is
    // iterating over the afterEach hooks: if we synchronously removed this
    // hook, the next afterEach hook for the navigation would be skipped.
    // (Though this is probably the last hook.)
    nextTick(removeHook);
  });
};

export const forceReplace = ({ router, unsavedChanges }, location) => {
  unsavedChanges.zero();
  return router.replace(location);
};



////////////////////////////////////////////////////////////////////////////////
// RESPONSE DATA

/*
preservesData() returns `true` if the data for `key` should not be cleared when
the route changes from `from` to `to`. Otherwise it returns `false`.

  - key. A request key or '*'.
  - to. A Route object.
  - from. A Route object.
*/
export const preservesData = (key, to, from) => {
  if (from === VueRouter.START_LOCATION) return true;
  const forKey = to.meta.preserveData[key];
  if (forKey == null) return false;
  const params = forKey[from.name];
  if (params == null) return false;
  return params.every(param => to.params[param] === from.params[param]);
};

/*
canRoute() returns `false` if response data exists that violates a validateData
condition specified for the `to` route. Otherwise it returns `true`.

  - to. A Route object.
  - from. A Route object.
  - store. The Vuex store.
*/
export const canRoute = (to, from, store) => {
  for (const [key, validator] of to.meta.validateData) {
    // If the data for the request key will be cleared after the navigation is
    // confirmed, we do not need to validate it.
    if (preservesData('*', to, from) || preservesData(key, to, from)) {
      const value = store.state.request.data[key];
      if (value != null && !validator(value)) return false;
    }
  }
  return true;
};
