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
import { START_LOCATION, createRouter, createWebHashHistory } from 'vue-router';
import { watchEffect } from 'vue';

import createRoutes from './routes';
import { canRoute, forceReplace, preservedData, unlessFailure } from './util/router';
import { loadAsync } from './util/load-async';
import { loadLocale } from './util/i18n';
import { localStore } from './util/storage';
import { logIn, restoreSession } from './util/session';
import { noop } from './util/util';
import { setDocumentTitle } from './util/reactivity';

export default (container, history = createWebHashHistory()) => {
  const router = createRouter({ history, routes: createRoutes(container) });
  const { requestData, alert, unsavedChanges } = container;



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
router.afterEach(unlessFailure(to => {
  for (const routeRecord of to.matched) {
    const { asyncRoute } = routeRecord.meta;
    // AsyncRoute will handle any error.
    if (asyncRoute != null) loadAsync(asyncRoute.componentName)().catch(noop);
  }
}));



  //////////////////////////////////////////////////////////////////////////////
  // INITIAL REQUESTS

  // During the initial navigation, the router sends requests for essential data
  // that is needed to render the app.

  const { session } = requestData;
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
        if (to.meta.restoreSession && !session.dataExists) {
          await restoreSession(session);
          await logIn(container, false);
        }
      }
    ];

    const removeGuard = router.beforeEach(async (to) => {
      await Promise.allSettled(requests.map(request => request(to)));
      removeGuard();
    });
  }



  //////////////////////////////////////////////////////////////////////////////
  // LOGIN

  // Implements the requireLogin and requireAnonymity meta fields.
  router.beforeEach(to => {
    if (to.meta.requireLogin && !session.dataExists)
      return { path: '/login', query: { next: to.fullPath } };
    if (to.meta.requireAnonymity && session.dataExists)
      return '/';
    return true;
  });



  //////////////////////////////////////////////////////////////////////////////
  // requestData

  // Implements the preserveData meta field.
  router.afterEach(unlessFailure((to, from) => {
    const preserved = preservedData(to, from, requestData);
    if (preserved.size === requestData.resources.size) return;
    for (const resource of requestData.resources) {
      if (!preserved.has(resource)) resource.reset();
    }
  }));

  // validateData

  router.beforeEach((to, from) =>
    (canRoute(to, from, requestData) ? true : '/'));

/*
Set up watchers on requestData, and update them whenever the validateData meta
field changes.

If a component sets up its own watchers on requestData, they should be run after
the router's watchers. (That might not be the case if the component instance is
reused after a route change, but that shouldn't happen given our use of the
`key` option of asyncRoute().)
*/
{
  const stop = [];
  router.afterEach(unlessFailure(to => {
    while (stop.length !== 0)
      stop.pop()();

    for (const [resource, validator] of to.meta.validateData) {
      stop.push(watchEffect(() => {
        if (resource.dataExists && !validator()) {
          // TODO/requestData. Update these comments.
          // We are about to navigate to /. That alone should clear any data for
          // which there is a validateData condition. However, navigation is
          // asynchronous, and we need to make sure that the invalid data is not
          // used before the navigation is confirmed, for example, to update the
          // DOM. Given that, we clear the data immediately.
          resource.data = null;
          forceReplace(container, '/');
        }
      }));
    }
  }));
}

  // `title` meta field
  setDocumentTitle(() => {
    // router.currentRoute.value === START_LOCATION when the router is first
    // created, as well as when the app instance is unmounted (in testing).
    if (router.currentRoute.value === START_LOCATION) return [];
    const { title } = router.currentRoute.value.meta;
    return title != null ? title() : [];
  });



////////////////////////////////////////////////////////////////////////////////
// UNSAVED CHANGES

window.addEventListener('beforeunload', (event) => {
  if (unsavedChanges.count === 0) return;
  event.preventDefault();
  // Needed for Chrome.
  event.returnValue = ''; // eslint-disable-line no-param-reassign
});

router.beforeEach(() => unsavedChanges.confirm());

router.afterEach(unlessFailure(() => {
  unsavedChanges.zero();
}));



////////////////////////////////////////////////////////////////////////////////
// OTHER NAVIGATION HOOKS

router.afterEach(unlessFailure(() => {
  alert.blank();
}));



  //////////////////////////////////////////////////////////////////////////////
  // RETURN

  return router;
};
