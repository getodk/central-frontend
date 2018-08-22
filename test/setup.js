import Vue from 'vue';
import 'should';

// Importing lib/setup.js first, because other import statements below may
// import some of the same modules as lib/setup.js, and in some cases, the order
// in which lib/setup.js imports modules matters.
import '../lib/setup';
import App from '../lib/components/app.vue';
import testData from './data';
import { ComponentAlert, closestComponentWithAlert } from '../lib/alert';
import { MockComponentAlert } from './alert';
import { MockLogger } from './util';
import { clearNavGuards, initNavGuards } from './router';
import { destroyMarkedComponent, mountAndMark } from './destroy';
import { logOut } from '../lib/session';
import { router } from '../lib/router';
import { setHttp } from './http';
import './assertions';

Vue.prototype.$alert = function $alert() {
  const component = closestComponentWithAlert(this);
  return component != null
    ? new ComponentAlert(component)
    : new MockComponentAlert();
};
Vue.prototype.$logger = new MockLogger();

// Set up the router for testing.
// Inject the router into a Vue instance so that tests can assume that the
// router has been injected into at least one Vue instance.
setHttp(() => Promise.reject(new Error()));
mountAndMark(App, { router });
destroyMarkedComponent();
initNavGuards();
afterEach(clearNavGuards);

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
