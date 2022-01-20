import { RouterLinkStub } from '@vue/test-utils';
import { START_LOCATION, createMemoryHistory, routeLocationKey, routerKey } from 'vue-router';
import { construct, tap } from 'ramda';
import { ref } from 'vue';

import createCentralRouter from '../../src/router';
import { noop } from '../../src/util/util';

import createTestContainer from './container';

export const testRouter = (modify = noop) => (container) =>
  // Using memory history mode because there were issues using hash mode. In
  // hash mode, when the router is installed on the application instance, the
  // router examines the hash to determine the initial location. But that
  // becomes an issue during testing, because the hash diverges from the current
  // route over time: Headless Chrome seems to rate-limit hash changes.
  tap(modify, createCentralRouter(container, createMemoryHistory()));

const { router } = createTestContainer({ router: testRouter() });
export const resolveRoute = router.resolve.bind(router);

const RouterViewStub = {
  name: 'RouterViewStub',
  template: '<router-view-stub></router-view-stub>'
};

// A router-like object that cannot navigate
class MockRouter {
  constructor(location = undefined) {
    this.currentRoute = ref(location != null
      ? resolveRoute(location)
      : START_LOCATION);
  }

  install(app) {
    const { globalProperties } = app.config;
    globalProperties.$router = this;
    globalProperties.$route = this.currentRoute.value;

    app.component('RouterLink', RouterLinkStub);
    app.component('RouterView', RouterViewStub);

    app.provide(routerKey, this);
    app.provide(routeLocationKey, this.currentValue.value);
  }
}

MockRouter.prototype.resolve = resolveRoute;
for (const name of ['getRoutes', 'hasRoute'])
  MockRouter.prototype[name] = router[name].bind(router);

const notSupported = () => { throw new Error('not supported in mock router'); };
for (const prop in router) {
  if (!(prop in MockRouter.prototype))
    Object.defineProperty(MockRouter.prototype, prop, { get: notSupported });
}

export const mockRouter = construct(MockRouter);
