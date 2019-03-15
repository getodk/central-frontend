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

The component using the mixin must define the following data property:

  - requestId. If no request has been made or if the most recent request or set
    of concurrent requests is complete, requestId is `null`. Otherwise, it holds
    an ID identifying the most recent request or set of concurrent requests.
    Initialize the property as `null`. The component using the mixin should not
    directly mutate this property after defining it.

The component using the mixin may also optionally define the following method:

  - problemToAlert(problem). If a request results in an error, the mixin shows
    an alert. By default, the alert message is the same as that of the ODK
    Central Backend Problem. However, if the component using the mixin has
    defined a problemToAlert() method, the mixin first passes the Problem to the
    method, which has the option to return a different message. If the method
    returns `null` or `undefined`, the default message is used.
*/

import R from 'ramda';

import MaybeData from '../maybe-data';
import { logRequestError } from '../util';

// Returns true if the most recent request or set of concurrent requests is in
// progress and false if not.
function awaitingResponse() {
  return this.requestId != null;
}

const throwErrorForIdMismatch = (actual, expected) => {
  if (actual !== expected)
    throw new Error(`ignoring response to request ${expected}: current request ID is ${actual}`);
};

const alertMessage = (component, error) => {
  if (error.request == null)
    return 'Something went wrong: there was no request.';
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

const onErrorResponse = (component, requestId) => (error) => {
  throwErrorForIdMismatch(component.requestId, requestId);
  component.requestId = null; // eslint-disable-line no-param-reassign
  logRequestError(error);
  component.$alert().danger(alertMessage(component, error));
  throw error;
};

const onSuccessfulResponseOrResponses = (component, requestId) => (result) => {
  throwErrorForIdMismatch(component.requestId, requestId);
  component.requestId = null; // eslint-disable-line no-param-reassign
  return result;
};

// Used for consecutive (not concurrent) requests.
function request(config) {
  const id = this.requestId != null ? this.requestId + 1 : 0;
  this.requestId = id;
  return this.$http.request(config)
    .catch(onErrorResponse(this, id))
    .then(onSuccessfulResponseOrResponses(this, id));
}

// Used for concurrent requests.
function requestAll(requests) {
  const id = this.requestId != null ? this.requestId + 1 : 0;
  this.requestId = id;
  return Promise.all(requests)
    .catch(onErrorResponse(this, id))
    .then(onSuccessfulResponseOrResponses(this, id));
}

function get(url, config) {
  return this.request({ ...config, method: 'get', url });
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

function maybeGet(options) {
  const entries = Object.entries(options);
  if (entries.length === 0) throw new Error('invalid options');

  const id = this.requestId != null ? this.requestId + 1 : 0;
  this.requestId = id;

  let responseCount = 0;
  let firstError = true;
  for (const entry of entries) {
    const [prop, { url, extended = false, transform = R.identity }] = entry;
    this[prop] = MaybeData.awaiting();
    const headers = {};
    if (extended) headers['X-Extended-Metadata'] = 'true';
    this.$http.get(url, { headers })
      .catch(error => { // eslint-disable-line no-loop-func
        throwErrorForIdMismatch(this.requestId, id);

        logRequestError(error);
        if (firstError) this.$alert().danger(alertMessage(this, error));

        this[prop] = MaybeData.error();
        responseCount += 1;
        // We reset this.requestId in the same tick that we set this[prop] so
        // that this[prop] remains in sync with this.requestId (and
        // this.awaitingResponse).
        if (responseCount === entries.length) this.requestId = null;

        firstError = false;
        throw error;
      })
      .then(({ data }) => { // eslint-disable-line no-loop-func
        throwErrorForIdMismatch(this.requestId, id);

        this[prop] = MaybeData.success(transform(data));
        responseCount += 1;
        if (responseCount === entries.length) this.requestId = null;
      })
      // This catch will be triggered if there was an axios error, including for
      // an error response, or if there was a request ID mismatch.
      .catch(() => {});
  }
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
      put,
      patch,
      delete: del,
      maybeGet
    }
  };
};
