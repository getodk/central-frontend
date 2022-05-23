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
import VueRouter from 'vue-router';
import { watchEffect } from 'vue';

import createRoutes from './routes';
import { canRoute, forceReplace, preservesData } from './util/router';
import { keys as requestKeys } from './store/modules/request/keys';
import { loadAsync } from './util/load-async';
import { loadLocale } from './util/i18n';
import { localStore } from './util/storage';
import { logIn, restoreSession } from './util/session';
import { noop } from './util/util';

export default (container, mode = 'hash') => {
  const router = new VueRouter({ mode, routes: createRoutes(container) });
  const { store, alert, unsavedChanges } = container;



/* eslint-disable indent */ // TODO/vue3
////////////////////////////////////////////////////////////////////////////////
// LAZY LOADING

/* After it is created, an AsyncRoute component will load the async component
whose name is passed to it. However, if a lazy-loaded route is nested within
another lazy-loaded route, this means that the child AsyncRoute component won't
start loading its async component until after the parent AsyncRoute component
has finished loading its async component. (More specifically, only once the
parent AsyncRoute component finishes loading its async component will that async
component render the <router-view> that will create the child AsyncRoute
component, which will start loading its async component.) In order to load async
components in parallel, we use a navigation hook to kick-start the load of all
async components associated with the route. */
router.afterEach(to => {
  for (const routeRecord of to.matched) {
    const { asyncRoute } = routeRecord.meta;
    // AsyncRoute will handle any error.
    if (asyncRoute != null) loadAsync(asyncRoute.componentName)().catch(noop);
  }
});



  //////////////////////////////////////////////////////////////////////////////
  // INITIAL REQUESTS

  // During the initial navigation, the router sends requests for essential data
  // that is needed to render the app.

  {
    const requests = [
      () => {
        const storageLocale = localStore.getItem('locale');
        const locale = storageLocale != null
          ? storageLocale
          : navigator.language.split('-', 1)[0];
        return loadLocale(container, locale);
      },

      // Implements the restoreSession meta field. A test can skip this request
      // by setting the session before the initial navigation.
      async (to) => {
        if (to.meta.restoreSession &&
          store.state.request.data.session == null) {
          await restoreSession(store);
          await logIn(container, false);
        }
      }
    ];

    const removeGuard = router.beforeEach(async (to) => {
      await Promise.allSettled(requests.map(request => request(to)));
      removeGuard();
    });
  }



////////////////////////////////////////////////////////////////////////////////
// LOGIN

// Implements the requireLogin and requireAnonymity meta fields.
router.beforeEach(to => {
  const { session } = store.state.request.data;
  if (to.meta.requireLogin && session == null)
    return { path: '/login', query: { next: to.fullPath } };
  if (to.meta.requireAnonymity && session != null)
    return '/';
  return true;
});



////////////////////////////////////////////////////////////////////////////////
// RESPONSE DATA

// Implements the preserveData meta field.
router.afterEach((to, from) => {
  if (preservesData('*', to, from)) return;
  for (const key of requestKeys) {
    if (!preservesData(key, to, from)) {
      if (store.state.request.data[key] != null) store.commit('clearData', key);
      if (store.getters.loading(key)) store.commit('cancelRequest', key);
    }
  }
});

// validateData

router.beforeEach((to, from) => (canRoute(to, from, store) ? true : '/'));

/*
Set up watchers on the response data, and update them whenever the validateData
meta field changes.

If a component sets up its own watchers on the response data, they should be run
after the router's watchers. (That might not be the case if the component
instance is reused after a route change, but that shouldn't happen given our use
of the `key` attribute.)
*/
{
  const unwatch = [];
  router.afterEach(to => {
    while (unwatch.length !== 0)
      unwatch.pop()();

    for (const [key, validator] of to.meta.validateData) {
      unwatch.push(store.watch((state) => state.request.data[key], (value) => {
        if (value != null && !validator(value)) {
          // We are about to navigate to /. That alone should clear any data for
          // which there is a validateData condition. However, navigation is
          // asynchronous, and we need to make sure that the invalid data is not
          // used before the navigation is confirmed, for example, to update the
          // DOM. Given that, we clear the data immediately.
          store.commit('clearData', key);
          forceReplace(container, '/');
        }
      }));
    }
  });
}

{
  // `title` meta field
  // TODO/vue3. Simplify this.
  const removeHook = router.afterEach(() => {
    watchEffect(() => {
      const { title } = router.currentRoute.value.meta;
      const parts = title(store.state.request.data);
      // Append ODK Central to every title, filter out any null values (e.g.
      // project name before the project object was loaded), join with
      // separator.
      document.title = parts.concat('ODK Central').filter(x => x).join(' | ');
    });
    removeHook();
  });
}



////////////////////////////////////////////////////////////////////////////////
// UNSAVED CHANGES

window.addEventListener('beforeunload', (event) => {
  if (unsavedChanges.count === 0) return;
  event.preventDefault();
  // Needed for Chrome.
  event.returnValue = ''; // eslint-disable-line no-param-reassign
});

router.beforeEach(() => unsavedChanges.confirm());

router.afterEach(() => {
  unsavedChanges.zero();
});



////////////////////////////////////////////////////////////////////////////////
// OTHER NAVIGATION HOOKS

router.afterEach(() => {
  alert.blank();
});



  //////////////////////////////////////////////////////////////////////////////
  // RETURN

  return router;
};
