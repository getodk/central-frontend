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

// Set up the router for testing.
// Set to a page that will not send a request.
window.location.hash = '#/test/setup';
// Inject the router into a Vue instance so that tests can assume that
// router.app != null.
mountAndMark(App, { router });
// We no longer need the Vue instance: destroy the component.
destroyMarkedComponent();
initNavGuards();
afterEach(clearNavGuards);

// Reset global application state.
afterEach(() => {
  if (Vue.prototype.$session.loggedIn()) logOut();
});

afterEach(testData.reset);
