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
import Vue from 'vue';

const REQUEST_METHODS = ['get', 'post', 'delete'];
const DELAY_AFTER_RESPONSES = 100;

// Sets Vue.prototype.$http to a mock.
export function setHttp(respond) {
  const http = () => respond();
  for (const method of REQUEST_METHODS)
    http[method] = respond;
  http.defaults = {
    headers: {
      common: {}
    }
  };
  const previous = Vue.prototype.$http;
  Vue.prototype.$http = http;
  return previous;
}

class MockHttp {
  constructor() {
    this._responses = [];
    this._beforeRequests = null;
  }

  beforeRequests(callback) {
    this._beforeRequests = () => callback();
    return this;
  }

  respondWithData(data) {
    this._responses.push(data);
    return this;
  }

  // Returns a function that responds with each of the specified responses in
  // turn, then restores Vue.prototype.$http to its previous value.
  _respond() {
    return () => {
      const response = this._responses.shift();
      if (this._responses.length === 0)
        Vue.prototype.$http = this._previousHttp;
      return Promise.resolve({ data: response });
    };
  }

  _waitForResponsesToBeProcessed() {
    // We may need to make this more robust at some point, using something more
    // than setTimeout.
    return new Promise(resolve => setTimeout(resolve, DELAY_AFTER_RESPONSES));
  }

  afterResponses(callback) {
    if (this._beforeRequests == null)
      throw new Error('call to beforeRequests() required');
    if (this._responses.length !== 0)
      this._previousHttp = setHttp(this._respond());
    // Invoke the callback specified to beforeRequests(). The callback should
    // consume the responses specified to respondWithData().
    const result = this._beforeRequests();
    return this._waitForResponsesToBeProcessed().then(() => callback(result));
  }
}

// Alias methods.
MockHttp.prototype.beforeRequest = MockHttp.prototype.beforeRequests;
MockHttp.prototype.afterResponse = MockHttp.prototype.afterResponses;

export default function mockHttp() {
  return new MockHttp();
}
