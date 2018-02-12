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
import { mount } from 'avoriaz';

import Alert from '../lib/components/alert.vue';
import Spinner from '../lib/components/spinner.vue';

const REQUEST_METHODS = ['get', 'post', 'delete'];

// Sets Vue.prototype.$http to a mock.
export const setHttp = (respond) => {
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
};

class SuccessfulResponse {
  constructor(data) {
    this._response = { data };
  }

  isSuccess() { return true; }
  response() { return this._response; }
}

class ProblemResponse {
  constructor(code, message) {
    this._error = new Error();
    this._error.response = {
      data: {
        code,
        message
      }
    };
  }

  isSuccess() { return false; }
  response() { return this._error; }
}

const doNothing = () => {};

class MockHttp {
  constructor() {
    this._mountArgs = null;
    // The mounted component (if any)
    this._component = null;
    this._request = null;
    this._responses = [];
    this._errorFromBeforeEachResponse = null;
    this._beforeEachResponse = null;
  }

  mount(...args) {
    this._mountArgs = args;
    return this;
  }

  request(callback) {
    this._request = () => callback(this._component);
    return this;
  }

  respondWithData(data) {
    this._responses.push(new SuccessfulResponse(data));
    return this;
  }

  respondWithProblem(code = 500, message = 'There was a problem.') {
    this._responses.push(new ProblemResponse(code, message));
    return this;
  }

  beforeEachResponse(callback) {
    this._beforeEachResponse = () => {
      try {
        callback(this._component);
      } catch (e) {
        if (this._errorFromBeforeEachResponse == null)
          this._errorFromBeforeEachResponse = e;
      }
    };
    return this;
  }

  // Returns a function that responds with each of the specified responses in
  // turn, then restores Vue.prototype.$http to its previous value.
  _respond() {
    return () => {
      const response = this._responses.shift();
      if (this._responses.length === 0)
        Vue.prototype.$http = this._previousHttp;
      // Wait a tick after request() or the previous response so that Vue is
      // updated before this._beforeEachResponse() is called.
      return Vue.nextTick()
        .then(this._beforeEachResponse)
        .then(() => new Promise((resolve, reject) => {
          const settle = response.isSuccess() ? resolve : reject;
          settle(response.response());
        }));
    };
  }

  _waitForResponsesToBeProcessed() {
    // We may need to make this more robust at some point, using something more
    // than setTimeout.
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  afterResponses(callback) {
    if (this._responses.length !== 0)
      this._previousHttp = setHttp(this._respond());
    if (this._mountArgs != null) this._component = mount(...this._mountArgs);
    if (this._request != null) this._request();
    return this._waitForResponsesToBeProcessed()
      .then(() => new Promise((resolve, reject) => {
        const result = callback(this._component);
        if (this._errorFromBeforeEachResponse != null)
          reject(this._errorFromBeforeEachResponse);
        else
          resolve(result);
      }));
  }

  point() { return this.afterResponses(doNothing); }

  standardButton(buttonSelector) {
    return this
      .respondWithProblem()
      .beforeEachResponse(component => {
        const button = component.first(buttonSelector);
        button.getAttribute('disabled').should.be.ok();
        button.first(Spinner).getProp('state').should.be.true();
        const alert = component.first(Alert);
        alert.getProp('state').should.be.false();
      })
      .afterResponse(component => {
        const button = component.first(buttonSelector);
        button.element.disabled.should.be.false();
        button.first(Spinner).getProp('state').should.be.false();
        const alert = component.first(Alert);
        alert.getProp('state').should.be.true();
        alert.getProp('type').should.equal('danger');
      });
  }
}

// Alias method.
MockHttp.prototype.afterResponse = MockHttp.prototype.afterResponses;

export default () => new MockHttp();
