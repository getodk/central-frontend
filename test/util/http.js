import Vue from 'vue';

import App from '../../src/components/app.vue';
import requestDataByComponent from './http/respond-for';
import router from '../../src/router';
import store from '../../src/store';
import testData from '../data';
import * as commonTests from './http/common';
import { beforeEachNav } from './router';
import { mount as lifecycleMount } from './lifecycle';
import { trigger } from './event';



////////////////////////////////////////////////////////////////////////////////
// setHttp()

// Sets Vue.prototype.$http to a mock.
export const setHttp = (respond) => {
  const http = (config) => respond(config);
  http.request = http;
  http.get = (url, config) => http({ ...config, method: 'get', url });
  http.post = (url, data, config) => http({ ...config, method: 'post', url, data });
  http.put = (url, data, config) => http({ ...config, method: 'put', url, data });
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
// mockHttp(), mockRoute(), load()

/*
MockHttp mocks a series of request-response cycles. It allows you to mount a
component, specify one or more requests, then examine the component once the
responses to the requests have been processed.

First, specify a component to mount. Some components will send a request after
being mounted, for example:

  mockHttp()
    .mount(AuditList, { router });

Other components will not send a request. Specify a request after mounting the
component:

  mockLogin();
  mockHttp()
    // Mounting AccountResetPassword does not send a request.
    .mount(AccountResetPassword, { router })
    // Sends a POST request.
    .request(component => submitForm(component, 'form', [
      ['input[type="email"]', 'example@getodk.org']
    ]));

If you already have a mounted component, you can skip mockHttp().mount():

  const component = mount(App, { router });

  ...

  mockHttp()
    .request(() => submitLoginForm(component, 'example@getodk.org'));

After specifying the request, specify the response as a callback:

  mockHttp()
    .mount(AuditList, { router })
    .respondWithData(() => testData.extendedAudits.sorted());

Sometimes, mount() and/or request() will send more than one request. Simply
specify all the responses, in order of the request:

  mockHttp()
    .mount(App, { router })
    .request(component => submitLoginForm(component, 'example@getodk.org'))
    .respondWithData(() => testData.sessions.createNew())
    .respondWithData(() => testData.extendedUsers
      .createPast(1, { email: 'example@getodk.org' })
      .last());

In rare cases, you may know that mount() and/or request() will not send any
request. In that case, simply do not specify a response. What is important is
that the number of requests matches the number of responses.

After specifying the requests and responses, you can examine the state of the
component once the responses have been processed:

  mockHttp()
    .mount(ProjectList, { router })
    .respondWithData(() => testData.extendedProjects.createPast(3).sorted())
    .respondWithData(() => testData.standardUsers.sorted())
    .afterResponses(component => {
      component.find('#project-list-table tbody tr').length.should.equal(3);
    });

It is not until afterResponses() that the component is actually mounted and the
request() callback is run. afterResponses() mounts the component, runs the
request() callback, waits for the responses to be processed, then finally runs
its own callback, thereby completing the series of request-response cycles.

In other words, using mockHttp() involves two phases:

  1. Setup. Specify the series of request-response cycles, as well as some
     hooks, such as beforeAnyResponse() and beforeEachNav(). As a precaution,
     many setup methods will throw an error if they are called more than once.
  2. Execution. Once you specify a hook to run after the responses, the series
     of request-response cycles is kicked off.

afterResponses() returns a thenable, which usually is ultimately returned to
Mocha. You can call then(), catch(), or finally() on the thenable:

  mockHttp()
    .mount(ProjectList, { router })
    .respondWithData(() => testData.extendedProjects.createPast(3).sorted())
    .respondWithData(() => testData.standardUsers.sorted())
    .afterResponses(component => {
      component.find('#project-list-table tbody tr').length.should.equal(3);
    })
    .then(() => {
      console.log('table has 3 rows');
    })
    .catch(() => {
      console.log('an error was thrown');
    });

Alternatively, you can follow the series with a new series of request-response
cycles: series can be chained. For example:

  mockHttp()
    .mount(App, { router })
    .request(component => submitLoginForm(component, 'example@getodk.org'))
    .respondWithData(() => testData.sessions.createNew())
    .respondWithData(() => testData.extendedUsers
      .createPast(1, { email: 'example@getodk.org' })
      .last())
    .respondWithData(() => testData.extendedProjects.createPast(3).sorted())
    .respondWithData(() => testData.standardUsers.sorted())
    .afterResponses(component => {
      component.find('#project-list-table tbody tr').length.should.equal(3);
    })
    .request(component => trigger.click(component, '#navbar-links-users'))
    .respondWithData(() => testData.standardUsers.sorted())
    .afterResponses(component => {
      component.find('#user-list-table tbody tr').length.should.equal(1);
    });

Notice how the mounted component is passed to each request() and
afterResponses() callback, even in the second series.

In some cases, you may need multiple series of request-response cycles, yet do
not need to assert something in each series. In that case, use complete(), which
is a shortcut for `afterResponses(component => component)`. Because it calls
afterResponses(), complete() will also execute the series.

If you are testing a single page, you can usually use mockHttp(). However, if a
test changes the current route, or if the page uses <router-link>, you should
use mockRoute().

There is a lot you can do with mockHttp(), and you can learn more by reviewing
the comments above each method below.
*/

let inProgress = false;

class MockHttp {
  constructor({
    // If the current series follows a previous series of request-response
    // cycles, previousPromise is the promise from the previous series.
    // previousPromise is used to chain series.
    previousPromise = null,
    route = null,
    beforeEachNavGuard = null,
    mount = null,
    request = null,
    // Array of response callbacks
    responses = [],
    beforeAnyResponse = null,
    beforeEachResponse = null
  } = {}) {
    this._previousPromise = previousPromise;
    this._route = route;
    this._beforeEachNavGuard = beforeEachNavGuard;
    this._mount = mount;
    this._request = request;
    this._responses = responses;
    this._beforeAnyResponse = beforeAnyResponse;
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
      beforeAnyResponse: this._beforeAnyResponse,
      beforeEachResponse: this._beforeEachResponse,
      ...options
    });
  }

  //////////////////////////////////////////////////////////////////////////////
  // ROUTING

  /* In addition to mounting a component with mount() and specifying one or more
  requests with request(), you can change the current route by specifying
  route(). This mocks the behavior of the user navigating to a different route.
  route() is called before request(). If changing the route results in a
  request, do not specify request() in the same series. Instead, specify
  request() in a chained series. */
  route(location) {
    if (this._route != null)
      throw new Error('cannot call route() more than once in a single series');
    return this._with({ route: location });
  }

  beforeEachNav(callback) {
    if (this._beforeEachNavGuard != null)
      throw new Error('cannot call beforeEachNav() more than once in a single chain');
    // When we run the callback later, we do not want it to be bound to the
    // MockHttp.
    const beforeEachNavGuard = callback.bind(null);
    return this._with({ beforeEachNavGuard });
  }

  //////////////////////////////////////////////////////////////////////////////
  // OTHER REQUESTS

  mount(component, options = undefined) {
    if (this._mount != null)
      throw new Error('cannot call mount() more than once in a single chain');
    if (this._previousPromise != null)
      throw new Error('cannot call mount() after the first series in a chain');
    return this._with({ mount: () => lifecycleMount(component, options) });
  }

  // The callback may return a Promise or a non-Promise value.
  request(callback) {
    if (this._request != null)
      throw new Error('cannot call request() more than once in a single series');
    // When we run the callback later, we do not want it to be bound to the
    // MockHttp.
    return this._with({ request: callback.bind(null) });
  }

  //////////////////////////////////////////////////////////////////////////////
  // RESPONSES

  respond(callback) {
    return this._with({
      responses: [
        ...this._responses,
        () => {
          const result = callback();
          const { problem } = result;
          if (problem == null) return { status: 200, data: result };
          if (typeof problem === 'object')
            return { status: Math.floor(problem.code), data: problem };
          return {
            status: Math.floor(problem),
            data: { code: problem, message: 'There was a problem.' }
          };
        }
      ]
    });
  }

  respondWithData(callback) { return this.respond(callback); }
  respondWithSuccess() { return this.respond(() => ({ success: true })); }

  respondWithProblem(problemOrCode = 500.1) {
    return this.respond(() => ({ problem: problemOrCode }));
  }

  restoreSession(restore) {
    if (!restore) return this.respondWithProblem(404.1);
    return this
      .respondWithData(() => testData.sessions.createNew())
      .respondWithData(() => {
        if (testData.extendedUsers.size !== 0)
          throw new Error('user already exists');
        return testData.extendedUsers.createPast(1, { role: 'admin' }).last();
      });
  }

  // respondForComponent() responds with all the responses expected for the
  // specified component. This method is used by respondFor() and elsewhere, but
  // it is rarely used in tests.
  respondForComponent(component, options = undefined) {
    return [...requestDataByComponent(component.name)].reduce(
      (series, [key, callback]) => {
        if (options != null && options[key] != null) {
          const option = options[key];
          if (option === false) return series;
          return typeof option === 'number'
            ? series.respondWithProblem(option)
            : series.respond(option);
        }
        return series.respond(callback);
      },
      this
    );
  }

  /*
  respondFor() responds with all the responses expected for the specified
  location. Default responses are used unless you override them. Examples:

    .respondFor('/projects/1') is equivalent to:

      .respondWithData(() => testData.extendedProjects.last())
      .respondWithData(() => testData.extendedForms.sorted())

    .respondFor('/projects/1', { forms: () => [] }) is equivalent to:

      .respondWithData(() => testData.extendedProjects.last())
      .respondWithData(() => [])

    .respondFor('/projects/1', { forms: 500.1 }) is equivalent to:

      .respondWithData(() => testData.extendedProjects.last())
      .respondWithProblem(500.1)

    .respondFor('/projects/1', { forms: false }) is equivalent to:

      .respondWithData(() => testData.extendedProjects.last())
      // No response for `forms`

  The property names of `options` correspond to request keys.
  */
  respondFor(location, options = undefined) {
    return router.resolve(location).route.matched.reduce(
      (series, routeRecord) =>
        series.respondForComponent(routeRecord.components.default, options),
      this
    );
  }

  load(location, options) {
    return this.route(location).respondFor(location, options);
  }

  //////////////////////////////////////////////////////////////////////////////
  // HOOKS FOR BEFORE RESPONSES

  // Specifies a callback to run before any response is returned. The callback
  // may return a Promise or a non-Promise value. The callback may itself send
  // one or more requests.
  beforeAnyResponse(callback) {
    if (this._beforeAnyResponse != null)
      throw new Error('cannot call beforeAnyResponse() more than once in a single series');
    // When we run the callback later, we do not want it to be bound to the
    // MockHttp.
    return this._with({ beforeAnyResponse: callback.bind(null) });
  }

  /*
  beforeEachResponse() specifies a callback to run before each response is
  returned. The callback may return a Promise or a non-Promise value. The
  callback may itself send one or more requests. (Note that the callback will
  also be run for those requests.)

  When there are concurrent requests, the beforeEachResponse() callback is run
  once between each pair of responses. Vue.nextTick() is called before and after
  the beforeEachResponse() callback, giving Vue a chance to react. Together,
  that means that for two concurrent requests, we would see the following
  sequence:

    1. Two requests are sent concurrently.
       -> Vue reacts.
    2. The beforeEachResponse() callback is run for the first response.
       -> Vue reacts.
    3. The first response is returned.
       -> Vue reacts.
    4. The beforeEachResponse() callback is run for the second response.
       -> Vue reacts.
    5. The second response is returned.

  Note that if Frontend calls then() or catch() on a response's promise,
  starting a promise chain, there is little guarantee where within the sequence
  the promise chain will resolve. For example:

    1. Two requests are sent concurrently.
    2. The beforeEachResponse() callback is run for the first response.
    3. The first response is returned.
       -> The first response's promise becomes the start of a potentially long
          promise chain: then() or catch is called on the response's promise,
          then perhaps then() or catch() is called on that resulting promise,
          and so on. The response's promise might resolve before the next time
          the beforeEachResponse() callback is run -- but it might also not.
    4. The beforeEachResponse() callback is run for the second response.
       -> The first response's promise chain might resolve here.
    5. The second response is returned.
       -> The first response's promise chain might resolve here.

  As a result, if you are testing the result of a response's promise chain, you
  may wish to do so in an after responses hook.
  */
  beforeEachResponse(callback) {
    if (this._beforeEachResponse != null)
      throw new Error('cannot call beforeEachResponse() more than once in a single series');
    // When we run the callback later, we do not want it to be bound to the
    // MockHttp.
    return this._with({ beforeEachResponse: callback.bind(null) });
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
  afterResponses(optionsOrCallback) {
    if (typeof optionsOrCallback === 'function')
      return this.afterResponses({ callback: optionsOrCallback });
    const { callback, pollWork = undefined } = optionsOrCallback;
    if (this._route == null && this._mount == null && this._request == null)
      throw new Error('route(), mount(), and/or request() required');
    const promise = this._initialPromise()
      .then(() => {
        if (this._beforeEachNavGuard == null) return;
        beforeEachNav((to, from) => {
          this._tryBeforeEachNav(to, from);
        });
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
      .finally(() => this._waitOnWork(pollWork))
      .finally(() => this._restoreHttp())
      .then(() => this._checkStateAfterWait())
      .then(() => callback(this._component))
      .then(result => ({ component: this._component, result }))
      .finally(() => this._cleanUpAfterResponses());
    return new MockHttp({ previousPromise: promise });
  }

  afterResponse(optionsOrCallback) {
    return this.afterResponses(optionsOrCallback);
  }

  complete() { return this.afterResponses(component => component); }

  _initialPromise() {
    const promise = this._previousPromise != null
      ? this._previousPromise
      : Promise.resolve({});
    // Check initial state, set globals, and set properties of this object that
    // are used within the afterResponses() promise. `component` is the
    // component that the previous promise mounted (if any).
    return promise.then(({ component }) => {
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
      /*
      MockHttp uses two promises:

        1. The first promise is chained on this._previousPromise and returned by
           an after responses hook. Usually it is ultimately returned to Mocha.
        2. The second promise, stored in this._responseChain, holds the
           responses, chained in order of request. this._responseChain is not
           returned to Mocha, but rather to Frontend from $http.

      The two promises are related: the first promise triggers one or more
      requests; for which responses are returned to Frontend through the second
      promise; then the first promise is returned to Mocha or whatever else
      comes after the hook.

      It is because the second promise is returned to Frontend and not Mocha
      that _tryBeforeEachNav(), _tryBeforeAnyResponse(), and
      _tryBeforeEachResponse() catch any error even though they are called
      within a promise chain. Those methods catch and store any error so that
      the after responses hook is able to reject the first promise if something
      unexpected happens in the second promise.
      */
      this._responsesPromise = Promise.resolve();
      this._errorFromBeforeAnyResponse = null;
      this._errorFromBeforeEachResponse = null;
      this._errorFromResponse = null;
      this._requestWithoutResponse = false;
      this._responseWithoutRequest = this._responses.length !== 0;
      this._requestResponseLog = [];
    });
  }

  // Returns a function that responds with each of the specified responses in
  // turn.
  _http() {
    // The number of requests sent so far
    let count = 0;
    return (config) => {
      this._requestResponseLog.push(config);
      if (count === this._responses.length - 1)
        this._responseWithoutRequest = false;
      else if (count === this._responses.length) {
        this._requestWithoutResponse = true;
        return Promise.reject(new Error());
      }

      const responseCallback = this._responses[count];
      const index = count;
      count += 1;
      this._responsesPromise = this._responsesPromise
        // If this is not the first response, and the previous response was an
        // error, then this._responsesPromise will be rejected. However, we need
        // this part of the promise chain to be fulfilled, because this response
        // will not necessarily be an error even if the prevous one was.
        .catch(() => {})
        // Either the initial requests have just been sent, in which case this
        // is the first response, or a previous response has been returned
        // (perhaps just now). Either way, run Vue.nextTick() so that Vue has a
        // chance to react.
        .then(() => Vue.nextTick())
        .then(() => (index === 0 && this._beforeAnyResponse != null
          ? this._tryBeforeAnyResponse()
          : null))
        .then(() => (this._beforeEachResponse != null
          ? this._tryBeforeEachResponse(config, index)
          : null))
        .then(() => new Promise((resolve, reject) => {
          let response;
          try {
            response = responseCallback();
          } catch (e) {
            if (this._errorFromResponse == null) this._errorFromResponse = e;
            reject(e);
            return;
          }
          this._requestResponseLog.push(response);
          const responseWithConfig = { ...response, config };
          if (response.status >= 200 && response.status < 300) {
            resolve(responseWithConfig);
          } else {
            const error = new Error();
            error.request = {};
            error.response = responseWithConfig;
            reject(error);
          }
        }));
      return this._responsesPromise;
    };
  }

  // _tryBeforeAnyResponse() runs this._beforeAnyResponse(), catching any
  // resulting error. Afterwards, it runs Vue.nextTick() so that Vue has a
  // chance to react to any changes that the callback made.
  _tryBeforeAnyResponse() {
    return Promise.resolve()
      .then(() => this._beforeAnyResponse(this._component))
      .catch(error => {
        // We do not re-throw the error, because doing so would prevent Frontend
        // from receiving the response to follow.
        this._errorFromBeforeAnyResponse = error;
      })
      .finally(() => Vue.nextTick());
  }

  // _tryBeforeEachResponse() runs this._beforeEachResponse(), catching any
  // resulting error. It does not run this._beforeEachResponse() if the callback
  // resulted in an error for a previous response. After running
  // this._beforeEachResponse(), _tryBeforeEachResponse() runs Vue.nextTick() so
  // that Vue has a chance to react to any changes that the callback made.
  _tryBeforeEachResponse(config, index) {
    if (this._errorFromBeforeEachResponse != null) return null;
    return Promise.resolve()
      .then(() => this._beforeEachResponse(this._component, config, index))
      .catch(e => {
        // We do not re-throw the error, because doing so would prevent Frontend
        // from receiving the response to follow.
        this._errorFromBeforeEachResponse = e;
      })
      .finally(() => Vue.nextTick());
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
        () => {
          Vue.nextTick(() => {
            if (store.state.router.lastNavigationWasConfirmed)
              resolve();
            else
              reject(new Error('last navigation not confirmed'));
          });
        }
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
    throw new Error('a request was sent before the request() callback was run');
  }

  _listRequestResponseLog() {
    // eslint-disable-next-line no-console
    console.log('request/response log for the last series executed:');
    if (this._requestResponseLog.length === 0)
      console.log('(empty)'); // eslint-disable-line no-console
    else {
      for (const entry of this._requestResponseLog)
        console.log(entry); // eslint-disable-line no-console
    }
  }

  /* _waitOnWork() waits for Frontend to complete any ongoing work, for example,
  processing the response to a request. _waitOnWork() first uses setTimeout() to
  resolve pending promises: see
  https://vue-test-utils.vuejs.org/en/guides/testing-async-components.html.
  Then, if _waitOnWork() receives a callback, it will repeatedly run the
  callback until the callback returns a truthy value (or until Karma times
  out). */
  _waitOnWork(callback = undefined) {
    return new Promise(resolve => {
      const wait = () => {
        if (callback == null || callback(this._component)) {
          resolve();
        } else {
          setTimeout(wait, 10);
        }
      };
      setTimeout(wait);
    });
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
    if (this._errorFromBeforeAnyResponse != null) {
      // eslint-disable-next-line no-console
      console.log('the beforeAnyResponse() callback threw an error');
      throw this._errorFromBeforeAnyResponse;
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

  testRefreshButton(options) {
    // Options
    const normalizedOptions = this._testRefreshButtonOptions(options);
    const { collection, respondWithData, tableSelector } = normalizedOptions;

    // Helper functions
    const testRowCount = (component) => {
      const tables = component.find(tableSelector);
      if (tables.length === 0) throw new Error('table not found');
      if (tables.length > 1) throw new Error('multiple tables found');
      const rowCount = tables[0].find('tbody tr').length;
      rowCount.should.equal(collection.size);
    };

    // Series 1: Test that the table is initially rendered as expected.
    let series = this.respondWithData(() => {
      collection.createNew();
      return respondWithData[0]();
    });
    for (let i = 1; i < respondWithData.length; i += 1)
      series = series.respondWithData(respondWithData[i]);
    series = series.afterResponses(testRowCount);
    // Series 2: Click the refresh button and return a successful response (or
    // responses). The table should not disappear during the refresh, and it
    // should be updated afterwards.
    series = series
      .request(component => trigger.click(component, '.btn-refresh'))
      .respondWithData(() => {
        collection.createNew();
        return respondWithData[0]();
      });
    for (let i = 1; i < respondWithData.length; i += 1)
      series = series.respondWithData(respondWithData[i]);
    series = series
      .beforeEachResponse(testRowCount)
      .afterResponses(testRowCount);
    // Series 3: Click the refresh button again, this time returning a Problem
    // response (or responses).
    series = series
      .request(component => trigger.click(component, '.btn-refresh'));
    for (let i = 0; i < respondWithData.length; i += 1)
      series = series.respondWithProblem();
    return series.afterResponses(component => {
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
    const anySetup = this._route != null ||
      this._beforeEachNavGuard != null || this._mount != null ||
      this._request != null || this._responses.length !== 0 ||
      this._beforeAnyResponse != null || this._beforeEachResponse != null;
    if (!anySetup && this._previousPromise == null) return Promise.resolve();
    const promise = anySetup
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

Object.assign(MockHttp.prototype, commonTests);

export const mockHttp = () => new MockHttp();
export const mockRoute = (location, mountOptions = undefined) => mockHttp()
  .mount(App, { ...mountOptions, router })
  .route(location);

// Mounts the component for the bottom-level route matching `location`, setting
// propsData and requestData and responding to requests that the component
// sends. This is useful for tests that don't use the router or otherwise need
// to mount App.
const mockHttpForBottomComponent = (
  location,
  mountOptions,
  respondForOptions
) => {
  const { route } = router.resolve(location);
  const { matched } = route;
  if (matched.length === 0) throw new Error('no matching route');
  const bottomRouteRecord = matched[matched.length - 1];
  const bottomComponent = bottomRouteRecord.components.default;

  const mountOptionsWithData = { ...mountOptions };

  if (bottomRouteRecord.props.default === true)
    mountOptionsWithData.propsData = route.params;

  const requestData = {};
  for (let i = 0; i < matched.length - 1; i += 1) {
    const { name } = matched[i].components.default;
    for (const [key, callback] of requestDataByComponent(name)) {
      if (respondForOptions != null && respondForOptions[key] != null) {
        const option = respondForOptions[key];
        requestData[key] = typeof option === 'number'
          ? { problem: option }
          : option();
      } else {
        requestData[key] = callback();
      }
    }
  }
  mountOptionsWithData.requestData = requestData;

  return mockHttp()
    .mount(bottomComponent, mountOptionsWithData)
    .respondForComponent(bottomComponent, respondForOptions);
};
export const load = (
  location,
  mountOptions = undefined,
  respondForOptions = undefined
) => {
  // Prevent the user from accidentally specifying respondForOptions without
  // mountOptions.
  if (mountOptions != null && respondForOptions == null)
    throw new Error('specify either both sets of options or neither');

  if (mountOptions != null && mountOptions.component === true) {
    const optionsWithoutComponent = { ...mountOptions };
    delete optionsWithoutComponent.component;
    return mockHttpForBottomComponent(
      location,
      optionsWithoutComponent,
      respondForOptions
    );
  }

  return mockRoute(location, mountOptions)
    .respondFor(location, respondForOptions);
};
