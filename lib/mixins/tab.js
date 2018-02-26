/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import alert from './alert';

export default () => { // eslint-disable-line arrow-body-style
  // @vue/component
  return {
    methods: {
      tabPathPrefix() {
        throw new Error('not implemented');
      },
      tabPath(path) {
        if (path.startsWith('/')) return path;
        const slash = path !== '' ? '/' : '';
        return `${this.tabPathPrefix()}${slash}${path}`;
      },
      tabClass(path) {
        return { active: this.$route.path === this.tabPath(path) };
      },
      hideAlert() {
        this.alert = alert.blank();
      }
    }
  };
};
