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
import { createRouter, createWebHashHistory } from 'vue-router';
import { watch } from 'vue';

import createRoutes from './routes';
import { canRoute, forceReplace, preservesData } from './util/router';
import { loadAsync } from './util/async-components';
import { loadLocale } from './util/i18n';
import { localStore } from './util/storage';
import { logIn, restoreSession } from './util/session';
import { noop } from './util/util';

export default (container, history = createWebHashHistory()) => {
  const { requestData, alert, unsavedChanges } = container;
  const router = createRouter({ history, routes: createRoutes(container) });



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

{
  const requests = [
    () => {
      const storageLocale = localStore.getItem('locale');
      const locale = storageLocale != null
        ? storageLocale
        : navigator.language.split('-', 1)[0];
      return loadLocale(locale);
    },

    // Implements the restoreSession meta field.
    async (to) => {
      // A test can skip this request by setting requestData.session.
      if (to.meta.restoreSession && requestData.session.data == null) {
        await restoreSession(requestData);
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
  if (to.meta.requireLogin) {
    return requestData.session.data != null
      ? true
      : { path: '/login', query: { next: to.fullPath } };
  }
  if (to.meta.requireAnonymity)
    return requestData.session.data != null ? '/' : true;
  return true;
});



////////////////////////////////////////////////////////////////////////////////
// requestData

// Implements the preserveData meta field.
router.afterEach((to, from) => {
  if (preservesData('*', to, from)) return;
  for (const resource of requestData.resources) {
    if (!preservesData(resource, to, from)) {
      resource.clear();
      resource.abortRequest();
    }
  }
});

// validateData

router.beforeEach((to, from) => (canRoute(to, from) ? true : '/'));

/*
Set up watchers on requestData, and update them whenever the validateData meta
field changes.

If a component sets up its own watchers on requestData, they should be run after
the router's watchers. (That might not be the case if the component instance is
reused after a route change, but that shouldn't happen given our use of the
`key` attribute.)
*/
{
  const stop = [];
  router.afterEach(to => {
    while (stop.length !== 0)
      stop.pop()();

    for (const [resource, validator] of to.meta.validateData) {
      stop.push(watch(resource.ref, (value) => {
        if (value != null && !validator(value))
          forceReplace(container, '/');
      }));
    }
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
  unsavedChanges.count = 0;
});



////////////////////////////////////////////////////////////////////////////////
// OTHER NAVIGATION GUARDS

router.afterEach(() => {
  if (alert.data.state) alert.blank();
});



  //////////////////////////////////////////////////////////////////////////////
  // PAGE TITLES

  router.isReady().then(() => {
    watch(
      () => router.currentRoute.value.meta.title(),
      (parts) => {
        // Append ODK Central to every title, filter out any null values (e.g.
        // project name before the project object was loaded), join with
        // separator.
        document.title = parts.concat('ODK Central').filter(x => x).join(' | ');
      }
    );
  });



  //////////////////////////////////////////////////////////////////////////////
  // RETURN

  return router;
};
