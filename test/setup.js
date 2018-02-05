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

import { MockLogger, detachFromDocument, mockRoute } from './util';
import { setHttp } from './http';
import '../lib/setup';

Vue.prototype.$logger = new MockLogger();

setHttp(() => Promise.reject(new Error('automatically failing request')));

// The first time a component is attached to the document, 404 errors are
// returned for /assets/fonts/icomoon.ttf and icomoon.woff. I am not sure yet
// why that is, but we attach a component here so that the errors are shown
// before the first tests, not in the middle of the tests.
mockRoute('/login', { attachToDocument: true })
  .then(detachFromDocument)
  .catch(e => console.log(e)); // eslint-disable-line no-console
