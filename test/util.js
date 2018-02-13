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

import App from '../lib/components/app.vue';
import mockHttp from './http';
import routerFactory from '../lib/router';
import { resetSession } from '../lib/session';

export class MockLogger {
  log() {}
  error() {}
}

export const mockRoute = (location, mountOptions = {}) => {
  const session = Vue.prototype.$session;
  /* If the user is logged in, mounting the app with the router will redirect
  the user to the forms list, resulting in an HTTP request. To prevent that, if
  the user is logged in, the user's session is temporarily reset. That way,
  mounting the app will first redirect the user to login, resulting in no
  initial HTTP request. */
  if (session.loggedIn()) resetSession();
  const fullMountOptions = Object.assign({}, mountOptions);
  fullMountOptions.router = routerFactory();
  return mockHttp()
    .mount(App, fullMountOptions)
    .request(app => {
      if (session.loggedIn()) session.updateGlobals();
      app.vm.$router.push(location);
    });
};

export const trigger = (eventName, wrapper, bubbles = false) => {
  if (!bubbles) {
    // trigger() triggers an event that does not bubble.
    wrapper.trigger(eventName);
  } else {
    $(wrapper.element).trigger(eventName);
  }
  return Vue.nextTick();
};

export const fillForm = (wrapper, selectorsAndValues) => {
  let promise = Promise.resolve();
  for (const [selector, value] of selectorsAndValues) {
    promise = promise.then(() => {
      const field = wrapper.first(selector);
      field.element.value = value;
      // If there is a v-model attribute, prompt it to sync.
      return trigger('input', field);
    });
  }
  return promise;
};
