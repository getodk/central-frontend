import { RouterLinkStub } from '@vue/test-utils';
import { START_LOCATION, createMemoryHistory, routeLocationKey, routerKey } from 'vue-router';
import { shallowRef } from 'vue';

import RouterViewStub from './components/router-view-stub.vue';

import createCentralRouter from '../../src/router';
import { noop } from '../../src/util/util';

// Returns a function to create a real router configured for use in testing.
export const testRouter = () => (container) =>
  // Using memory history mode because there were issues using hash mode. In
  // hash mode, when the router is installed on an application instance, the
  // router examines the hash to determine the initial location. But that
  // becomes an issue during testing, because the hash diverges from the current
  // route over time: Headless Chrome seems to rate-limit hash changes.
  createCentralRouter(container, createMemoryHistory());

/*
Use setInstallLocation() when you want to trigger a navigation, then mount a
component before the navigation is confirmed. (This is the sequence that happens
in production.) At least how Vue Router works right now, when a router is
installed on an app instance, it will trigger a navigation unless the initial
navigation has already been completed:
https://github.com/vuejs/router/blob/df836529db63360f0bf9810ccd4e8911846aef45/packages/router/src/router.ts#L1211-L1223
There doesn't seem to be an easy way to get the router to skip that navigation.
However, setInstallLocation() can be used to set the location that the router
will navigate to.
*/
export const setInstallLocation = (router, location) => {
  const { history } = router.options;
  if (history.location !== '')
    throw new Error('history.location has already been set');
  // history.replace() expects a string.
  history.replace(typeof location === 'string'
    ? location
    : router.resolve(location).fullPath);
};

/* mockRouter() returns a function to create a router-like object that cannot
navigate and never calls navigation hooks. In a sense, the object is like a
read-only router: the object's current route will never change once the object
is initialized. If installed on an app instance, the object will register stubs
for <router-link> and <router-view>. If you need a router that can navigate, use
testRouter(). */
export const mockRouter = (location = undefined) => (container) => {
  const router = createCentralRouter(container, createMemoryHistory());
  const currentRoute = shallowRef(location != null
    ? router.resolve(location)
    : START_LOCATION);
  const mock = {
    currentRoute,
    isReady: currentRoute.value !== START_LOCATION
      ? () => Promise.resolve()
      : () => { throw new Error('not ready'); },
    afterEach: () => noop,
    onError: () => noop,
    install: (app) => {
      // eslint-disable-next-line no-param-reassign
      app.config.globalProperties.$router = mock;
      // eslint-disable-next-line no-param-reassign
      app.config.globalProperties.$route = currentRoute.value;

      app.provide(routerKey, mock);
      app.provide(routeLocationKey, currentRoute.value);

      app.component('RouterLink', RouterLinkStub);
      app.component('RouterView', RouterViewStub);
    }
  };
  for (const prop of ['getRoutes', 'hasRoute', 'resolve'])
    mock[prop] = router[prop].bind(router);
  for (const prop in router) {
    if (!(prop in mock)) {
      Object.defineProperty(mock, prop, {
        get: () => { throw new Error(`${prop} not supported in mock router`); }
      });
    }
  }
  return mock;
};
