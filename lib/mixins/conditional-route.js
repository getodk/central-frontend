/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
This mixin guards navigations based on one or more conditions about the request
data. For example:

  // Component definition object
  {
    mixins: [
      conditionalRoute({
        // Redirect to / if the project is archived.
        project: (project) => !project.archived,
        // Redirect to / if the form has no attachments.
        attachments: (attachments) => attachments.length !== 0
      }),
      ...
    ],
    ...
  }

Each key of the object specified to conditionalRoute() corresponds to a request
key.

The mixin checks the conditions before the route is entered, using a
beforeRouteEnter navigation guard. It also checks the conditions before the
route is updated, using a beforeRouteUpdate navigation guard. If any condition
is false, the user is redirected to /.

The mixin also checks the conditions when the request data changes, using one or
more watchers. This is helpful in part in case there is a navigation to the
route before there is data for all the request keys. In that case, as long as no
condition is false, the route will be entered (or updated). Then, as responses
are received for the request keys, any conditions that were not checked in the
beforeRouteEnter (or beforeRouteUpdate) guard will be checked in the watchers.
*/

import store from '../store';
import { preservesData } from '../router';

export default (options) => {
  const entries = Object.entries(options);
  const navGuard = (to, from, next) => {
    for (const [key, callback] of entries) {
      // If the data for the request key will be cleared after the navigation is
      // confirmed, we do not need to check it.
      if (preservesData('*', to, from) || preservesData(key, to, from)) {
        // Using `store` rather than this.$store, because `this` is not
        // accessible in beforeRouteEnter.
        const value = store.state.request.data[key];
        if (value != null && !callback(value)) {
          next('/');
          return;
        }
      }
    }
    next();
  };
  // @vue/component
  const mixin = {
    beforeRouteEnter: navGuard,
    beforeRouteUpdate: navGuard,
    watch: {}
  };
  for (const [key, callback] of entries) {
    // eslint-disable-next-line func-names
    mixin.watch[`$store.state.request.data.${key}`] = function(value) {
      if (value != null && !callback(value))
        this.$router.push('/');
    };
  }
  return mixin;
};
