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
This mixin is used to send POST, PUT, PATCH, and DELETE requests. For GET
requests, use $store.dispatch('get').

The request mixin assumes that no single component sends concurrent requests. It
is the component's responsibility to ensure that the user is not able to send
concurrent requests, for example, by disabling a submit button while a request
is in progress. Separate components can send concurrent requests, but any single
component can only send one request at a time.

The mixin factory does not take any options.

The component using this mixin may optionally define the following data
property:

  - awaitingResponse. `true` if a request is in progress and `false` if not.
    Initialize the property as `false`. The component using the mixin should not
    directly mutate this property after defining it.
*/

import { isProblem, logAxiosError, requestAlertMessage, withAuth } from '../util/request';

/*
request() accepts all the options that axios.request() does. It also accepts the
following options:

  - fulfillProblem. Usually, an error response means that the request was
    invalid or that something went wrong. However, in some cases, an error
    response should be treated as if it is successful, resulting in a fulfilled,
    not a rejected, promise. Use fulfillProblem to identify such responses.
    fulfillProblem is passed the Backend Problem. (Any error response that is
    not a Problem is automatically considered unsuccessful.) fulfillProblem
    should return `true` if the response is considered successful and `false` if
    not. The response can then be handled in a then() callback. For example:

      this.request({
        method: 'POST',
        url: '...',
        fulfillProblem: (problem) => problem.code === <some code>
      })
        .then(({ data }) => {
          if (!isProblem(data)) {
            // success
          } else {
            // respond to specific problem
          }
        })
        .catch(noop);

  - problemToAlert. If the request results in an error response, request() shows
    an alert. By default, the alert message is the same as that of the Backend
    Problem. However, if a function is specified for problemToAlert, request()
    passes the Problem to the function, which has the option to return a
    different message. If the function returns `null` or `undefined`, the
    Problem's message is used.

Return Value
------------

request() returns a promise. The promise will be rejected if the request is
invalid or results in an error response or if the user navigates away from the
route that sent the request. Otherwise the promise should be fulfilled.

If you call then() on the promise, note that the request will not be in progress
when the then() callback is run (awaitingResponse will equal `false`). If you
call catch() on the promise, your logic should not assume that the request
resulted in an error response. Before the then() or catch() callback is run, Vue
will react to the change in awaitingResponse from `true` to `false`, running
watchers and updating the DOM.
*/
function request({
  fulfillProblem = undefined,
  problemToAlert = undefined,
  ...axiosConfig
}) {
  const { requestData, alert, http, logger } = this.container;

  const { data } = axiosConfig;
  // This limit is set in the nginx config. The alert also mentions this number.
  if (data != null && data instanceof File && data.size > 100000000) {
    alert.danger(this.$t('mixin.request.alert.fileSize', { name: data.name }));
    return Promise.reject(new Error('file size exceeds limit'));
  }

  if (this.awaitingResponse != null) this.awaitingResponse = true;

  const initialRoute = this.$route;
  return http.request(withAuth(axiosConfig, requestData.session.token))
    .catch(error => {
      // this.$route seems to be defined even after the component has been
      // unmounted.
      if (this.$route !== initialRoute) throw new Error('route change');

      if (fulfillProblem != null && error.response != null &&
        isProblem(error.response.data) && fulfillProblem(error.response.data))
        return error.response;

      if (this.awaitingResponse != null) this.awaitingResponse = false;

      logAxiosError(logger, error);
      alert.danger(requestAlertMessage(this.$i18n, error, problemToAlert));
      throw error;
    })
    .then(response => {
      if (this.$route !== initialRoute) throw new Error('route change');
      if (this.awaitingResponse != null) this.awaitingResponse = false;

      return response;
    });
}

// @vue/component
const mixin = {
  inject: ['container'],
  watch: {
    $route() {
      if (this.awaitingResponse != null) this.awaitingResponse = false;
    }
  },
  methods: {
    request,
    post(url, data = undefined, config = undefined) {
      const full = { ...config, method: 'POST', url };
      if (data != null) full.data = data;
      return this.request(full);
    },
    put(url, data, config = undefined) {
      return this.request({ ...config, method: 'PUT', url, data });
    },
    patch(url, data, config = undefined) {
      return this.request({ ...config, method: 'PATCH', url, data });
    },
    delete(url, config = undefined) {
      return this.request({ ...config, method: 'DELETE', url });
    }
  }
};

export default () => mixin;
