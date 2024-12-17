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
useQueryRef() returns a ref that is synced with one or more query parameters.
When the value of a query parameter changes, the value of the ref is set. When
the value of the ref is set, query parameters are updated. One common use is
with filters: when a filter selection is changed, the query string is updated.
useQueryRef() expects to be passed two functions:

  - fromQuery(). Converts query parameters to the value of the ref. Often, a ref
    only uses one query parameter, but a ref may use more than one.
  - toQuery(). Converts the value of the ref to query parameters. Make sure that
    the function always returns values for the query parameters with which the
    ref is synced, even if one or more are `null`. That's needed in order to
    remove a query parameter.

useQueryRef() only tracks changes to the value of the ref and to query
parameters. If fromQuery() or toQuery() uses other reactive data, nothing will
be triggered if that data changes.
*/

import { computed, shallowRef, watch } from 'vue';
import { equals } from 'ramda';
import { useRoute, useRouter } from 'vue-router';

export default ({ fromQuery, toQuery }) => {
  const router = useRouter();
  const route = useRoute();

  // Set the value of the ref by calling fromQuery(). We will track the specific
  // query parameters that fromQuery() uses (in `params`).
  const result = shallowRef(null);
  const params = new Set();
  const queryProxy = new Proxy({}, {
    get: (_, name) => {
      params.add(name);
      return route.query[name];
    }
  });
  const setValueFromQuery = () => {
    params.clear();
    result.value = fromQuery(queryProxy);
  };
  setValueFromQuery();

  /*
  Watch for changes to the tracked query parameters. If a query parameter
  changes, then the value of the ref will be set again. (An important exception
  is if the change to the query parameter was caused by setting the value: see
  below.)

  In general, the strategy here is to call setValueFromQuery() as infrequently
  as possible. If the value of the ref isn't a primitive, then setting it to a
  new object would trigger reactive effects even if the new object is basically
  the same -- something we want to avoid.
  */
  let ignoreNextRouteChange = false;
  watch(router.currentRoute, (newRoute, oldRoute) => {
    // If the route has changed, then the component that called this composable
    // is probably about to be unmounted, so there's no need to set the value of
    // the ref. If a new component is mounted that also uses useQueryRef(), that
    // will set up a different watcher. See:
    // https://github.com/getodk/central/issues/756
    if (newRoute.path !== oldRoute.path) return;

    if (ignoreNextRouteChange) {
      ignoreNextRouteChange = false;
      return;
    }

    const newQuery = newRoute.query;
    const oldQuery = oldRoute.query;
    for (const name of params) {
      // Using equals() rather than === to account for array values.
      if (!equals(newQuery[name], oldQuery[name])) {
        setValueFromQuery();
        return;
      }
    }
  });

  // Updates query parameters after a change to the value of the ref, calling
  // toQuery().
  const replaceQuery = () => {
    const newQuery = { ...route.query };
    for (const [name, value] of Object.entries(toQuery(result.value))) {
      // Vue Router allows the value of a query parameter to be `null`, but we
      // don't use that pattern in Frontend. Here, we remove a query parameter
      // if its new value is `null` or `undefined`.
      if (value != null)
        newQuery[name] = value;
      else
        delete newQuery[name];
    }
    // It is uncommon for a change to the value of a ref not to change query
    // parameters. However, there are valid cases like that, for example,
    // involving loading data.
    if (equals(newQuery, route.query)) return;

    ignoreNextRouteChange = true;
    router.replace({ path: route.path, query: newQuery });
  };

  // Wrap `result` in a computed ref in order to trigger replaceQuery(). We
  // could have watched `result` instead, running replaceQuery() after a change.
  // However, that would have made it harder to set result.value in this file,
  // as doing so would trigger the watcher.
  return computed({
    get: () => result.value,
    set: (value) => {
      if (result.value !== value) {
        result.value = value;
        replaceQuery();
      }
    }
  });
};
