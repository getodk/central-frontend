import sinon from 'sinon';
import { enableAutoUnmount } from '@vue/test-utils';
import { should } from 'chai';

import '../src/styles';

import testData from './data';
import { afterEachTest, beforeEachTest, setupHooks } from './setup/hooks';
import { loadAsyncRouteComponents } from './util/load-async';
import { mockLogin } from './util/session';
import { restoreLuxon } from './util/date-time';
import { setupLanguages } from './util/i18n';
import './setup/assertions';
import './setup/iframe';

window.should = should();

// Vitest hasn't made describe() a global yet. Once it tries to, we will run
// setupHooks() instead. Doing so will set a describe() global that will call
// the hooks added below.
Object.defineProperty(window, 'describe', {
  set(describe) {
    delete window.describe;
    setupHooks(describe);
  },
  configurable: true
});

Error.stackTraceLimit = 40;



////////////////////////////////////////////////////////////////////////////////
// HOOKS

/*
In this section only, call these alternative hooks:

  - Call beforeEachFile() instead of beforeAll().
  - Call afterEachFile() instead of afterAll().
  - Call beforeEachTest() instead of beforeEach().
  - Call afterEachTest() instead of afterEach().

See test/setup/hooks.js for more details if you're curious.
*/

// Even if a route is lazy-loaded, load() will need synchronous access to the
// async components associated with the route.
beforeAll(loadAsyncRouteComponents);

beforeEachTest(() => { window.resizeTo(1100, 650); });

enableAutoUnmount(afterEachTest);
afterEachTest(() => {
  const app = document.querySelector('[data-v-app]');
  if (app != null) app.parentNode.removeChild(app);

  // TODO. Update selector.
  const afterScript = document.querySelector('body > script:last-of-type + *');
  if (afterScript != null) {
    console.error(document.body.innerHTML); // eslint-disable-line no-console
    throw new Error('Unexpected element after last script element. Have all Bootstrap elements been removed?');
  }
});

afterEachTest(() => {
  sinon.restore();
  window.scrollTo(0, 0);
  document.documentElement.setAttribute('lang', 'en');
  localStorage.clear();
  restoreLuxon();
  testData.reset();
  mockLogin.reset();
  document.cookie = '';
});
setupLanguages(afterEachTest);
