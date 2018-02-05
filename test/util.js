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

export class MockLogger {
  log() {}
  error() {}
}

// TODO: Should we use a different router instance for each test?
export const mockRouteForRouter = (router) => (path) => {
  const app = mount(App, { router });
  router.push(path);
  return Vue.nextTick().then(() => ({ app, router }));
};
