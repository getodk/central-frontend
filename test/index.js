import Vue from 'vue';
import sinon from 'sinon';
import { enableAutoUnmount } from '@vue/test-utils';
import 'should';

import '../src/setup';

import i18n from '../src/i18n';
import { noop } from '../src/util/util';

import testData from './data';
import { loadAsyncRouteComponents } from './util/async-components';
import { mockAxios } from './util/axios';
import { mockLogin } from './util/session';
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

enableAutoUnmount(afterEach);

afterEach(() => {
  const afterScript = document.querySelector('body > script:last-of-type + *');
  if (afterScript != null) {
    console.log(document.body.innerHTML); // eslint-disable-line no-console
    throw new Error('Unexpected element after last script element. Have all Bootstrap elements been removed?');
  }
});

afterEach(() => {
  sinon.restore();
});

afterEach(() => {
  if (i18n.locale !== 'en') throw new Error('i18n locale was not restored');
});

afterEach(() => {
  localStorage.clear();
});

afterEach(testData.reset);

afterEach(mockLogin.reset);



////////////////////////////////////////////////////////////////////////////////
// RUN TESTS

// Run all tests. See the documentation for karma-webpack. We specify the files
// here rather than in karma.conf.js, because doing so is more performant. When
// I tried specifying the tests in karma.conf.js, I encountered an out-of-memory
// error.
const testsContext = require.context('.', true, /\.spec\.js$/);
testsContext.keys().forEach(testsContext);
