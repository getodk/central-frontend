/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
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
*/

import axios from 'axios';

// Returns true if the most recent request is in progress and false if not.
function awaitingResponse() {
  return this.requestId != null;
}

const logError = (error) => {
  if (error.response)
    console.log(error.response.data); // eslint-disable-line no-console
  else if (error.request)
    console.log(error.request); // eslint-disable-line no-console
  else
    console.log('Error', error.message); // eslint-disable-line no-console
};

const alertMessage = (error) => {
  if (error.response == null || error.response.data == null ||
    error.response.data.message == null)
    return 'Something went wrong.';
  return error.response.data.message;
};

const throwErrorForIdMismatch = (actual, expected) => {
  if (actual !== expected)
    throw new Error(`ignoring response to request ${expected}: current request ID is ${actual}`);
};

function request(config) {
  const id = this.requestId != null ? this.requestId + 1 : 0;
  this.requestId = id;
  return axios(config)
    .catch(error => {
      throwErrorForIdMismatch(this.requestId, id);
      this.requestId = null;
      logError(error);
      if ('alert' in this) this.alert('danger', alertMessage(error));
      throw error;
    })
    .then(response => {
      throwErrorForIdMismatch(this.requestId, id);
      this.requestId = null;
      return response.data;
    });
}

function get(url, config) {
  const fullConfig = Object.assign({}, config, { method: 'get', url });
  return this.request(fullConfig);
}

function post(url, data, config) {
  const fullConfig = Object.assign({}, config, { method: 'post', url, data });
  return this.request(fullConfig);
}

export default {
  computed: { awaitingResponse },
  methods: { request, get, post }
};
