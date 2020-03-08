/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';
import VueRouter from 'vue-router';

import routes from './routes';
import store from './store';
import { keys as requestKeys } from './store/modules/request/keys';
import { noop } from './util/util';
import { preservesData } from './util/router';

const router = new VueRouter({ routes });
export default router;



////////////////////////////////////////////////////////////////////////////////
// LOGIN

// nextByLoginStatus() implements the requireLogin and requireAnonymity meta
// fields. It navigates based on whether the user is logged in and whether the
// route being navigated to requires login, requires anonymity, or requires
// neither.
const nextByLoginStatus = (to, next) => {
  const { meta } = to.matched[to.matched.length - 1];
  if (meta.requireLogin) {
    if (store.getters.loggedIn) {
      next();
    } else {
      const query = { ...to.query, next: to.path };
      next({ path: '/login', query });
    }
  } else if (meta.requireAnonymity) { // eslint-disable-line no-lonely-if
    if (store.getters.loggedIn)
      next('/');
    else
      next();
  } else {
    next();
  }
};

// Implements the restoreSession meta field.
router.beforeEach((to, from, next) => {
  const isFirstNavigation = !store.state.router.navigations.first.triggered;
  if (isFirstNavigation) store.commit('triggerNavigation', 'first');
  store.commit('triggerNavigation', 'last');

  const { restoreSession } = to.matched[to.matched.length - 1].meta;
  // In production, the last condition is not strictly needed: if this is the
  // first navigation triggered, the user is necessarily logged out. However,
  // the condition is useful for testing, where the user might be logged in
  // before the first navigation is triggered.
  if (isFirstNavigation && restoreSession && store.getters.loggedOut) {
    Vue.prototype.$http.get('/v1/sessions/restore')
      .then(({ data }) => store.dispatch('get', [{
        key: 'currentUser',
        url: '/users/current',
        headers: { Authorization: `Bearer ${data.token}` },
        extended: true,
        success: () => {
          store.commit('setData', { key: 'session', value: data });
        }
      }]))
      .catch(noop)
      .finally(() => {
        nextByLoginStatus(to, next);
      });
  } else {
    nextByLoginStatus(to, next);
  }
});



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
  const result = window.confirm('Are you sure you want to leave this page? Your changes might not be saved.');
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

// Set router state.
router.afterEach(to => {
  store.commit('setCurrentRoute', to);
  if (!store.state.router.navigations.first.confirmed)
    store.commit('confirmNavigation', 'first');
  store.commit('confirmNavigation', 'last');
});

router.afterEach(() => {
  if (store.state.alert.state) store.commit('hideAlert');
});

router.afterEach(() => {
  if (store.state.modal.ref != null) store.dispatch('hideModal');
});

// Clear response data.
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
