/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
A component that contains tabs may use this composable/mixin, which includes
related helper functions/methods.

If the component using this composable/mixin contains a tab that uses a relative
path, the component must specify the prefix for relative paths:

  - Composable: Specify a ref whose value is the prefix.
  - Mixin: Define a property named tabPathPrefix to hold the prefix.
*/

import { map } from 'ramda';

// @vue/component
export const mixinTabs = {
  methods: {
    tabPath(path) {
      if (path.startsWith('/')) return path;
      if (this.tabPathPrefix == null) throw new Error('invalid prefix');
      const slash = path !== '' ? '/' : '';
      return `${this.tabPathPrefix}${slash}${path}`;
    },
    tabClass(path) {
      return { active: this.$route.path === this.tabPath(path) };
    }
  }
};

export const useTabs = (route, tabPathPrefix = undefined) => {
  const obj = { $route: route, ...mixinTabs.methods };
  if (tabPathPrefix != null) {
    Object.defineProperty(obj, 'tabPathPrefix', {
      get() { return tabPathPrefix.value; }
    });
  }
  return map((f) => f.bind(obj), mixinTabs.methods);
};
