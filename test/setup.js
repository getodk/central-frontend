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
import 'should';

import testData from './data';
import { ComponentAlert, closestComponentWithAlert } from '../lib/alert';
import { MockComponentAlert } from './alert';
import { MockLogger } from './util';
import { destroyMarkedComponent } from './destroy';
import { logOut } from '../lib/session';
import { setHttp } from './http';
import '../lib/setup';
import './assertions';

Vue.prototype.$alert = function $alert() {
  const component = closestComponentWithAlert(this);
  return component != null
    ? new ComponentAlert(component)
    : new MockComponentAlert();
};
Vue.prototype.$logger = new MockLogger();

setHttp(config => {
  console.log('unhandled request', config); // eslint-disable-line no-console
  return Promise.reject(new Error());
});

afterEach(() => {
  destroyMarkedComponent();

  const afterScript = $('body > script:last-of-type + *');
  if (afterScript.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`Unexpected element: ${afterScript[0].outerHTML}`);
    throw new Error('Unexpected element after last script element. Have all components and Bootstrap elements been destroyed?');
  }
});

// Reset global application state.
afterEach(() => {
  if (Vue.prototype.$session.loggedIn()) logOut();
});

afterEach(testData.reset);
