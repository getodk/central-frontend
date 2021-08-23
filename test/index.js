import Vue from 'vue';
import sinon from 'sinon';
import 'should';

// These files must be imported before the rest.
import './util/local-vue';
import '../src/setup';

import i18n from '../src/i18n';
import store from '../src/store';
import { noop } from '../src/util/util';

import testData from './data';
import { destroyAll } from './util/lifecycle';
import { loadAsyncRouteComponents } from './util/async-components';
import { mockAxios } from './util/axios';
import './assertions';



////////////////////////////////////////////////////////////////////////////////
// GLOBAL UTILITIES

{
  let unhandled = null;
  Vue.prototype.$http = mockAxios(config => {
    if (unhandled == null) unhandled = config;
    return Promise.reject(new Error('unhandled request'));
  });
  afterEach(() => {
    if (unhandled != null) {
      console.log(unhandled); // eslint-disable-line no-console
      throw new Error('A request was sent, but not handled. Are you using mockHttp() or load()?');
    }
  });
}

// Even if a route is lazy-loaded, load() will need synchronous access to the
// async components associated with the route.
before(loadAsyncRouteComponents);

Vue.prototype.$logger = { log: noop, error: noop };



////////////////////////////////////////////////////////////////////////////////
// OTHER HOOKS

beforeEach(testData.seed);

afterEach(() => {
  destroyAll();

  const afterScript = document.querySelector('body > script:last-of-type + *');
  if (afterScript != null) {
    console.log(document.body.innerHTML); // eslint-disable-line no-console
    throw new Error('Unexpected element after last script element. Have all components and Bootstrap elements been destroyed?');
  }
});

afterEach(() => {
  sinon.restore();
});

afterEach(() => {
  store.commit('resetAlert');
  store.commit('resetRequests');
  store.commit('clearData');
  store.commit('resetRouterState');
});

afterEach(() => {
  if (i18n.locale !== 'en') throw new Error('i18n locale was not restored');
});

afterEach(() => {
  localStorage.clear();
});

afterEach(testData.reset);



////////////////////////////////////////////////////////////////////////////////
// RUN TESTS

// Run all tests. See the documentation for karma-webpack. We specify the files
// here rather than in karma.conf.js, because doing so is more performant. When
// I tried specifying the tests in karma.conf.js, I encountered an out-of-memory
// error.
const testsContext = require.context('.', true, /\.spec\.js$/);
testsContext.keys().forEach(testsContext);
