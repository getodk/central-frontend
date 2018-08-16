import { router } from '../lib/router';

// All guards must be synchronous.
const guards = {
  before: [],
  after: []
};

export const initNavGuards = () => {
  router.beforeEach((to, from, next) => {
    for (const guard of guards.before)
      guard(to, from);
    next();
  });
  router.afterEach((to, from) => {
    for (const guard of guards.after)
      guard(to, from);
  });
};

export const beforeEachNav = (guard) => guards.before.push(guard);
export const afterEachNav = (guard) => guards.after.push(guard);

export const clearNavGuards = () => {
  guards.before = [];
  guards.after = [];
};
