/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
This mixin is used to send POST, PUT, PATCH, and DELETE requests. For GET
requests, use $store.dispatch('get').

The request mixin assumes that no single component sends concurrent requests. It
is the component's responsibility to ensure that the user is not able to send
concurrent requests, for example, by disabling a submit button while a request
is in progress. Separate components can send concurrent requests, but any single
component can only send one request at a time.

The component using this mixin may optionally define the following data
property:

  - awaitingResponse. `true` if a request is in progress and `false` if not.
    Initialize the property as `false`. The component using the mixin should not
    directly mutate this property after defining it.
*/

import { configForPossibleBackendRequest, logAxiosError, requestAlertMessage } from '../util/request';

/*
request() accepts all the options that axios.request() does. It also accepts the
following option:

  - problemToAlert. If the request results in an error, request() shows an
    alert. By default, the alert message is the same as that of the Backend
    Problem. However, if a function is specified for problemToAlert, request()
    first passes the Problem to the function, which has the option to return a
    different message. If the function returns `null` or `undefined`, the
    default message is used.

Return Value
------------

request() returns a promise. The promise will be rejected if the request results
in an error or if the user navigates away from the route that sent the request.
Otherwise the promise should be fulfilled.

If you call then() on the promise, note that the request will no longer be in
progress when the then() callback is run (awaitingResponse will equal `false`).
If you call catch() on the promise, your logic should not assume that the
request resulted in an error. Before the then() or catch() callback is run, Vue
will react to the change in `awaitingResponse` from `true` to `false`, running
watchers and updating the DOM.
*/
function request({ problemToAlert = undefined, ...axiosConfig }) {
  if (this.awaitingResponse != null) this.awaitingResponse = true;
  const token = this.$store.getters.loggedIn
    ? this.$store.state.request.data.session.token
    : null;
  const { currentRoute } = this.$store.state.router;
  return this.$http.request(configForPossibleBackendRequest(axiosConfig, token))
    .catch(error => {
      if (this.$store.state.router.currentRoute !== currentRoute)
        throw new Error('route change');
      if (this.awaitingResponse != null) this.awaitingResponse = false;
      logAxiosError(error);
      const message = requestAlertMessage(error, problemToAlert);
      this.$store.commit('setAlert', { type: 'danger', message });
      throw error;
    })
    .then(response => {
      if (this.$store.state.router.currentRoute !== currentRoute)
        throw new Error('route change');
      if (this.awaitingResponse != null) this.awaitingResponse = false;
      return response;
    });
}

export default () => { // eslint-disable-line arrow-body-style
  // @vue/component
  return {
    watch: {
      $route() {
        this.awaitingResponse = false;
      }
    },
    methods: {
      request,
      post(url, data, config) {
        return this.request({ ...config, method: 'POST', url, data });
      },
      put(url, data, config) {
        return this.request({ ...config, method: 'PUT', url, data });
      },
      patch(url, data, config) {
        return this.request({ ...config, method: 'PATCH', url, data });
      },
      delete: function del(url, config) {
        return this.request({ ...config, method: 'DELETE', url });
      }
    }
  };
};
