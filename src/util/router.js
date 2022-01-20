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

// Returns the props for a route component.
export const routeProps = (route, props) => {
  if (props == null || props === false) return {};
  if (props === true) return route.params;
  if (typeof props === 'function') return props(route);
  // Object mode
  return props;
};

export const forceReplace = ({ router, unsavedChanges }, location) => {
  unsavedChanges.count = 0; // eslint-disable-line no-param-reassign
  return router.replace(location);
};



////////////////////////////////////////////////////////////////////////////////
// requestData

// preservesData() returns `true` if the data for the specified resource should
// be preserved (not cleared) when the route is changed from `from` to `to`.
// Otherwise it returns `false`. To test whether all data should be preserved,
// specify '*' instead of a resource.
export const preservesData = (resourceOrStar, to, from) => {
  if (from === START_LOCATION) return true;
  const fs = to.meta.preserveData.get(resourceOrStar);
  return fs != null && fs.some(preserves => preserves(to, from));
};

// canRoute() returns `false` if data exists that violates a validateData
// condition specified for the `to` route. Otherwise it returns `true`.
export const canRoute = (to, from) =>
  to.meta.validateData.every(([resource, validator]) =>
    resource.data == null ||
    // If the data will be cleared after the navigation is confirmed, we do not
    // need to validate it.
    !(preservesData('*', to, from) || preservesData(resource, to, from)) ||
    validator(resource.data));
