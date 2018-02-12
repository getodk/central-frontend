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
  Vue.prototype.$http = http;
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
    previousPromise = null,
    component = null,
    mount = null,
    request = null,
    responses = [],
    beforeEachResponse = null
  ) {
    this._previousPromise = previousPromise;
    // The mounted component (if any)
    this._component = component;

    this._mount = mount;
    this._request = request;
    this._responses = responses;
    this._beforeEachResponse = beforeEachResponse;
  }

  //////////////////////////////////////////////////////////////////////////////
  // REQUESTS

  mount(component, options = {}) {
    if (this._previousPromise != null)
      throw new Error('cannot mount component after first series in chain');
    const mount = () => avoriazMount(component, options);
    return new MockHttp(
      this._previousPromise,
      this._component,
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
      this._previousPromise,
      this._component,
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
      this._previousPromise,
      this._component,
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
      this._previousPromise,
      this._component,
      this._mount,
      this._request,
      this._responses,
      beforeEachResponse
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // COMPLETE SERIES

  afterResponses(callback) {
    if (this._mount == null && this._request == null)
      throw new Error('mount() and/or request() required');
    const request = this._request != null ? () => this._request(this._component) : null;
    const promise = this._setHttpAndMount()
      .then(request)
      .then(() => this._waitForResponsesToBeProcessed())
      .finally(() => this._restoreHttp())
      .then(() => this._checkStateAfterResponses())
      .then(() => callback(this._component));
    return new MockHttp(promise, this._component);
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
  // turn.
  _http() {
    let responseIndex = 0;
    return () => {
      if (responseIndex === this._responses.length - 1)
        this._responseWithoutRequest = false;
      else if (responseIndex === this._responses.length) {
        this._requestWithoutResponse = true;
        return Promise.reject(new Error());
      }

      const response = this._responses[responseIndex];
      responseIndex += 1;
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

  _setHttp() {
    // Properties used by this._http() and for validation after the responses
    this._requestWithoutResponse = false;
    this._responseWithoutRequest = this._responses.length !== 0;
    this._errorFromBeforeEachResponse = null;

    this._previousHttp = Vue.prototype.$http;
    setHttp(this._http());
  }

  _setHttpAndMount() {
    if (this._previousPromise == null) {
      // There is no previous promise, so this block can be synchronous.
      this._setHttp();
      // We need this to be synchronous, because in afterResponses(), we pass
      // this._component synchronously to the next series in the chain.
      if (this._mount != null) this._component = this._mount();
      return Promise.resolve();
    }
    return this._previousPromise.then(() => this._setHttp());
  }

  _waitForResponsesToBeProcessed() {
    // We may need to make this more robust at some point, using something more
    // than setTimeout.
    return new Promise(resolve => setTimeout(resolve, 50));
  }

  _restoreHttp() { Vue.prototype.$http = this._previousHttp; }

  _checkStateAfterResponses() {
    if (this._errorFromBeforeEachResponse != null)
      throw this._errorFromBeforeEachResponse;
    else if (this._requestWithoutResponse)
      throw new Error('request without response: no response specified for request');
    else if (this._responseWithoutRequest)
      throw new Error('response without request: not all responses were requested');
  }

  //////////////////////////////////////////////////////////////////////////////
  // PROMISE METHODS

  promise() {
    const anySpecification = this._mount != null || this._request != null ||
      this._responses.length !== 0 || this._beforeEachResponse != null;
    if (anySpecification) return this.complete()._previousPromise;
    return this._previousPromise != null
      ? this._previousPromise
      : Promise.resolve();
  }

  // The inclusion of these methods means that we can return a MockHttp to Mocha
  // in lieu of a Promise.
  then(p1, p2) { return this.promise().then(p1, p2); }
  catch(onRejected) { return this.promise().catch(onRejected); }
  finally(onFinally) { return this.promise().finally(onFinally); }
}

export default () => new MockHttp();
