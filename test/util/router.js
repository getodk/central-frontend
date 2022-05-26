import { RouterLinkStub } from '@vue/test-utils';
import { START_LOCATION, createMemoryHistory } from 'vue-router';
import { markRaw, ref } from 'vue';
import { tap } from 'ramda';

import RouterViewStub from './components/router-view-stub.vue';

import createCentralRouter from '../../src/router';
import { noop } from '../../src/util/util';

import createTestContainer from './container';

// Returns a function to create a real router configured for use in testing.
export const testRouter = (modify = noop) => (container) =>
  // Using memory history mode because there were issues using hash mode. In
  // hash mode, when the router is installed on an application instance, the
  // router examines the hash to determine the initial location. But that
  // becomes an issue during testing, because the hash diverges from the current
  // route over time: Headless Chrome seems to rate-limit hash changes.
  tap(modify, createCentralRouter(container, createMemoryHistory()));

export const withInstallLocation = (location) => {
  if (typeof location !== 'string')
    throw new Error('location must be a string');
  return (router) => {
    const { history } = router.options;
    const { get } = Object.getOwnPropertyDescriptor(history, 'location');
    Object.defineProperty(history, 'location', {
      get: () => {
        Object.defineProperty(history, 'location', { get });
        return location;
      }
    });
  };
};

const { router } = createTestContainer({ router: testRouter() });
export const resolveRoute = router.resolve.bind(router);

// A router-like object that cannot navigate. In a sense, the object is like a
// read-only router: the object's current route will never change after the
// object is initialized. If you need a router that can navigate, use
// testRouter().
class MockRouter {
  constructor(location) {
    this.currentRoute = ref(location != null
      ? resolveRoute(location)
      : markRaw(START_LOCATION));
  }

  isReady() {
    if (this.currentRoute.value === START_LOCATION)
      throw new Error('not ready');
    return Promise.resolve();
  }

  install(app) {
    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$router = this;
    // eslint-disable-next-line no-param-reassign
    app.config.globalProperties.$route = this.currentRoute.value;
    app.component('router-link', RouterLinkStub);
    app.component('router-view', RouterViewStub);
  }
}

MockRouter.prototype.resolve = resolveRoute;
for (const name of ['getRoutes', 'hasRoute'])
  MockRouter.prototype[name] = router[name].bind(router);

for (const prop in router) {
  if (!(prop in MockRouter.prototype || prop === 'currentRoute')) {
    Object.defineProperty(MockRouter.prototype, prop, {
      get: () => { throw new Error(`${prop} not supported in mock router`); }
    });
  }
}

export const mockRouter = (location = undefined) => () => new MockRouter(location);
