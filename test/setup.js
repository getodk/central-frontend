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
import 'should';

import { MockLogger } from './util';
import { setHttp } from './http';
import '../lib/setup';

Vue.prototype.$logger = new MockLogger();

setHttp((...args) => {
  console.log('unhandled request', args); // eslint-disable-line no-console
  return Promise.reject(new Error());
});

afterEach(() => {
  // Remove a component attached to the document if there is one.
  $('body > script:last-of-type + *').remove()
});
