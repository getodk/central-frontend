import Vue from 'vue';
import 'should';

// Importing lib/setup.js first, because other import statements below may
// import some of the same modules as lib/setup.js, and in some cases, the order
// in which lib/setup.js imports modules matters.
import '../lib/setup';
import App from '../lib/components/app.vue';
import router from '../lib/router';
import store from '../lib/store';
import testData from './data';
import { MockLogger } from './util';
import { clearNavGuards, initNavGuards } from './router';
import { clearUniqueFakerResults } from './faker';
import { destroyMarkedComponent, mountAndMark } from './destroy';
import { setHttp } from './http';
import './assertions';

// "iTrim" for "internally trim"
// eslint-disable-next-line no-extend-native
String.prototype.iTrim = function iTrim() {
  return this.replace(/\s+/g, ' ');
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

// Reset the Vuex store.
afterEach(() => {
  store.commit('resetAlert');
  store.commit('resetRequests');
  store.commit('clearData');

  // We do not reset the router state, because mockHttp() does that. (Though
  // perhaps it would be better to move that code here?)
});

afterEach(testData.reset);
afterEach(clearUniqueFakerResults);
