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
A component that contains tabs may use this mixin, which includes related helper
methods.

The mixin factory does not take any options.

If the component using this mixin contains at least one tab that uses a relative
path, the component must define the following property:

  - tabPathPrefix. The prefix for relative paths.
*/

// @vue/component
const mixin = {
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

export default () => mixin;
