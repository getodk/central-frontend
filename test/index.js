import sinon from 'sinon';
import { Wrapper } from '@vue/test-utils';
import 'should';

// These files must be imported before the rest.
import './plugins';
import '../src/setup';

import testData from './data';
import { destroyAll } from './util/lifecycle';
import { loadAsyncRouteComponents } from './util/load-async';
import { mockLogin } from './util/session';
import './assertions';

// TODO/vue3. Remove this.
for (const name of ['findAll', 'findAllComponents']) {
  const f = Wrapper.prototype[name];
  // eslint-disable-next-line func-names
  Wrapper.prototype[name] = function(selector) {
    return f.call(this, selector).wrappers;
  };
}



////////////////////////////////////////////////////////////////////////////////
// HOOKS

// Even if a route is lazy-loaded, load() will need synchronous access to the
// async components associated with the route.
before(loadAsyncRouteComponents);

beforeEach(testData.seed);

afterEach(() => {
  destroyAll();

  const afterScript = document.querySelector('body > script:last-of-type + *');
  if (afterScript != null) {
    console.error(document.body.innerHTML); // eslint-disable-line no-console
    throw new Error('Unexpected element after last script element. Have all components and Bootstrap elements been destroyed?');
  }
});

afterEach(() => {
  sinon.restore();
  document.documentElement.setAttribute('lang', 'en');
  localStorage.clear();
  testData.reset();
  mockLogin.reset();
});



////////////////////////////////////////////////////////////////////////////////
// RUN TESTS

// Run all tests. See the documentation for karma-webpack. We specify the files
// here rather than in karma.conf.js, because doing so is more performant. When
// I tried specifying the tests in karma.conf.js, I encountered an out-of-memory
// error.
const testsContext = require.context('.', true, /\.spec\.js$/);
testsContext.keys().forEach(testsContext);
