import Vue from 'vue';

import App from '../lib/components/app.vue';
import Spinner from '../lib/components/spinner.vue';
import testData from './data';
import { beforeEachNav } from './router';
import { mountAndMark } from './destroy';
import { router, routerState } from '../lib/router';
import { trigger } from './util';



////////////////////////////////////////////////////////////////////////////////
// setHttp()

// Sets Vue.prototype.$http to a mock.
export const setHttp = (respond) => {
  const http = (config) => respond(config);
  http.request = http;
  http.get = (url, config) => http({ ...config, method: 'get', url });
  http.post = (url, data, config) => http({ ...config, method: 'post', url, data });
  http.patch = (url, data, config) => http({ ...config, method: 'patch', url, data });
  http.delete = (url, config) => http({ ...config, method: 'delete', url });
  http.defaults = {
    headers: {
      common: {}
    }
  };
  Vue.prototype.$http = http;
};



////////////////////////////////////////////////////////////////////////////////
// mockHttp()

/*
MockHttp mocks a series of request-response cycles. It allows you to mount a
component, specify one or more requests, then examine the component once the
responses to the requests have been processed.

First, specify a component to mount. Some components will send a request after
being mounted, for example:

  mockHttp()
    .mount(UserList)

Other components will not send a request. Specify a request after mounting the
component:

  mockHttp()
    // Redirects to login: no request.
    .mount(App)
    // Requests the user list.
    .request(component => {
      mockLogin();
      component.vm.$router.push('/users');
    })

If you already have a mounted component, you can skip mockHttp().mount():

  const component = mount(App);

  ...

  mockHttp()
    .request(() => {
      mockLogin();
      component.vm.$router.push('/users');
    })

  ...

  // Destroy component.

The important thing is that you call either mount() or request() (or both).

After specifying the request, specify the response as a callback:

  mockHttp()
    .mount(UserList)
    .respondWithData(() => testData.administrators.sorted())

Sometimes, mount() and/or request() will send more than one request. Simply
specify all the responses, in order:

  mockHttp()
    .mount(App)
    .request(submitLoginForm)
    .respondWithData(() => testData.sessions.createNew())
    .respondWithData(() => testData.administrators.first())

In rare cases, you may know that mount() and/or request() will not send any
request. For example, that's true for some uses of mockRoute(). In that case,
simply do not specify a response. What is important is that the number of
requests matches the number of responses.

After specifying requests and responses, you can examine the state of the
component once the responses have been processed:

  mockHttp()
    .mount(FormList)
    .respondWithData(() => testData.extendedForms.createPast(3).sorted())
    .afterResponse(component => {
      component.find('table tbody tr').length.should.equal(3);
    })

It is not until afterResponse() that the component is actually mounted and the
request() callback is invoked. afterResponse() mounts the component, runs the
request() callback, waits for the responses to be processed, then finally runs
its own callback, thereby completing the series of request-response cycles.

After afterResponse(), you can call any Promise method:

  mockHttp()
    .mount(FormList)
    .respondWithData(() => testData.extendedForms.createPast(3))
    .afterResponse(component => {
      component.find('table tbody tr').length.should.equal(3);
    })
    .then(() => console.log('table has 3 rows'))
    .catch(() => console.log('there was an error'))

Alternatively, you can follow the series with a new series of request-response
cycles: series can be chained. For example:

  mockHttp()
    .mount(App)
    .request(component => {
      mockLogin();
      component.vm.$router.push('/forms');
    })
    .respondWithData(() => testData.extendedForms.createPast(3))
    .afterResponse(component => {
      component.find('table tbody tr').length.should.equal(3);
    })
    .complete()
    .request(component => component.vm.$router.push('/users/field-keys'))
    .respondWithData(() => testData.extendedFieldKeys.createPast(4))
    .afterResponse(component => {
      component.find('table tbody tr').length.should.equal(4);
    })

Notice how the mounted component is passed to each request() and afterResponse()
callback, even in the second series.
*/

const statusIs2xx = (status) => status >= 200 && status < 300;

class MockHttp {
  constructor({
    previousPromise = null,
    route = null,
    beforeEachNavGuard = null,
    mount = null,
    request = null,
    responses = [],
    beforeEachResponse = null
  } = {}) {
    // State from the previous series of request-response cycles (if any)
    // Promise from the previous series, used to chain series.
    this._previousPromise = previousPromise;

    // State specific to the current series of request-response cycles
    this._route = route;
    this._beforeEachNavGuard = beforeEachNavGuard;
    this._mount = mount;
    this._request = request;
    // Array of response callbacks
    this._responses = responses;
    this._beforeEachResponse = beforeEachResponse;
  }

