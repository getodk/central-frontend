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
The most common way to send a request is using requestData. After that, the next
most common way is to use the useRequest() composable. A component may call
useRequest() if it needs to send a request that will not modify requestData. It
is rare for useRequest() to be used for a GET request: requestData is usually
preferred.

useRequest() returns an object with two properties: request() and
awaitingResponse. request() is a function that sends a request and returns a
promise. awaitingResponse is a ref whose value is `true` if the component has
called request() and the resulting request is in progress; its value is `false`
if not.

Because awaitingResponse stores a single boolean, useRequest() is not set up to
support concurrent requests from a single component. It is the component's
responsibility to ensure that the user is not able to send concurrent requests,
for example, by disabling a submit button while a request is in progress.
Separate components can send concurrent requests, but a single component can
only send one request at a time.

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

      request({
        method: 'POST',
        url: '...',
        fulfillProblem: (problem) => problem.code === <some code>
      })
        .then(({ data }) => {
          if (!isProblem(data)) {
            // handle successful response
          } else {
            // handle specific Problem
          }
        })
        .catch(noop);

  - problemToAlert. If the request results in an error response, request() shows
    an alert. By default, the alert message is the same as that of the Backend
    Problem. However, if a function is specified for problemToAlert, request()
    passes the Problem to the function, which has the option to return a
    different message. If the function returns `null` or `undefined`, the
    Problem's message is used.

request() returns a promise. The promise will be rejected if the request is
invalid or results in an error response, or if the user navigates away from the
route that sent the request. Otherwise, the promise should be fulfilled.

If you call then() on the promise, note that the request will not be in progress
when the then() callback is run (awaitingResponse.value will be `false`). If you
call catch() on the promise, your logic should not assume that the request
resulted in an error response. Before the then() or catch() callback is run, Vue
will react to the change of awaitingResponse.value from `true` to `false`,
running watchers and updating the DOM.
*/

import { inject, readonly, ref, watch } from 'vue';

import { isProblem, logAxiosError, requestAlertMessage, withAuth, withHttpMethods } from '../util/request';

const _request = (container, awaitingResponse) => (config) => {
  const { router, i18n, requestData, alert, http, logger } = container;
  const {
    fulfillProblem = undefined,
    problemToAlert = undefined,
    ...axiosConfig
  } = config;

  const { data } = axiosConfig;
  // This limit is set in the nginx config. The alert also mentions this number.
  if (data != null && data instanceof File && data.size > 100000000) {
    alert.danger(i18n.t('mixin.request.alert.fileSize', { name: data.name }));
    return Promise.reject(new Error('file size exceeds limit'));
  }

  // eslint-disable-next-line no-param-reassign
  awaitingResponse.value = true;

  // `router` may be `null` in testing.
  const initialRoute = router != null ? router.currentRoute.value : null;
  return http.request(withAuth(axiosConfig, requestData.session.token))
    .catch(error => {
      if (router != null && router.currentRoute.value !== initialRoute)
        throw new Error('route change');

      if (fulfillProblem != null && error.response != null &&
        isProblem(error.response.data) && fulfillProblem(error.response.data))
        return error.response;

      // eslint-disable-next-line no-param-reassign
      awaitingResponse.value = false;

      logAxiosError(logger, error);
      alert.danger(requestAlertMessage(i18n, error, problemToAlert));
      throw error;
    })
    .then(response => {
      if (router != null && router.currentRoute.value !== initialRoute)
        throw new Error('route change');
      // eslint-disable-next-line no-param-reassign
      awaitingResponse.value = false;

      return response;
    });
};

export default () => {
  const container = inject('container');
  const awaitingResponse = ref(false);
  const request = withHttpMethods(_request(container, awaitingResponse));

  const { router } = container;
  // `router` may be `null` in testing.
  if (router != null)
    watch(router.currentRoute, () => { awaitingResponse.value = false; });

  return { request, awaitingResponse: readonly(awaitingResponse) };
};
