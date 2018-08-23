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

let inProgress = false;
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
    // If the current series follows a previous series of request-response
    // cycles, this._previousPromise is the promise from the previous series.
    // this._previousPromise is used to chain series.
    this._previousPromise = previousPromise;
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

  route(location) {
    if (this._route != null)
      throw new Error('cannot call route() more than once in a single series');
    return this._with({ route: location });
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
    if (this._mount != null)
      throw new Error('cannot call mount() more than once in a single chain');
    if (this._previousPromise != null)
      throw new Error('cannot call mount() after the first series in a chain');
    return this._with({ mount: () => mountAndMark(component, options) });
  }

  // The callback may return a Promise or a non-Promise value.
  request(callback) {
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
  // HOOKS FOR BEFORE RESPONSES

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
  // HOOKS FOR AFTER RESPONSES

  // Calling one of these hooks executes the series of request-response cycles.

  /* afterResponses() specifies a callback to run after all responses have been
  processed. It returns a new MockHttp that can be used to follow this series
  with a new series of request-response cycles. The callback may return a
  Promise or a non-Promise value, but it should not send a request. To send
  another request after the responses have been processed, use the returned
  MockHttp. */
  afterResponses(callback) {
    if (this._route == null && this._mount == null && this._request == null)
      throw new Error('route(), mount(), and/or request() required');
    const promise = this._initialPromise()
      .then(() => {
        if (this._beforeEachNavGuard == null) return;
        beforeEachNav((to, from) => this._tryBeforeEachNav(to, from));
      })
      .then(() => this._routeAndMount())
      .then(() => {
        if (this._request == null) return undefined;
        this._checkStateBeforeRequest();
        return this._request(this._component);
      })
      // Using finally() rather than then() so that even if the promise is
      // rejected, we know that any responses will be processed by the end of
      // the promise.
      .finally(this._waitForResponsesToBeProcessed)
      .finally(() => this._restoreHttp())
      .then(() => this._checkStateAfterWait())
      .then(() => callback(this._component))
      .then(result => ({ component: this._component, result }))
      .finally(() => this._cleanUpAfterResponses());
    return new MockHttp({ previousPromise: promise });
  }

  afterResponse(callback) { return this.afterResponses(callback); }
  complete() { return this.afterResponses(component => component); }

  _initialPromise() {
    const promise = this._previousPromise != null
      ? this._previousPromise
      : Promise.resolve({});
    return promise
      // Check initial state, set globals, and set properties of this object
      // that are used within the afterResponses() promise. `component` is the
      // component that the previous promise mounted (if any).
      .then(({ component }) => {
        // Concurrent series could cause issues in at least two ways. First,
        // Vue.prototype.$http might not be restored correctly. Second, if
        // concurrent series use the single global router, that could cause
        // issues.
        if (inProgress) throw new Error('another series is in progress');
        inProgress = true;
        this._inProgress = true;
        this._errorFromBeforeEachNav = null;
        this._previousHttp = Vue.prototype.$http;
        setHttp(this._http());
        this._component = component;
        this._errorFromBeforeEachResponse = null;
        this._errorFromResponse = null;
        this._requestWithoutResponse = false;
        this._responseWithoutRequest = this._responses.length !== 0;
        this._requestResponseLog = [];
      })
      .then(() => {
        if (this._route == null || this._mount == null) return undefined;
        // If we are already at the specified route location, we need to
        // navigate to a different location; otherwise the navigation will be
        // aborted. Here, we navigate to a location that we also know will not
        // send a request.
        return new Promise((resolve, reject) => router.push(
          `/_initialPromise${Vue.prototype.$uniqueId()}`,
          () => {
            // Reset router state.
            routerState.navigations.first = { triggered: false, confirmed: false };
            routerState.navigations.last = { triggered: false, confirmed: false };
            resolve();
          },
          () => reject(new Error('navigation aborted'))
        ));
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
      // Wait a tick after this._request() or the previous response so that Vue
      // is updated before this._beforeEachResponse() is called.
      return Vue.nextTick()
        .then(() => {
          if (this._beforeEachResponse != null) this._tryBeforeEachResponse();
        })
        .then(() => new Promise((resolve, reject) => {
          let result;
          try {
            result = responseCallback();
          } catch (e) {
            if (this._errorFromResponse == null) this._errorFromResponse = e;
            reject(e);
            return;
          }
          const response = result instanceof Error ? result.response : result;
          this._requestResponseLog.push(response);
          if (validateStatus(response.status))
            resolve(response);
          else
            reject(result);
        }));
    };
  }

  _tryBeforeEachResponse() {
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

  _tryBeforeEachNav(to, from) {
    // The current series' beforeEachNav() guard will be in place until the end
    // of the test, not just the end of the series. If the current series is
    // followed by another series, we need to deactivate the current series'
    // guard during the following series. To do so, we check this._inProgress,
    // which will be false during the following series.
    if (!this._inProgress) return;
    if (this._errorFromBeforeEachNav != null) return;
    try {
      this._beforeEachNavGuard(this._component, to, from);
    } catch (e) {
      this._errorFromBeforeEachNav = e;
    }
  }

  _routeAndMount() {
    if (this._route == null) {
      if (this._mount != null) this._component = this._mount();
      return undefined;
    }
    return new Promise((resolve, reject) => {
      let complete = false;
      router.push(
        this._route,
        () => {
          complete = true;
          // If a component has not been mounted
          // (in which case this._mount != null), and if the router.push()
          // onComplete callback is synchronous
          // (in which case this._component == null), we wait to resolve until
          // after mounting below. Otherwise, we resolve here after waiting a
          // tick for the DOM to update.
          if (!(this._mount != null && this._component == null))
            Vue.nextTick(resolve);
        },
        /* The router.push() onAbort callback seems to be called when the
        navigation to this._route is aborted, even if a navigation is ultimately
        confirmed. Here we examine the router state to determine whether a
        navigation was ultimately confirmed. (Note that this implementation will
        not work if an asynchronous navigation guard is called after the
        navigation to this._route is aborted: the onAbort callback waits a tick,
        but that might not be long enough for an asynchronous guard to
        return.) */
        () => Vue.nextTick(() => {
          if (routerState.navigations.last.confirmed)
            resolve();
          else
            reject(new Error('The last navigation was not confirmed. This may be because you are navigating away from a page with a modal.'));
        })
      );
      if (this._mount != null) {
        // If the initial navigation is asynchronous, we mount before waiting
        // for it to be confirmed, matching what happens in production.
        this._component = this._mount();
        if (complete) resolve();
      }
    });
  }

  _checkStateBeforeRequest() {
    /* this._route and this._mount() are allowed to result in requests, but if
    they do, no request callback should be specified. We check for that case by
    examining this._requestResponseLog, which will have an entry if there has
    been a request already. (Note, however, that the response to the request
    might not yet have been sent: we may be in the period between the request
    and the response.) */
    if (this._requestResponseLog.length === 0) return;
    this._listRequestResponseLog();
    throw new Error('a request was sent before the request() callback was invoked');
  }

  _listRequestResponseLog() {
    console.log('request/response log:'); // eslint-disable-line no-console
    if (this._requestResponseLog.length === 0)
      console.log('(empty)'); // eslint-disable-line no-console
    else {
      for (const entry of this._requestResponseLog)
        console.log(entry); // eslint-disable-line no-console
    }
  }

  _waitForResponsesToBeProcessed() {
    // setTimeout(resolve) calls `resolve` after pending promises settle.
    // https://vue-test-utils.vuejs.org/en/guides/testing-async-components.html
    return new Promise(resolve => setTimeout(resolve));
  }

  _restoreHttp() {
    // If this._previousPromise was rejected, the current series did not set
    // $http, and we do not need to restore it. We can check for that case by
    // examining this._inProgress, which will be falsy if this._previousPromise
    // was rejected.
    if (this._inProgress) Vue.prototype.$http = this._previousHttp;
  }

  _checkStateAfterWait() {
    if (this._errorFromBeforeEachNav != null) {
      // eslint-disable-next-line no-console
      console.log('the beforeEachNav() callback threw an error');
      throw this._errorFromBeforeEachNav;
    }
    if (this._errorFromBeforeEachResponse != null) {
      // eslint-disable-next-line no-console
      console.log('the beforeEachResponse() callback threw an error');
      throw this._errorFromBeforeEachResponse;
    }
    if (this._errorFromResponse != null) {
      // eslint-disable-next-line no-console
      console.log('a response callback threw an error');
      throw this._errorFromResponse;
    }
    if (this._requestWithoutResponse || this._responseWithoutRequest) {
      this._listRequestResponseLog();
      if (this._requestWithoutResponse)
        throw new Error('request without response: no response specified for request');
      else
        throw new Error('response without request: not all responses were requested');
    }
  }

  _cleanUpAfterResponses() {
    this._inProgress = false;
    inProgress = false;
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
    const anySpecification = this._route != null || this._mount != null ||
      this._request != null || this._responses.length !== 0 ||
      this._beforeEachResponse != null;
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

export const mockRoute = (location, mountOptions = {}) => mockHttp()
  .mount(App, { ...mountOptions, router })
  .route(location);
