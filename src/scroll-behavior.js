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
import { useRouter } from 'vue-router';

import { noop } from './util/util';

const scrollers = new WeakMap();

// Returns a scrollBehavior function to pass to createRouter().
export const createScrollBehavior = (animation = 'smooth') => {
  let resolvePreviousScroll = noop;
  const scrollBehavior = (to, from, savedPosition) => {
    resolvePreviousScroll();
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
        resolvePreviousScroll();
    }

    resolvePreviousScroll({ el: elementOrSelector, top: 10, behavior: animation });
  };
  scrollers.set(scrollBehavior, scrollTo);
  return scrollBehavior;
};

// Returns a function to scroll to a specified element.
export const useScrollBehavior = () =>
  scrollers.get(useRouter().options.scrollBehavior);
