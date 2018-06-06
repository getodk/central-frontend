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
This mixin is used to send HTTP requests. The mixin only reacts to a response to
the most recent request: once a new request is made, any response to a previous
request is ignored. The including component must define the following property
in data():

  - requestId. Equals null if no request has been made or if the most recent
    request is complete, otherwise holds an ID identifying the most recent
    request. Initialize the property as null.

The including component should not directly mutate this property after defining
it.

If the including component also includes the alert mixin, it may optionally
define the following method:

  - problemToAlert(problem). If the request results in an error, the request
    mixin displays an alert. By default, the alert message is the same as that
    of the ODK Central Backend Problem. However, if the including component has
    defined a problemToAlert() method, the mixin first passes the Problem to the
    method, which has the option to return a different message. If the method
    returns null or undefined, the default message is used.
*/

import alert from './alert';
import { logRequestError } from '../util';

// Returns true if the most recent request is in progress and false if not.
function awaitingResponse() {
  return this.requestId != null;
}

const alertMessage = (component, error) => {
  if (error.response == null)
    return 'Something went wrong: there was no response to your request.';
  const problem = error.response.data;
  if (problem == null || problem.code == null || problem.message == null)
    return 'Something went wrong: the server returned an invalid error.';
  const componentMessage = component.problemToAlert != null
    ? component.problemToAlert(problem)
    : null;
  return componentMessage != null ? componentMessage : problem.message;
};

const throwErrorForIdMismatch = (actual, expected) => {
  if (actual !== expected)
    throw new Error(`ignoring response to request ${expected}: current request ID is ${actual}`);
};

function request(config) {
  const id = this.requestId != null ? this.requestId + 1 : 0;
  this.requestId = id;
  return this.$http.request(config)
    .catch(error => {
      throwErrorForIdMismatch(this.requestId, id);
      this.requestId = null;
      logRequestError(error);
      if ('alert' in this) this.alert = alert.danger(alertMessage(this, error));
      throw error;
    })
    .then(response => {
      throwErrorForIdMismatch(this.requestId, id);
      this.requestId = null;
      return response;
    });
}

function get(url, config) {
  return this.request({ ...config, method: 'get', url });
}

function post(url, data, config) {
  // eslint-disable-next-line object-curly-newline
  return this.request({ ...config, method: 'post', url, data });
}

function patch(url, data, config) {
  // eslint-disable-next-line object-curly-newline
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
      get,
      post,
      patch,
      delete: del
    }
  };
};
