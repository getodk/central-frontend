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
The most common way to send a request is by using requestData. After that, the
next most common way is to use the useRequest() composable here. A component can
call useRequest() if it needs to send a request that will not modify
requestData. It is rare for useRequest() to be used for a GET request:
requestData is usually preferred.

useRequest() returns an object with two properties: request() and
awaitingResponse. request() is a function that sends a request and returns a
promise. awaitingResponse is a ref with a boolean value that indicates whether
the latest request from the component is currently in progress.

useRequest() can be used to send concurrent requests. However, awaitingResponse
only provides information about the latest request.

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

If you call then() or catch() on the promise, note that the request will not be
in progress when the callback is run. That means that awaitingResponse.value
will be `false` unless the component has sent a newer, additional request.
Before the callback is run, Vue will react to the change of
awaitingResponse.value from `true` to `false`, running watchers and updating the
DOM.

If you call catch() on the promise, your logic should not assume that the
request resulted in an error response. In many cases, it is possible that the
user simply navigated away from the route.
*/

import { inject, readonly, ref, watch } from 'vue';

import { isProblem, logAxiosError, requestAlertMessage, withAuth, withHttpMethods } from '../util/request';

const _request = (container, awaitingResponse) => (config) => {
  const { router, i18n, requestData, alert, http, logger } = container;
  const {
    fulfillProblem = undefined,
    problemToAlert = undefined,
    alert: alertOption = true,
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

      if (alertOption) {
        logAxiosError(logger, error);
        alert.danger(requestAlertMessage(i18n, error, problemToAlert));
      }
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