  _with(options) {
    return new MockHttp({
      previousPromise: this._previousPromise,
      route: this._route,
      beforeEachNavGuard: this._beforeEachNavGuard,
      mount: this._mount,
      request: this._request,
      responses: this._responses,
      beforeEachResponse: this._beforeEachResponse,
      ...options
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  // ROUTING

  route(location, mountOptions = {}) {
    if (this._route != null)
      throw new Error('cannot call route() more than once in a single chain');
    if (this._mount != null)
      throw new Error('cannot call both route() and mount() in a single chain');
    if (this._request != null)
      throw new Error('cannot call both route() and request() in a single chain');
    if (this._previousPromise != null)
      throw new Error('cannot route after first series in chain');
    const route = location;
    const mount = () => mountAndMark(App, { ...mountOptions, router });
    return this._with({ route, mount });
  }

  beforeEachNav(callback) {
    if (this._beforeEachNavGuard != null)
      throw new Error('cannot call beforeEachNav() more than once in a single chain');
    // Wrap the callback in an arrow function so that when we call
    // this._beforeEachNavGuard(), the callback is not bound to the MockHttp.
    const beforeEachNavGuard = (app, to, from) => callback(app, to, from);
    return this._with({ beforeEachNavGuard });
  }

  //////////////////////////////////////////////////////////////////////////////
  // OTHER REQUESTS

  mount(component, options = {}) {
    if (this._route != null)
      throw new Error('cannot call both route() and mount() in a single chain');
    if (this._mount != null)
      throw new Error('cannot call mount() more than once in a single chain');
    if (this._previousPromise != null)
      throw new Error('cannot mount component after first series in chain');
    return this._with({ mount: () => mountAndMark(component, options) });
  }

  // The callback may optionally return a Promise.
  request(callback) {
    if (this._route != null)
      throw new Error('cannot call both route() and request() in a single chain');
    if (this._request != null)
      throw new Error('cannot call request() more than once in a single series');
    // Wrap the callback in an arrow function so that when we call
    // this._request(), the callback is not bound to the MockHttp.
    return this._with({ request: (component) => callback(component) });
  }

  //////////////////////////////////////////////////////////////////////////////
  // RESPONSES

  respondWithData(callbackOrCallbacks) {
    if (Array.isArray(callbackOrCallbacks)) {
      return callbackOrCallbacks
        .reduce((acc, callback) => acc.respondWithData(callback), this);
    }
    return this._respond(() => ({
      status: 200,
      data: callbackOrCallbacks()
    }));
  }

  respondWithSuccess() {
    return this.respondWithData(() => ({
      status: 200,
      data: {
        success: true
      }
    }));
  }

  respondWithProblem(responseOrResponses) {
    if (Array.isArray(responseOrResponses)) {
      return responseOrResponses
        .reduce((acc, response) => acc.respondWithProblem(response), this);
    }
    if (responseOrResponses == null)
      return this.respondWithProblem(500);
    if (typeof responseOrResponses === 'number') {
      return this.respondWithProblem(() => ({
        code: responseOrResponses,
        message: 'There was a problem.'
      }));
    }
    return this._respond(() => {
      const error = new Error();
      const data = responseOrResponses();
      error.response = { status: Math.floor(data.code), data };
      return error;
    });
  }

  respondWithProblems(responseOrResponses) {
    return this.respondWithProblem(responseOrResponses);
  }

  restoreSession(restore) {
    if (!restore) return this.respondWithProblem(404.1);
    return this.respondWithData([
      () => testData.sessions.createNew(),
      () => testData.administrators.firstOrCreatePast()
    ]);
  }

  _respond(callback) {
    return this._with({ responses: [...this._responses, callback] });
  }

  //////////////////////////////////////////////////////////////////////////////
  // BEFORE EACH

  // Specifies a callback to run before each response is sent.
  beforeEachResponse(callback) {
    if (this._beforeEachResponse != null)
      throw new Error('cannot call beforeEachResponse() more than once in a single series');
    // Wrap the callback in an arrow function so that when we call
    // this._beforeEachResponse(), the callback is not bound to the MockHttp.
    const beforeEachResponse = (component) => callback(component);
    return this._with({ beforeEachResponse });
  }

  //////////////////////////////////////////////////////////////////////////////
  // COMPLETE SERIES

  /* afterResponses() specifies a callback to run after all responses have been
  processed. It returns a new MockHttp that can be used to follow this series
  with a new series of request-response cycles. The callback may return a
  Promise or a non-Promise value, but it should not send a request. To send
  another request after the responses have been processed, use the returned
  MockHttp. */
  afterResponses(callback) {
    if (this._mount == null && this._request == null)
      throw new Error('route(), mount(), and/or request() required');
    const request = this._request != null ? this._request : () => {};
    const promise = this._initialPromise()
      .then(component => this._mountAndRoute(component))
      .then(component => Promise.resolve(request(component))
        .then(() => component))
      .then(component => this._waitForResponsesToBeProcessed()
        .then(() => component))
      .finally(() => this._restoreHttp())
      .then(component => {
        this._checkStateAfterWait();
        return component;
      })
      .then(component => Promise.resolve(callback(component))
        .then(result => ({ component, result })))
      .finally(() => {
        this._inProgress = false;
      });
    return new MockHttp({ previousPromise: promise });
  }

  afterResponse(callback) { return this.afterResponses(callback); }
  complete() { return this.afterResponses(component => component); }

  _initialPromise() {
    const promise = this._previousPromise != null
      ? this._previousPromise
      : Promise.resolve({});
    return promise.then(({ component }) => {
      this._inProgress = true;
      this._previousHttp = Vue.prototype.$http;
      setHttp(this._http());
      this._component = null;
      this._errorFromBeforeEachNav = null;
      this._errorFromBeforeEachResponse = null;
      this._requestWithoutResponse = false;
      this._responseWithoutRequest = this._responses.length !== 0;
      this._requestResponseLog = [];
      return component;
    });
  }

  // Returns a function that responds with each of the specified responses in
  // turn.
  _http() {
    let responseIndex = 0;
    return (config) => {
      const { validateStatus = statusIs2xx } = config;
      this._requestResponseLog.push(config);
      if (responseIndex === this._responses.length - 1)
        this._responseWithoutRequest = false;
      else if (responseIndex === this._responses.length) {
        this._requestWithoutResponse = true;
        return Promise.reject(new Error());
      }

      const responseCallback = this._responses[responseIndex];
      responseIndex += 1;
      // Wait a tick after _request() or the previous response so that Vue is
      // updated before _beforeEachResponse() is called.
      return Vue.nextTick()
        .then(() => this._tryBeforeEachResponse())
        .then(() => new Promise((resolve, reject) => {
          const result = responseCallback();
          const response = result instanceof Error ? result.response : result;
          this._requestResponseLog.push(response);
          try {
            if (validateStatus(response.status))
              resolve(response);
            else
              reject(result);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.log(`mockHttp(): a response threw an error:\n${e.stack}`);
            reject(e);
          }
        }));
    };
  }

  _tryBeforeEachResponse() {
    if (this._beforeEachResponse == null) return;
    if (this._errorFromBeforeEachResponse != null) return;
    /* Adding a try/catch block here even though _beforeEachResponse() is called
    within a promise chain, because the promise is not returned to Mocha, but
    rather to the app itself from $http. We want to eventually return a rejected
    promise to Mocha, but we want to return the specified response to the app
    regardless of whether _beforeEachResponse() throws an error. */
    try {
      this._beforeEachResponse(this._component);
    } catch (e) {
      this._errorFromBeforeEachResponse = e;
    }
  }

  _mountAndRoute(previousComponent) {
    return new Promise((resolve, reject) => {
      if (this._route == null) {
        if (this._previousPromise != null)
          this._component = previousComponent;
        else if (this._mount != null)
          this._component = this._mount();
        resolve(this._component);
      } else {
        router.push(
          // Navigate to a page that will not send a request.
          '/_mountAndRoute',
          () => {
            this._component = this._mount();
            routerState.anyNavigationTriggered = false;
            if (this._beforeEachNavGuard != null) {
              beforeEachNav((to, from) => {
                if (!this._inProgress || this._errorFromBeforeEachNav != null)
                  return;
                try {
                  this._beforeEachNavGuard(this._component, to, from);
                } catch (e) {
                  this._errorFromBeforeEachNav = e;
                }
              });
            }
            // The onAbort callback seems to be called when the initial
            // navigation is aborted, even if a navigation is ultimately
            // confirmed. Here, we examine the router state to determine whether
            // a navigation was ultimately confirmed.
            const onAbort = () => Vue.prototype.$nextTick(() => {
              if (routerState.lastNavigationWasConfirmed)
                resolve(this._component);
              else
                reject(new Error('last navigation was not confirmed'));
            });
            router.push(this._route, () => resolve(this._component), onAbort);
          },
          () => reject(new Error('navigation aborted'))
        );
      }
    });
  }

  _waitForResponsesToBeProcessed() {
    // setTimeout(resolve) calls `resolve` after pending promises settle.
    // https://vue-test-utils.vuejs.org/en/guides/testing-async-components.html
    return new Promise(resolve => setTimeout(resolve));
  }

  _restoreHttp() {
    // If this._previousPromise was rejected, the current series did not set
    // $http. In that case, this._inProgress will be falsy.
    if (this._inProgress) Vue.prototype.$http = this._previousHttp;
  }

  _checkStateAfterWait() {
    if (this._errorFromBeforeEachNav != null) {
      console.log('beforeEachNav() error:'); // eslint-disable-line no-console
      throw this._errorFromBeforeEachNav;
    }
    if (this._errorFromBeforeEachResponse != null) {
      // eslint-disable-next-line no-console
      console.log('beforeEachResponse() error:');
      throw this._errorFromBeforeEachResponse;
    }
    if (this._requestWithoutResponse || this._responseWithoutRequest) {
      console.log('request/response log:'); // eslint-disable-line no-console
      if (this._requestResponseLog.length === 0)
        console.log('(empty)'); // eslint-disable-line no-console
      else {
        for (const entry of this._requestResponseLog)
          console.log(entry); // eslint-disable-line no-console
      }
      if (this._requestWithoutResponse)
        throw new Error('request without response: no response specified for request');
      else
        throw new Error('response without request: not all responses were requested');
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // COMMON TESTS

  // Tests standard button thinking things.
  standardButton(buttonSelector = 'button[type="submit"]') {
    const spinner = (button) => {
      const spinners = button.find(Spinner);
      if (spinners.length === 0) throw new Error('spinner not found');
      if (spinners.length > 1) throw new Error('multiple spinners found');
      return spinners[0];
    };
    return this
      .respondWithProblem()
      .beforeEachResponse(component => {
        const button = component.first(buttonSelector);
        button.getAttribute('disabled').should.be.ok();
        spinner(button).getProp('state').should.be.true();
        // There may end up being tests for which this assertion does not pass,
        // but for good reason. We will have to update the assertion if/when
        // that is the case.
        component.should.not.alert();
      })
      .afterResponse(component => {
        const button = component.first(buttonSelector);
        button.element.disabled.should.be.false();
        spinner(button).getProp('state').should.be.false();
        component.should.alert('danger');
      });
  }

  testRefreshButton(options) {
    // Options
    const normalizedOptions = this._testRefreshButtonOptions(options);
    const { collection, respondWithData, tableSelector } = normalizedOptions;

    // Data responses
    const dataCallbacks = [...respondWithData];
    // Create a new object before returning the first response.
    dataCallbacks[0] = () => {
      collection.createNew();
      const callback = respondWithData[0];
      return callback();
    };

    // Helper functions
    const testRowCount = (component) => {
      const tables = component.find(tableSelector);
      if (tables.length === 0) throw new Error('table not found');
      if (tables.length > 1) throw new Error('multiple tables found');
      const rowCount = tables[0].find('tbody tr').length;
      rowCount.should.equal(collection.size);
    };
    const clickRefreshButton = (component) =>
      trigger.click(component.first('.btn-refresh'));

    return this
      // Series 1: Test that the table is initially rendered as expected.
      .respondWithData(dataCallbacks)
      .afterResponses(testRowCount)
      // Series 2: Click the refresh button and return a successful response (or
      // responses). The table should not disappear during the refresh, and it
      // should be updated afterwards.
      .request(clickRefreshButton)
      .respondWithData(dataCallbacks)
      .beforeEachResponse(testRowCount)
      .afterResponses(testRowCount)
      // Series 3: Click the refresh button again, this time returning a problem
      // response (or responses).
      .request(clickRefreshButton)
      .respondWithProblems(new Array(respondWithData.length).fill(500))
      .afterResponses(component => {
        // The table should not disappear.
        testRowCount(component);
        component.should.alert();
      });
  }

  _testRefreshButtonOptions(options) {
    const { collection } = options;
    const defaults = {
      respondWithData: [() => collection.sorted()],
      tableSelector: 'table'
    };
    const normalizedOptions = { ...defaults, ...options };

    // respondWithData
    if (Array.isArray(normalizedOptions.respondWithData)) {
      if (normalizedOptions.respondWithData.length === 0)
        throw new Error('data response required');
    } else {
      normalizedOptions.respondWithData = [normalizedOptions.respondWithData];
    }

    return normalizedOptions;
  }

  //////////////////////////////////////////////////////////////////////////////
  // PROMISE METHODS

  promise() {
    const anySpecification = this._mount != null || this._request != null ||
      this._responses.length !== 0 || this._beforeEachResponse != null;
    if (!anySpecification && this._previousPromise == null)
      return Promise.resolve();
    const promise = anySpecification
      ? this.complete()._previousPromise
      : this._previousPromise;
    return promise.then(({ result }) => result);
  }

  // The inclusion of these methods means that we can return a MockHttp to Mocha
  // in lieu of a Promise.
  then(p1, p2) { return this.promise().then(p1, p2); }
  catch(onRejected) { return this.promise().catch(onRejected); }
  finally(onFinally) { return this.promise().finally(onFinally); }
}

export const mockHttp = () => new MockHttp();

// Deprecated. Use mockHttp().route().
export const mockRoute = (location, mountOptions = {}) =>
  mockHttp().route(location, mountOptions);
