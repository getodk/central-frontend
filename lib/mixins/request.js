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
request is made, any response to a previous request is ignored. For concurrent
requests, the mixin only reacts to responses to the most recent set of
concurrent requests: see requestAll().

The including component must define the following data property:

  - requestId. If no request has been made or if the most recent request or set
    of concurrent requests is complete, requestId is null. Otherwise, it holds
    an ID identifying the most recent request or set of concurrent requests.
    Initialize the property as null. The including component should not directly
    mutate this property after defining it.

The including component may also optionally define the following method:

  - problemToAlert(problem). If a request results in an error, the mixin shows
    an alert. By default, the alert message is the same as that of the ODK
    Central Backend Problem. However, if the including component has defined a
    problemToAlert() method, the mixin first passes the Problem to the method,
    which has the option to return a different message. If the method returns
    null or undefined, the default message is used.
*/

import { logRequestError } from '../util';

// Returns true if the most recent request is in progress and false if not.
function awaitingResponse() {
  return this.requestId != null;
}

const throwErrorForIdMismatch = (actual, expected) => {
  if (actual !== expected)
    throw new Error(`ignoring response to request ${expected}: current request ID is ${actual}`);
};

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

const onSuccessfulResponseOrResponses = (component, id) => (responseOrResponses) => {
  throwErrorForIdMismatch(component.requestId, id);
  return responseOrResponses;
};

const onErrorResponse = (component, id) => (error) => {
  throwErrorForIdMismatch(component.requestId, id);
  logRequestError(error);
  component.$alert().danger(alertMessage(component, error));
  throw error;
};

// Used for consecutive (not concurrent) requests.
function request(config) {
  const id = this.requestId != null ? this.requestId + 1 : 0;
  this.requestId = id;
  return this.$http.request(config)
    .catch(onErrorResponse(this, id))
    .then(onSuccessfulResponseOrResponses(this, id))
    .finally(() => {
      this.requestId = null;
    });
}

// Used for concurrent requests.
function requestAll(requests) {
  const id = this.requestId != null ? this.requestId + 1 : 0;
  this.requestId = id;
  return Promise.all(requests)
    .catch(onErrorResponse(this, id))
    .then(onSuccessfulResponseOrResponses(this, id))
    .finally(() => {
      this.requestId = null;
    });
}

function get(url, config) {
  return this.request({ ...config, method: 'get', url });
}

function post(url, data, config) {
  return this.request({ ...config, method: 'post', url, data });
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
      requestAll,
      get,
      post,
      patch,
      delete: del
    }
  };
};
