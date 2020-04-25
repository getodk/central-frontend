/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
A component whose associated route has a validateData meta field must use this
mixin. See src/router.js for more information.

The mixin factory accepts the following option:

  - update (default: true). By default, the mixin defines a beforeRouteUpdate
    navigation guard in addition to a beforeRouteEnter guard. To skip the
    beforeRouteUpdate guard, specify `update` as `false`.
*/

import store from '../store';
import { canRoute } from '../util/router';

export default ({ update = true } = {}) => {
  // @vue/component
  const mixin = {
    beforeRouteEnter: (to, from, next) => {
      if (canRoute(to, from, store))
        next();
      else
        next('/');
    },
    created() {
      // this.$route is `null` in some tests.
      if (this.$route == null) return;
      const { matched } = this.$route;
      const { validateData } = matched[matched.length - 1].meta;
      for (const [key, validator] of validateData) {
        // eslint-disable-next-line func-names
        this.$watch(`$store.state.request.data.${key}`, function(value) {
          if (value != null && !validator(value)) this.$router.push('/');
        });
      }
    }
  };
  if (update) mixin.beforeRouteUpdate = mixin.beforeRouteEnter;
  return mixin;
};
