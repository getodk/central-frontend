import { RouterLinkStub } from '@vue/test-utils';
import { START_LOCATION, createMemoryHistory } from 'vue-router';
import { ref } from 'vue';
import { tap } from 'ramda';

import RouterViewStub from './components/router-view-stub.vue';

import createCentralRouter from '../../src/router';
import { noop } from '../../src/util/util';

import createTestContainer from './container';

// Returns a function to create a real router configured for use in testing.
export const testRouter = (modify = noop) => (container) =>
  // Using memory mode because there were issues using hash mode. In hash mode,
  // when the router is injected into a root component, the router examines the
  // hash to determine the initial location. But that becomes an issue during
  // testing, because the hash diverges from the current route over time:
  // Headless Chrome seems to rate-limit hash changes.
  tap(modify, createCentralRouter(container, createMemoryHistory()));

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
      : START_LOCATION);
  }

  install(Vue) {
    // eslint-disable-next-line no-param-reassign
    Vue.prototype.$router = this;
    // eslint-disable-next-line no-param-reassign
    Vue.prototype.$route = this.currentRoute.value;
    Vue.component('router-link', RouterLinkStub);
    Vue.component('router-view', RouterViewStub);
  }
}

MockRouter.prototype.resolve = resolveRoute;
// TODO/vue3. Update this list for Vue 3.
for (const name of ['getRoutes'])
  MockRouter.prototype[name] = router[name].bind(router);

for (const prop in router) {
  if (!(prop in MockRouter.prototype)) {
    Object.defineProperty(MockRouter.prototype, prop, {
      get: () => { throw new Error(`${prop} not supported in mock router`); }
    });
  }
}

export const mockRouter = (location = undefined) => () => new MockRouter(location);
