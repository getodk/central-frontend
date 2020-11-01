// Importing src/setup.js first, because the import statements below may import
// some of the same modules as src/setup.js, and in some cases, the order in
// which src/setup.js imports modules matters.
import '../src/setup';

import Vue from 'vue';
import sinon from 'sinon';
import { mount } from 'avoriaz';
import 'should';

import Blank from '../src/components/blank.vue';
import i18n from '../src/i18n';
import router from '../src/router';
import store from '../src/store';
import testData from './data';
import { clearNavGuards, initNavGuards } from './util/router';
import { destroyMarkedComponents } from './util/lifecycle';
import { loadAsyncRouteComponents } from './util/async-components';
import { noop } from '../src/util/util';
import { setHttp } from './util/http';
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

setHttp(config => {
  console.log('unhandled request', config); // eslint-disable-line no-console
  return Promise.reject(new Error());
});

Vue.prototype.$logger = { log: noop, error: noop };



////////////////////////////////////////////////////////////////////////////////
// DESTROY COMPONENTS

afterEach(() => {
  destroyMarkedComponents();

  const afterScript = document.querySelector('body > script:last-of-type + *');
  if (afterScript != null) {
    // eslint-disable-next-line no-console
    console.log(`Unexpected element: ${afterScript.outerHTML}`);
    throw new Error('Unexpected element after last script element. Have all components and Bootstrap elements been destroyed?');
  }
});



////////////////////////////////////////////////////////////////////////////////
// ROUTER

/*
There are two pieces of complexity in how we use the router during testing,
having to do with (1) the number of routers and (2) the number of components
into which the router is injected.

We use the single, global router during testing rather than instantiating a
different router for each test. We do so because each Vue router attaches a
history listener to the window, but does not remove it: see
vuejs/vue-router#2341. Because Karma runs all tests in a single window, multiple
history listeners could conflict with each other.

Whenever the router is injected into a component, the undocumented
VueRouter.prototype.init() is run. init() is what attaches the history listener,
and it does so whenever the number of non-destroyed components into which the
router has been previously injected is 0. That happens when (1) the first
component is mounted, or (2) another component is mounted after all previous
components have been destroyed. Vue Router seems to assume that the second case
is not possible: see
https://github.com/vuejs/vue-router/pull/2706#discussion_r274414101. For us, the
second case is not possible during production, but it would be possible (and
actually common) during testing, because each test destroys any component it
mounts. Also, again, because Karma runs all tests in a single window, we need
the router not to attach multiple listeners. For these reasons, we need to
ensure that the second case never occurs, even during testing. To do so, we
inject the router into a component that does not use the router, then we never
destroy the component. This approach is admittedly fragile, relying on
undocumented VueRouter behavior, and it may need to change with updates to the
vue-router package.
*/
store.commit('setSendInitialRequests', false);
mount(Blank, { router });
store.commit('setSendInitialRequests', true);

let lastRoute = null;
afterEach(() => {
  if (router.currentRoute === lastRoute) {
    store.commit('resetRouterState');
    return undefined;
  }

  return new Promise((resolve, reject) => {
    store.commit('setUnsavedChanges', false);
    const random = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    // If the next test that uses the router tries to navigate to the current
    // location, the navigation will be aborted. To prevent that, we navigate to
    // a unique location before the next test.
    router.push(
      `/not-found/${random}`,
      () => {
        store.commit('resetRouterState');
        lastRoute = router.currentRoute;
        resolve();
      },
      () => {
        reject(new Error('navigation aborted'));
      }
    );
  });
});

// Even if a route is lazy-loaded, load() will need synchronous access to the
// async components associated with the route.
before(loadAsyncRouteComponents);

initNavGuards();
afterEach(clearNavGuards);



////////////////////////////////////////////////////////////////////////////////
// VUEX

afterEach(() => {
  store.commit('resetAlert');
  store.commit('resetRequests');
  store.commit('clearData');
});



////////////////////////////////////////////////////////////////////////////////
// VUE I18N

afterEach(() => {
  if (i18n.locale !== 'en') throw new Error('i18n locale was not restored');
});



////////////////////////////////////////////////////////////////////////////////
// SINON

afterEach(() => {
  sinon.restore();
});



////////////////////////////////////////////////////////////////////////////////
// LOCAL STORAGE

afterEach(() => {
  localStorage.clear();
});



////////////////////////////////////////////////////////////////////////////////
// TEST DATA

beforeEach(testData.seed);
afterEach(testData.reset);



////////////////////////////////////////////////////////////////////////////////
// RUN TESTS

// Run all tests. See the documentation for karma-webpack. We specify the files
// here rather than in karma.conf.js, because doing so is more performant. When
// I tried specifying the tests in karma.conf.js, I encountered an out-of-memory
// error.
const testsContext = require.context('.', true, /\.spec\.js$/);
testsContext.keys().forEach(testsContext);
