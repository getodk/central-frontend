import createRoutes from '../../src/routes';
import { loadAsync } from '../../src/util/load-async';

import createTestContainer from './container';

export const loadAsyncCache = new Map();

export const loadAsyncRouteComponents = () => {
  const promises = [];
  const stack = [...createRoutes(createTestContainer())];
  while (stack.length !== 0) {
    const route = stack.pop();

    const { asyncRoute } = route.meta;
    if (asyncRoute != null) {
      const { componentName } = asyncRoute;
      promises.push(loadAsync(componentName)().then(m => {
        loadAsyncCache.set(componentName, m);
      }));
    }

    if (route.children != null) {
      for (const child of route.children)
        stack.push(child);
    }
  }
  return Promise.all(promises);
};
