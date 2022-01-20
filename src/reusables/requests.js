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
A component that sends a request may use this composable/mixin, which includes
related helper functions/methods:

  - request()
  - get()
  - post()
  - patch()
  - put()
  - delete()

The request() function/method of the composable/mixin calls the request()
function in src/util/request.js and accepts all the same options. By default,
it will specify `true` for abortAfterNavigate if the request is not a GET
request.

If the component is sending a request that will modify requestData, it should
probably use requestData to send the request instead.

awaitingResponse
----------------

A component using the mixin may optionally define a data property named
awaitingResponse. awaitingResponse will be `true` if a request is in progress
and `false` if not. Initialize the property as `false`. The component using the
mixin should not directly mutate the property after defining it.

Similarly, the composable returns an object whose awaitingResponse property is
a ref that is `true` if a request is in progress and `false` if not.

In both cases, awaitingResponse assumes that the component will not send
multiple, concurrent requests. If a component uses awaitingResponse, it is the
component's responsibility to ensure that the user is not able to send
multiple, concurrent requests, for example, by disabling a submit button while a
request is in progress.

Each function/method of the composable/mixin returns a promise. If you call
then() on the promise, note that the request will not be in progress when the
then() callback is run: awaitingResponse will be `false`. Before the then() or
catch() callback is run, Vue will react to the change in awaitingResponse from
`true` to `false`, running watchers and updating the DOM. Often that is
perfectly fine. However, if you must run a callback in the same tick in which
awaitingResponse is set to `false`, you can do so by specifying the callback to
the function/method using the onSuccess or onError option.
*/

import { map } from 'ramda';
import { ref } from 'vue';

import { noop } from '../util/util';
import { request } from '../util/request';

// @vue/component
export const mixinRequests = {
  inject: ['requestData', 'alert'],
  methods: {
    async request(config) {
      if (typeof config === 'string') return this.request({ url: config });
      const { onSuccess = noop, ...requestConfig } = config;

      if (this.awaitingResponse != null) this.awaitingResponse = true;

      if (requestConfig.abortAfterNavigate == null) {
        const { method = 'GET' } = requestConfig;
        requestConfig.abortAfterNavigate = method !== 'GET';
      }

      const { onError = noop } = requestConfig;
      requestConfig.onError = () => {
        if (this.awaitingResponse != null) this.awaitingResponse = false;
        onError();
      };

      const response = await request(this.container, this.$i18n, requestConfig);
      if (this.awaitingResponse != null) this.awaitingResponse = false;
      onSuccess(response);
      return response;
    },
    get(url, config = undefined) {
      return this.request({ ...config, method: 'GET', url });
    },
    post(url, data = undefined, config = undefined) {
      const fullConfig = { ...config, method: 'POST', url };
      if (data != null) fullConfig.data = data;
      return this.request(fullConfig);
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

export const useRequests = (container, i18n = container.i18n) => {
  const awaitingResponse = ref(false);
  const obj = {
    container,
    $i18n: i18n,
    get awaitingResponse() { return awaitingResponse.value; },
    set awaitingResponse(value) { awaitingResponse.value = value; },
    ...mixinRequests.methods
  };
  const result = map((f) => f.bind(obj), mixinRequests.methods);
  result.awaitingResponse = awaitingResponse;
  return result;
};
