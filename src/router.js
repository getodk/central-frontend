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

import i18n from './i18n';
import routes from './routes';
import store from './store';
import { keys as requestKeys } from './store/modules/request/keys';
import { noop } from './util/util';
import { preservesData } from './util/router';

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
// INITIAL REQUESTS

// eslint-disable-next-line no-unused-vars
const initialLocale = () => {
  try {
    const locale = localStorage.getItem('locale');
    if (locale != null) return locale;
  } catch (e) {}
  return navigator.language.split('-', 1)[0];
};

// Implements the restoreSession meta field.
const restoreSession = (to) => {
  if (!to.matched[to.matched.length - 1].meta.restoreSession)
    return Promise.resolve();
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
    // loadLocale(initialLocale()).catch(noop),
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
  const { meta } = to.matched[to.matched.length - 1];
  if (meta.requireLogin) {
    if (store.getters.loggedIn)
      next();
    else
      next({ path: '/login', query: { next: to.fullPath } });
  } else if (meta.requireAnonymity) { // eslint-disable-line no-lonely-if
    if (store.getters.loggedIn)
      next('/');
    else
      next();
  } else {
    next();
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
