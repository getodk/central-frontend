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
This mixin is used to send HTTP requests. When consecutive requests are made,
the mixin only reacts to a response to the most recent request: once a new
request is made, any response to a previous request is ignored.

The component using the mixin must define the following data property:

  - requestId. If no request has been made or if the most recent request is
    complete, requestId is `null`. Otherwise, it holds an ID identifying the
    most recent request. Initialize the property as `null`. The component using
    the mixin should not directly mutate this property after defining it.

The component using the mixin may also optionally define the following method:

  - problemToAlert(problem). If a request results in an error, the mixin shows
    an alert. By default, the alert message is the same as that of the ODK
    Central Backend Problem. However, if the component using the mixin has
    defined a problemToAlert() method, the mixin first passes the Problem to the
    method, which has the option to return a different message. If the method
    returns `null` or `undefined`, the default message is used.
*/

import Vue from 'vue';

import { configForPossibleBackendRequest, logAxiosError, requestAlertMessage } from '../util/request';

// Returns true if the most recent request is in progress and false if not.
function awaitingResponse() {
  return this.requestId != null;
}

const throwErrorForIdMismatch = (actual, expected) => {
  if (actual !== expected)
    throw new Error(`ignoring response to request ${expected}: current request ID is ${actual}`);
};

function request(config) {
  const id = this.requestId != null ? this.requestId + 1 : 0;
  this.requestId = id;
  const { token } = Vue.prototype.$session;
  return this.$http.request(configForPossibleBackendRequest(config, token))
    .catch(error => {
      throwErrorForIdMismatch(this.requestId, id);
      this.requestId = null;
      logAxiosError(error);
      const message = requestAlertMessage(error, this.problemToAlert);
      this.$alert().danger(message);
      throw error;
    })
    .then(result => {
      throwErrorForIdMismatch(this.requestId, id);
      this.requestId = null;
      return result;
    });
}

function post(url, data, config) {
  return this.request({ ...config, method: 'post', url, data });
}

function put(url, data, config) {
  return this.request({ ...config, method: 'put', url, data });
}

function patch(url, data, config) {
  return this.request({ ...config, method: 'patch', url, data });
}

function del(url, config) {
  return this.request({ ...config, method: 'delete', url });
}

export default () => { // eslint-disable-line arrow-body-style
  // @vue/component
  return {
    computed: { awaitingResponse },
    methods: {
      request,
      post,
      put,
      patch,
      delete: del
    }
  };
};
