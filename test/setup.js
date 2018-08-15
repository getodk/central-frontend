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
