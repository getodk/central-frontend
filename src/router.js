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
import Vue from 'vue';
import VueRouter from 'vue-router';
import { last } from 'ramda';

import i18n from './i18n';
import routes from './routes';
import store from './store';
import { canRoute, forceReplace, preservesData } from './util/router';
import { keys as requestKeys } from './store/modules/request/keys';
import { loadAsync } from './util/async-components';
import { loadLocale } from './util/i18n';
import { noop } from './util/util';

const router = new VueRouter({ routes });
export default router;



////////////////////////////////////////////////////////////////////////////////
// ROUTER STATE

// Set select properties of store.state.router.

router.beforeEach((to, from, next) => {
  store.commit('triggerNavigation');
  next();
});
router.afterEach(to => {
  store.commit('setCurrentRoute', to);
  store.commit('confirmNavigation');
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
  try {
    const locale = localStorage.getItem('locale');
    if (locale != null) return locale;
  } catch (e) {}
  return navigator.language.split('-', 1)[0];
};

// Implements the restoreSession meta field.
const restoreSession = (to) => {
  if (!last(to.matched).meta.restoreSession) return Promise.resolve();
  return Vue.prototype.$http.get('/v1/sessions/restore')
    .then(({ data }) => store.dispatch('get', [{
      key: 'currentUser',
      url: '/users/current',
      headers: { Authorization: `Bearer ${data.token}` },
      extended: true,
      success: () => {
        store.commit('setData', { key: 'session', value: data });
      }
    }]));
};

router.beforeEach((to, from, next) => {
  if (!store.state.router.sendInitialRequests) {
    next();
    return;
  }

  Promise.all([
    loadLocale(initialLocale()).catch(noop),
    restoreSession(to).catch(noop)
  ])
    .then(() => {
      store.commit('setSendInitialRequests', false);
      next();
    })
    .catch(noop);
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
      if (store.state.request.requests[key].last.state === 'loading')
        store.commit('cancelRequest', key);
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

    for (const [key, validator] of last(to.matched).meta.validateData) {
      unwatch.push(store.watch((state) => state.request.data[key], (value) => {
        if (value != null && !validator(value))
          forceReplace(router, store, '/');
      }));
    }
  });
}



////////////////////////////////////////////////////////////////////////////////
// UNSAVED CHANGES

window.addEventListener('beforeunload', (event) => {
  if (!store.state.router.unsavedChanges) return;
  event.preventDefault();
  // Needed for Chrome.
  event.returnValue = ''; // eslint-disable-line no-param-reassign
});

router.beforeEach((to, from, next) => {
  if (!store.state.router.unsavedChanges) {
    next();
    return;
  }

  // eslint-disable-next-line no-alert
  const result = window.confirm(i18n.t('router.unsavedChanges'));
  if (result)
    next();
  else
    next(false);
});

router.afterEach(() => {
  if (store.state.router.unsavedChanges)
    store.commit('setUnsavedChanges', false);
});



////////////////////////////////////////////////////////////////////////////////
// OTHER NAVIGATION GUARDS

router.afterEach(() => {
  if (store.state.alert.state) store.commit('hideAlert');
});

router.afterEach(() => {
  if (store.getters.modalShown) store.dispatch('hideModal');
});
