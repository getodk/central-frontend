/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';
import { mount } from 'avoriaz';

import App from '../lib/components/app.vue';
import routerFactory from '../lib/router';
import { resetSession } from '../lib/session';

export class MockLogger {
  log() {}
  error() {}
}

export function detachFromDocument(wrapper) {
  $(wrapper.element).remove();
}

export function mockRoute(location, mountOptions = {}) {
  const session = Vue.prototype.$session;
  /* If the user is logged in, mounting the app with the router will redirect
  the user to the forms list, resulting in an HTTP request. To prevent that, if
  the user is logged in, the user's session is temporarily reset. That way,
  mounting the app will first redirect the user to login, resulting in no
  initial HTTP request. */
  if (session.loggedIn()) resetSession();
  const router = routerFactory();
  const fullMountOptions = Object.assign({}, mountOptions, { router });
  const app = mount(App, fullMountOptions);
  if (session.loggedIn()) session.updateGlobals();
  router.push(location);
  return Vue.nextTick().then(() => app);
}
