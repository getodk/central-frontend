// Importing src/setup.js first, because the import statements below may import
// some of the same modules as src/setup.js, and in some cases, the order in
// which src/setup.js imports modules matters.
import '../src/setup';

import Vue from 'vue';
import sinon from 'sinon';
import { mount } from 'avoriaz';
import 'should';

import i18n from '../src/i18n';
import router from '../src/router';
import store from '../src/store';
import { cancelScheduledLogout } from '../src/util/session';
import { forceReplace } from '../src/util/router';
import { noop } from '../src/util/util';

import TestUtilBlank from './util/components/blank.vue';

import testData from './data';
import { destroyMarkedComponents } from './util/lifecycle';
import { loadAsyncRouteComponents } from './util/async-components';
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

{
  let unhandled = null;
  setHttp(config => {
    if (unhandled == null) unhandled = config;
    return Promise.reject(new Error('unhandled request'));
  });
  afterEach(() => {
    if (unhandled != null) {
      console.log(unhandled); // eslint-disable-line no-console
      throw new Error('A request was sent, but not handled. Are you using mockHttp()?');
    }
  });
}

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
// SINON

afterEach(() => {
  sinon.restore();
});



////////////////////////////////////////////////////////////////////////////////
// ROUTER

/*
We use a single global router, which we will inject into many components during
testing. The router has an `app` property, which seems to be set when the router
is injected into a component and unset when the component is destroyed.

This sounds like it should work for our tests, but there are complications
related to our use of hash mode. When the router is injected into a component,
it examines the hash to determine the initial location. However, during testing,
the hash diverges from the current route over time: Headless Chrome seems to
rate-limit hash changes. The router seems to work despite this, but it becomes
an issue when the router is injected into a component.

To work around this, we inject the router into multiple components concurrently.
Vue Router seems to support this: in addition to the `app` property, the router
has a mostly undocumented property named `apps`. Below, we inject the router
into a simple component, thereby setting up the router; we will never destroy
this component. When a test later injects the router into a new component, the
router will not examine the hash. Instead, to set the initial location, we
navigate to the location before mounting the component.

This approach seems fragile, and we could consider alternatives:

  - Mock the <router-link> component so that we only need to inject the router
    when there is navigation.
  - Use abstract mode during testing.
*/

before(() => {
  store.commit('setSendInitialRequests', false);
  mount(TestUtilBlank, { router });
  store.commit('resetRouterState');
});

{
  let lastRoute = null;
  afterEach(async () => {
    if (router.currentRoute !== lastRoute) {
      // If the next test that uses the router tries to navigate to the current
      // location, the navigation will be aborted. To prevent that, we navigate
      // to a unique location before the next test.
      const random = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
      await forceReplace(router, store, `/not-found/${random}`);
      lastRoute = router.currentRoute;
    }

    store.commit('resetRouterState');
  });
}

// Even if a route is lazy-loaded, load() will need synchronous access to the
// async components associated with the route.
before(loadAsyncRouteComponents);



////////////////////////////////////////////////////////////////////////////////
// OTHER APP STATE

afterEach(() => {
  store.commit('resetAlert');
  store.commit('resetRequests');
  store.commit('clearData');
});

afterEach(() => {
  if (i18n.locale !== 'en') throw new Error('i18n locale was not restored');
});

afterEach(() => {
  localStorage.clear();
});

afterEach(cancelScheduledLogout);



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
