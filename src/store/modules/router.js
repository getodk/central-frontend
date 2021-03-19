/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
export default {
  state: {
    // We define this property because we need to access the current route
    // elsewhere in the store. An alternative might be to import the router and
    // use router.currentRoute. However, that is not possible, because the
    // router itself imports the store: we would have a circular dependency.
    // Instead, we have the router import the store, then save the current route
    // here as well.
    currentRoute: null,
    anyNavigationConfirmed: false,
    sendInitialRequests: true,
    unsavedChanges: false
  },
  mutations: {
    /* eslint-disable no-param-reassign */
    confirmNavigation(state, route) {
      state.currentRoute = route;
      state.anyNavigationConfirmed = true;
    },
    setSendInitialRequests(state, sendInitialRequests) {
      state.sendInitialRequests = sendInitialRequests;
    },
    setUnsavedChanges(state, unsavedChanges) {
      state.unsavedChanges = unsavedChanges;
    },
    resetRouterState(state) {
      state.currentRoute = null;
      state.anyNavigationConfirmed = false;
      state.sendInitialRequests = true;
      state.unsavedChanges = false;
    }
    /* eslint-enable no-param-reassign */
  }
};
