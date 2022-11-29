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
import { START_LOCATION } from 'vue-router';
import { T } from 'ramda';
import { nextTick } from 'vue';

export const arrayQuery = (query, options = {}) => {
  if (!Array.isArray(query)) return arrayQuery([query], options);
  const set = new Set();
  const { validator = T } = options;
  for (const value of query) {
    if (value != null && !set.has(value) && validator(value)) set.add(value);
  }
  if (set.size !== 0) return [...set];
  const def = options.default;
  return def != null ? (typeof def === 'function' ? def() : def) : [];
};

// Returns the props for a route component.
export const routeProps = (route, props) => {
  if (props == null || props === false) return {};
  if (props === true) return route.params;
  if (typeof props === 'function') return props(route);
  // Object mode
  return props;
};

// TODO/vue3. Add tests.
export const unlessFailure = (callback) => (to, from, failure) => {
  if (failure == null) callback(to, from);
};

/*
afterNextNavigation() provides a way to run a callback after a navigation has
been confirmed but before the next DOM update. That is mostly only needed when
requestData will be updated as part of the navigation.

Because navigation is asynchronous, if requestData is updated before the
navigation is confirmed, the current route component or other processes may use
the updated data. In some cases, that can lead to unexpected behavior. For
example, if the updated data violates a validateData condition, the user may be
sent to / instead.

Because router.push() and router.replace() will return a promise that resolves
after the navigation is confirmed, another approach could be to update
requestData in a then() callback. The DOM will be updated after the navigation
is confirmed: usually that will involve the old route component being unmounted
and the new route component being mounted. However, any then() callback will be
run after the DOM is updated. That means that if the requestData is updated in a
then() callback, the new route component could use outdated data when it is
first set up and mounted.

afterNextNavigation() can provide an answer to some of these subtle timing
issues, allowing requestData to be updated after the navigation has been
confirmed, but before the DOM has been updated.
*/
export const afterNextNavigation = (router, callback) => {
  const removeHook = router.afterEach((to, from, failure) => {
    if (failure == null) callback(to, from);
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
// requestData

// Returns the resources that would be preserved after navigating from the
// `from` route to the `to` route.
export const preservedData = (to, from, requestData) => {
  if (from === START_LOCATION) return requestData.resources;
  const results = [];
  for (const f of to.meta.preserveData) {
    const result = f(to, from);
    if (result === true) return requestData.resources;
    if (result !== false) results.push(result);
  }
  const preserved = new Set();
  for (const result of results) {
    for (const resource of result)
      preserved.add(resource);
  }
  return preserved;
};

// canRoute() returns `false` if a requestData resource exists that violates a
// validateData condition specified for the `to` route. Otherwise it returns
// `true`.
export const canRoute = (to, from, requestData) => {
  const preserved = preservedData(to, from, requestData);
  return to.meta.validateData.every(([resource, validator]) =>
    !(preserved.has(resource) && resource.dataExists && !validator()));
};
