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



////////////////////////////////////////////////////////////////////////////////
// STANDARD BUILT-IN OBJECTS

// "iTrim" for "internally trim"
// eslint-disable-next-line no-extend-native
String.prototype.iTrim = function iTrim() {
  return this.replace(/\s+/g, ' ');
};



////////////////////////////////////////////////////////////////////////////////
// UTILITIES

Vue.prototype.$logger = new MockLogger();

// We set $http below.



////////////////////////////////////////////////////////////////////////////////
// ROUTER

// Inject the router into a Vue instance so that tests can assume that the
// router has been injected into at least one Vue instance.
setHttp(() => Promise.reject(new Error()));
mountAndMark(App, { router });
destroyMarkedComponent();

initNavGuards();
afterEach(clearNavGuards);



////////////////////////////////////////////////////////////////////////////////
// $http

setHttp(config => {
  console.log('unhandled request', config); // eslint-disable-line no-console
  return Promise.reject(new Error());
});



////////////////////////////////////////////////////////////////////////////////
// DESTROY COMPONENT

afterEach(() => {
  destroyMarkedComponent();

  const afterScript = $('body > script:last-of-type + *');
  if (afterScript.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`Unexpected element: ${afterScript[0].outerHTML}`);
    throw new Error('Unexpected element after last script element. Have all components and Bootstrap elements been destroyed?');
  }
});



////////////////////////////////////////////////////////////////////////////////
// VUEX

// Reset the store.
afterEach(() => {
  store.commit('resetAlert');
  store.commit('resetRequests');
  store.commit('clearData');

  // We do not reset the router state, because mockHttp() does that. (Though
  // perhaps it would be better to move that code here?)
});



////////////////////////////////////////////////////////////////////////////////
// TEST DATA

afterEach(testData.reset);



////////////////////////////////////////////////////////////////////////////////
// FAKER

afterEach(clearUniqueFakerResults);
