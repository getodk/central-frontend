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
import { mount as avoriazMount } from 'avoriaz';

import Alert from '../lib/components/alert.vue';
import Spinner from '../lib/components/spinner.vue';

const REQUEST_METHODS = ['get', 'post', 'delete'];

// Sets Vue.prototype.$http to a mock.
export const setHttp = (respond) => {
  const http = (...args) => respond(...args);
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

class MockHttp {
  constructor(
    mount = null,
    request = null,
    responses = [],
    beforeEachResponse = null
  ) {
    this._mount = mount;
    this._request = request;
    this._responses = responses;
    this._beforeEachResponse = beforeEachResponse;
  }

  //////////////////////////////////////////////////////////////////////////////
  // REQUESTS

  mount(component, options = {}) {
    const mount = () => avoriazMount(component, options);
    return new MockHttp(
      mount,
      this._request,
      this._responses,
      this._beforeEachResponse
    );
  }

  request(callback) {
    // Wrap the callback in an arrow function so that when we call
    // this._request, the callback is not bound to the MockHttp.
    const request = (component) => callback(component);
    return new MockHttp(
      this._mount,
      request,
      this._responses,
      this._beforeEachResponse
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // RESPONSES

  respondWithData(data) {
    return this._respond(new SuccessfulResponse(data));
  }

  respondWithProblem(code = 500, message = 'There was a problem.') {
    return this._respond(new ProblemResponse(code, message));
  }

  _respond(response) {
    const responses = this._responses.concat(response);
    return new MockHttp(
      this._mount,
      this._request,
      responses,
      this._beforeEachResponse
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // BEFORE EACH

  beforeEachResponse(callback) {
    // Wrap the callback in an arrow function so that when we call
    // this._beforeEachResponse, the callback is not bound to the MockHttp.
    const beforeEachResponse = (component) => callback(component);
    return new MockHttp(
      this._mount,
      this._request,
      this._responses,
      beforeEachResponse
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // COMPLETE SERIES

  afterResponses(callback) {
    this._errorFromBeforeEachResponse = null;
    if (this._responses.length !== 0)
      this._previousHttp = setHttp(this._http());
    this._component = this._mount != null ? this._mount() : null;
    if (this._request != null) this._request(this._component);
    return this._waitForResponsesToBeProcessed()
      .then(() => new Promise((resolve, reject) => {
        const result = callback(this._component);
        if (this._errorFromBeforeEachResponse != null)
          reject(this._errorFromBeforeEachResponse);
        else
          resolve(result);
      }));
  }

  afterResponse(callback) { return this.afterResponses(callback); }
  complete() { return this.afterResponses(component => component); }

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

  _tryBeforeEachResponse() {
    if (this._beforeEachResponse == null) return;
    if (this._errorFromBeforeEachResponse != null) return;
    try {
      this._beforeEachResponse(this._component);
    } catch (e) {
      if (this._errorFromBeforeEachResponse == null)
        this._errorFromBeforeEachResponse = e;
    }
  }

  // Returns a function that responds with each of the specified responses in
  // turn, then restores Vue.prototype.$http to its previous value.
  _http() {
    let responseIndex = 0;
    return () => {
      const response = this._responses[responseIndex];
      responseIndex += 1;
      if (responseIndex === this._responses.length)
        Vue.prototype.$http = this._previousHttp;
      // Wait a tick after request() or the previous response so that Vue is
      // updated before this._beforeEachResponse() is called.
      return Vue.nextTick()
        .then(() => this._tryBeforeEachResponse())
        .then(() => new Promise((resolve, reject) => {
          const settle = response.isSuccess() ? resolve : reject;
          settle(response.response());
        }));
    };
  }

  _waitForResponsesToBeProcessed() {
    // We may need to make this more robust at some point, using something more
    // than setTimeout.
    return new Promise(resolve => setTimeout(resolve, 50));
  }

  //////////////////////////////////////////////////////////////////////////////
  // PROMISE METHODS

  // The inclusion of these methods means that we can return a MockHttp to Mocha
  // in lieu of a Promise.
  then(p1, p2) { return this.complete().then(p1, p2); }
  catch(onRejected) { return this.complete().catch(onRejected); }
  finally(onFinally) { return this.complete().finally(onFinally); }
}

export default () => new MockHttp();
