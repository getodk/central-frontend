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
    navigations: {
      first: {
        triggered: false,
        /* Suppose that during a navigation, a navigation guard uses
        next(location) to redirect the user to a different location, and that
        that redirect navigation is confirmed. According to the standard Vue
        router terminology, the first navigation is considered aborted, not
        confirmed, even though it ultimately resulted in a confirmed navigation.
        For the `confirmed` property, we mean "confirmed" in a looser sense: if
        a navigation ultimately resulted in a confirmed navigation, the
        `confirmed` property is `true` even if a navigation was aborted along
        the way. */
        confirmed: false
      },
      last: {
        triggered: false,
        // `false` could mean that no navigation has ever been triggered, that the
        // latest navigation is in progress, or that the latest navigation was
        // ultimately aborted.
        confirmed: false
      }
    },
    // Indicates whether the router should load the locale file before the next
    // navigation.
    loadLocale: true,
    unsavedChanges: false
  },
  mutations: {
    /* eslint-disable no-param-reassign */
    setCurrentRoute(state, route) {
      state.currentRoute = route;
    },
    triggerNavigation({ navigations }, key) {
      navigations[key].triggered = true;
      navigations[key].confirmed = false;
    },
    confirmNavigation({ navigations }, key) {
      navigations[key].confirmed = true;
    },
    resetRouterState(state) {
      state.currentRoute = null;
      const { navigations } = state;
      navigations.first.triggered = false;
      navigations.first.confirmed = false;
      navigations.last.triggered = false;
      navigations.last.confirmed = false;
      state.loadLocale = true;
      state.unsavedChanges = false;
    },
    setLoadLocale(state, loadLocale) {
      state.loadLocale = loadLocale;
    },
    setUnsavedChanges(state, unsavedChanges) {
      state.unsavedChanges = unsavedChanges;
    }
    /* eslint-enable no-param-reassign */
  }
};
