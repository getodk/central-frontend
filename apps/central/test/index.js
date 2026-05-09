import sinon from 'sinon';
import { enableAutoUnmount } from '@vue/test-utils';
import { expect, should } from 'chai';

import '../src/styles';
import '../src/jquery';
import '../src/bootstrap';

import testData from './data';
import { loadAsyncRouteComponents } from './util/load-async';
import { mockLogin } from './util/session';
import { setupLanguages } from './util/i18n';
import './assertions';

window.beforeAll = before; // eslint-disable-line no-undef
window.afterAll = after; // eslint-disable-line no-undef
window.test = it;

window.should = should();
window.expect = expect;



////////////////////////////////////////////////////////////////////////////////
// HOOKS

// Even if a route is lazy-loaded, load() will need synchronous access to the
// async components associated with the route.
beforeAll(loadAsyncRouteComponents);

enableAutoUnmount(afterEach);
afterEach(() => {
  const app = document.querySelector('[data-v-app]');
  if (app != null) app.parentNode.removeChild(app);

  const afterScript = document.querySelector('body > script:last-of-type + *');
  if (afterScript != null) {
    console.error(document.body.innerHTML); // eslint-disable-line no-console
    throw new Error('Unexpected element after last script element. Have all Bootstrap elements been removed?');
  }
});

afterEach(() => {
  sinon.restore();
  window.scrollTo(0, 0);
  document.documentElement.setAttribute('lang', 'en');
  localStorage.clear();
  testData.reset();
  mockLogin.reset();
  document.cookie = '';
});
setupLanguages(afterEach);



////////////////////////////////////////////////////////////////////////////////
// RUN TESTS

// Run all tests. See the documentation for karma-webpack. We specify the files
// here rather than in karma.conf.js, because doing so is more performant. When
// I tried specifying the tests in karma.conf.js, I encountered an out-of-memory
// error.
const testsContext = require.context('.', true, /\.spec\.js$/);
testsContext.keys().forEach(testsContext);
