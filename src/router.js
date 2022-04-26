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
import { last } from 'ramda';

import createRoutes from './routes';
import { canRoute, forceReplace, preservesData, updateDocumentTitle } from './util/router';
import { keys as requestKeys } from './store/modules/request/keys';
import { loadAsync } from './util/load-async';
import { loadLocale } from './util/i18n';
import { localStore } from './util/storage';
import { logIn, restoreSession } from './util/session';
import { noop } from './util/util';

export default (container, mode = 'hash') => {
  const router = new VueRouter({ mode, routes: createRoutes(container) });



/* eslint-disable indent */ // TODO/vue3
////////////////////////////////////////////////////////////////////////////////
// ROUTER STATE

// Set select properties of store.state.router.
const { store, unsavedChanges } = container;
router.afterEach(to => {
  store.commit('confirmNavigation', to);
});



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
components in parallel, we use a navigation guard to kick-start the load of all
async components associated with the route. */
router.afterEach(to => {
  for (const routeRecord of to.matched) {
    const { asyncRoute } = routeRecord.meta;
    // AsyncRoute will handle any error.
    if (asyncRoute != null) loadAsync(asyncRoute.componentName)().catch(noop);
  }
});



////////////////////////////////////////////////////////////////////////////////
// INITIAL REQUESTS

const initialLocale = () => {
  const locale = localStore.getItem('locale');
  return locale != null ? locale : navigator.language.split('-', 1)[0];
};

// Implements the restoreSession meta field.
const restoreSessionForRoute = async (to) => {
  if (last(to.matched).meta.restoreSession) {
    await restoreSession(store);
    await logIn(container, false);
  }
};

router.beforeEach((to, from, next) => {
  if (!store.state.router.sendInitialRequests) {
    next();
    return;
  }

  Promise.allSettled([loadLocale(initialLocale()), restoreSessionForRoute(to)])
    .then(() => {
      store.commit('setSendInitialRequests', false);
      next();
    });
});



////////////////////////////////////////////////////////////////////////////////
// LOGIN

// Implements the requireLogin and requireAnonymity meta fields.
router.beforeEach((to, from, next) => {
  const { meta } = last(to.matched);
  const { session } = store.state.request.data;
  if (meta.requireLogin) {
    if (session != null)
      next();
    else
      next({ path: '/login', query: { next: to.fullPath } });
  } else if (meta.requireAnonymity) { // eslint-disable-line no-lonely-if
    if (session != null)
      next('/');
    else
      next();
  } else {
    next();
  }
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

router.beforeEach((to, from, next) => {
  if (canRoute(to, from, store))
    next();
  else
    next('/');
});

/*
Set up watchers on the response data, and update them whenever the validateData
or title.key meta field changes.

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

    const { meta } = last(to.matched);
    for (const [key, validator] of meta.validateData) {
      unwatch.push(store.watch((state) => state.request.data[key], (value) => {
        if (value != null && !validator(value)) forceReplace(container, '/');
      }));
    }

    if (meta.title.key != null) {
      const { key } = meta.title;
      unwatch.push(store.watch((state) => state.request.data[key], () => {
        updateDocumentTitle(to, store);
      }));
    }
  });

  // TODO/vue3. Remove this once there is a factory for the store.
  const { init } = router;
  router.init = (app) => {
    app.$once('hook:beforeDestroy', () => {
      for (const f of unwatch)
        f();
    });
    return init.call(router, app);
  };
}



////////////////////////////////////////////////////////////////////////////////
// UNSAVED CHANGES

window.addEventListener('beforeunload', (event) => {
  if (unsavedChanges.count === 0) return;
  event.preventDefault();
  // Needed for Chrome.
  event.returnValue = ''; // eslint-disable-line no-param-reassign
});

router.beforeEach((to, from, next) => {
  if (unsavedChanges.confirm())
    next();
  else
    next(false);
});

router.afterEach(() => {
  unsavedChanges.zero();
});



////////////////////////////////////////////////////////////////////////////////
// OTHER NAVIGATION GUARDS

router.afterEach(() => {
  if (store.state.alert.state) store.commit('hideAlert');
});



////////////////////////////////////////////////////////////////////////////////
// PAGE TITLES

router.afterEach((to) => {
  updateDocumentTitle(to, store);
});



  //////////////////////////////////////////////////////////////////////////////
  // RETURN

  return router;
};
