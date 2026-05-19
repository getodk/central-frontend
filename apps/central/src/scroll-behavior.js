/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
createScrollBehavior() and useScrollBehavior() work together to scroll based on
the route hash. createScrollBehavior() creates a scrollBehavior function to pass
to createRouter(). After each navigation, the scrollBehavior function returns a
promise to scroll to an element. However, it is up to component code to resolve
the promise. That's where useScrollBehavior() comes in. A component can call the
useScrollBehavior() composable if it needs to scroll to an element based on the
route hash. The composable returns a function that when called, scrolls to some
specified element. Calling that function is what resolves the promise that the
scrollBehavior function returns to Vue Router.

This approach uses the Vue Router scrollBehavior functionality and gives
components control over where they scroll.
*/

import { useRouter } from 'vue-router';

import { noop } from './util/util';

const scrollers = new WeakMap();

export const createScrollBehavior = (animation = 'smooth') => {
  // resolvePreviousScroll stores the `resolve` function from the last promise
  // returned to Vue Router. If there is no promise, or if the promise has
  // already been resolved, then resolvePreviousScroll is a no-op.
  let resolvePreviousScroll = noop;
  const scrollBehavior = (to, from, savedPosition) => {
    // If a promise was previously returned after the last navigation, then
    // resolve it / cancel it / clean it up. There's been a new navigation, so
    // any scrolling should be based on the new route hash.
    resolvePreviousScroll();
    // If there is no hash or nothing after the hash, then don't bother
    // returning a promise: no target has been specified for a component to
    // scroll to.
    if (to.hash === '' || to.hash === '#')
      return to.path === from.path ? savedPosition : null;
    return new Promise(resolve => {
      resolvePreviousScroll = (value) => {
        resolve(value);
        resolvePreviousScroll = noop;
      };
    });
  };
  const scrollTo = (elementOrSelector) => {
    if (typeof elementOrSelector === 'string') {
      const el = document.querySelector(elementOrSelector);
      if (el != null)
        scrollTo(el);
      else
        // Scrolling was unsuccessful: the element does not exist. Let's just
        // clean up the promise.
        resolvePreviousScroll();
      return;
    }

    resolvePreviousScroll({ el: elementOrSelector, top: 10, behavior: animation });
  };
  /* We need to store scrollTo() somewhere so that components can access it
  later. scrollBehavior isn't a plugin, so we can't use provide/inject. Instead,
  we use a Map. We use scrollBehavior as the Map key because it's accessible
  here, and components will also have access to it (via the router). Note that
  in testing, typically each test will create its own router with its own
  scrollBehavior. */
  scrollers.set(scrollBehavior, scrollTo);
  return scrollBehavior;
};

export const useScrollBehavior = () =>
  scrollers.get(useRouter().options.scrollBehavior);
