import Vue from 'vue';
import { last } from 'ramda';

import App from '../../src/components/app.vue';
import router from '../../src/router';
import store from '../../src/store';
import { noop } from '../../src/util/util';
import { routeProps } from '../../src/util/router';

import requestDataByComponent from './http/data';
import testData from '../data';
import * as commonTests from './http/common';
import { beforeEachNav } from './router';
import { loadAsyncCache } from './async-components';
import { mockAxiosResponse } from './axios';
import { mount as lifecycleMount } from './lifecycle';
import { wait, waitUntil } from './util';



////////////////////////////////////////////////////////////////////////////////
// setHttp()

// Sets Vue.prototype.$http to a mock.
export const setHttp = (respond) => {
  const http = (config) => respond(config);
  http.request = http;
  http.get = (url, config) => http({ ...config, method: 'GET', url });
  http.post = (url, data, config) => {
    const full = { ...config, method: 'POST', url };
    if (data != null) full.data = data;
    return http(full);
  };
  http.put = (url, data, config) => http({ ...config, method: 'PUT', url, data });
  http.patch = (url, data, config) => http({ ...config, method: 'PATCH', url, data });
  http.delete = (url, config) => http({ ...config, method: 'DELETE', url });
  http.defaults = {
    headers: {
      common: {}
    }
  };
  Vue.prototype.$http = http;
};



////////////////////////////////////////////////////////////////////////////////
// mockHttp() and load()

/*
mockHttp() mocks a series of request-response cycles. It allows you to mount a
component, specify one or more requests, then examine the component once the
responses to the requests have been processed.

First, specify a component to mount. Some components will send a request after
being mounted, for example:

  mockHttp()
    .mount(AuditList)

Other components will not send a request. Specify a request after mounting the
component:

  mockHttp()
    // Mounting AccountResetPassword does not send a request.
    .mount(AccountResetPassword, { router })
    // Sends a POST request.
    .request(trigger.submit('form', [
      ['input[type="email"]', 'example@getodk.org']
    ]))

After specifying the request, specify the response as a callback:

  mockHttp()
    .mount(AuditList)
    .respondWithData(() => testData.extendedAudits.sorted())

Sometimes, mount() and/or request() will send more than one request. Simply
specify all the responses, in order of the request:

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .mount(ProjectList, { router })
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted());

In rare cases, you may know that mount() and/or request() will not send any
request. In that case, simply do not specify a response. What is important is
that the number of requests matches the number of responses.

After specifying the requests and responses, you can examine the state of the
component once the responses have been processed:

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .mount(ProjectList, { router })
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted())
    .afterResponses(component => {
      component.find(ProjectRow).length.should.equal(3);
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

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .mount(ProjectList, { router })
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted())
    .afterResponses(component => {
      component.find(ProjectRow).length.should.equal(3);
    })
    .then(() => {
      console.log('table has 3 rows');
    })
    .catch(() => {
      console.log('an error was thrown');
    });

Alternatively, you can follow the series with a new series of request-response
cycles: series can be chained. For example:

  mockLogin();
  testData.extendedAudits.createPast(1, {
    actor: testData.extendedUsers.first(),
    action: 'user.create',
    actee: testData.toActor(testData.extendedUsers.first())
  });
  mockHttp()
    .mount(AuditList)
    .respondWithData(() => testData.extendedAudits.sorted())
    .afterResponses(component => {
      component.find(AuditRow).length.should.equal(1);
    })
    .request(trigger.changeValue('#audit-filters-action select', 'user.delete'))
    .respondWithData(() => [])
    .afterResponses(component => {
      component.find(AuditRow).length.should.equal(0);
    });

Notice how the mounted component is passed to each request() and
afterResponses() callback, even in the second series.

In some cases, you may need multiple series of request-response cycles, yet do
not need to assert something in each series. In that case, use complete(), which
is a shortcut for afterResponses(component => component). Because it calls
afterResponses(), complete() will also execute the series.

Using the router
----------------

If a test uses the router, for example, if a component uses <router-link>,
specify the router to mount().

If a test changes the route, mount the App component and specify the initial
location:

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .mount(App, { router })
    .route('/')
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted());

From there, you can navigate to a new location. If doing so will send one or
more requests, also specify the responses. For example:

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .mount(App, { router })
    .route('/')
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted());
    .complete()
    .route('/system/audits')
    .respondWithData(() => testData.extendedAudits.sorted());

A shortcut for specifying responses
-----------------------------------

Specifying responses can lead to repetitive code. As a shortcut, call load()
with a location to automatically specify the responses for the route. For
example, instead of:

  mockHttp()
    .mount(App, { router })
    .route('/')
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted())

you can call:

  load('/')

You can also call load() to change the route, specifying responses for the new
location:

  mockLogin();
  testData.extendedProjects.createPast(3);
  load('/')
    .complete()
    .load('/system/audits')

/test/util/http/data.js maps each route to its responses.

Common load() options
---------------------

By default, load() mounts App and specifies responses. However, you can also
choose not to mount App or not to specify responses.

If a test changes the route, then it should mount App. However, if a test
doesn't change the route or otherwise need to mount App, then it can simply
mount the component associated with the route. For example,

  load('/', { root: false })

is equivalent to:

  mockHttp()
    .mount(ProjectList, { router })
    .route('/')
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted())

Although it is rarely necessary to do so, it is also possible not to specify
responses. For example,

  load('/', {}, false)

is equivalent to:

  mockHttp()
    .mount(App, { router })
    .route('/')

A component may send a request but not be associated with a route, for example,
many modals. To test a component like this, use mockHttp(), or use load() to
mount the component's parent component.

Additional options
------------------

There is a lot you can do with mockHttp() and load(). You can learn more by
reviewing the comments above each method below.
*/

let inProgress = false;

// Returns the components associated with a route. If the route is lazy-loaded,
// any async component will be unwrapped from AsyncRoute.
const routeComponents = (route) => route.matched.map(routeRecord => {
  const { asyncRoute } = routeRecord.meta;
  return asyncRoute == null
    ? routeRecord.components.default
    : loadAsyncCache.get(asyncRoute.componentName).default;
});

class MockHttp {
  constructor({
    // If the current series follows a previous series of request-response
    // cycles, previousPromise is the promise from the previous series.
    // previousPromise is used to chain series.
    previousPromise = null,
    location = null,
    beforeEachNavGuard = null,
    mount = null,
    request = null,
    // Array of response callbacks
    responses = [],
    beforeAnyResponse = null,
    beforeEachResponse = null
  } = {}) {
    this._previousPromise = previousPromise;
    this._location = location;
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
      location: this._location,
      beforeEachNavGuard: this._beforeEachNavGuard,
      mount: this._mount,
      request: this._request,
      responses: this._responses,
      beforeAnyResponse: this._beforeAnyResponse,
      beforeEachResponse: this._beforeEachResponse,
      ...options
    });
  }

  modify(f) { return f(this); }

  //////////////////////////////////////////////////////////////////////////////
  // ROUTER NAVIGATION

  /* In addition to mounting a component with mount() and specifying one or more
  requests with request(), you can change the current route by specifying
  route(). This mocks the behavior of the user navigating to a different route.
  route() is called before request(). If changing the route results in a
  request, do not specify request() in the same series. Instead, specify
  request() in a chained series. */
  route(location) {
    if (this._location != null)
      throw new Error('cannot call route() more than once in a single series');
    return this._with({ location });
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
        (config) => mockAxiosResponse(callback(), config)
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
    if (testData.extendedUsers.size === 0) throw new Error('user not found');
    return this
      .respondWithData(() => testData.sessions.createNew())
      .respondWithData(() => testData.extendedUsers.first());
  }

  // respondForComponent() responds with all the responses expected for the
  // specified component. This method is used in respondFor() and elsewhere, but
  // it is rarely used directly in tests.
  respondForComponent(component, options = undefined) {
    return [...requestDataByComponent(component.name)].reduce(
      (series, [key, callback]) => {
        const option = options != null ? options[key] : null;
        if (option != null) {
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
    return routeComponents(router.resolve(location).route).reduce(
      (series, component) => series.respondForComponent(component, options),
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

  When there are concurrent requests, the beforeEachResponse() callback will be
  run once between each pair of responses. Vue will also react between each pair
  of responses. Together, that means that for two concurrent requests, we will
  see the following sequence:

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
    if (this._location == null && this._mount == null && this._request == null)
      throw new Error('route(), mount(), and/or request() required');
    const promise = this._initialPromise()
      .then(() => {
        if (this._beforeEachNavGuard == null) return;
        beforeEachNav((to, from) => {
          this._tryBeforeEachNav(to, from);
        });
      })
      .then(() => this._navigateAndMount())
      // If both this.route() and this.request() were specified, then wait for
      // any async components associated with the route to load.
      .then(() => (this._location && this._request != null
        ? wait()
        : undefined))
      .then(() => {
        if (this._request == null) return undefined;
        this._checkStateBeforeRequest();
        return this._request(this._component);
      })
      // Wait for any responses to be processed.
      .finally(wait)
      .finally(() => (pollWork != null
        ? waitUntil(() => pollWork(this._component))
        : undefined))
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
        .catch(noop)
        .then(() => (index === 0 && this._beforeAnyResponse != null
          ? this._tryBeforeAnyResponse()
          : null))
        .then(() => (this._beforeEachResponse != null
          ? this._tryBeforeEachResponse(config, index)
          : null))
        .then(() => new Promise((resolve, reject) => {
          let response;
          try {
            response = responseCallback(config);
          } catch (e) {
            if (this._errorFromResponse == null) this._errorFromResponse = e;
            reject(e);
            return;
          }

          const withoutConfig = { ...response };
          delete withoutConfig.config;
          this._requestResponseLog.push(withoutConfig);

          if (response.status >= 200 && response.status < 300) {
            resolve(response);
          } else {
            const error = new Error();
            error.request = {};
            error.response = response;
            reject(error);
          }
        }));
      return this._responsesPromise;
    };
  }

  // _tryBeforeAnyResponse() runs this._beforeAnyResponse(), catching any
  // resulting error.
  _tryBeforeAnyResponse() {
    return Promise.resolve()
      .then(() => this._beforeAnyResponse(this._component))
      .catch(e => {
        // We do not re-throw the error, because doing so would prevent Frontend
        // from receiving the response to follow.
        this._errorFromBeforeAnyResponse = e;
      });
  }

  // _tryBeforeEachResponse() runs this._beforeEachResponse(), catching any
  // resulting error. It does not run this._beforeEachResponse() if the callback
  // resulted in an error for a previous response.
  _tryBeforeEachResponse(config, index) {
    if (this._errorFromBeforeEachResponse != null) return undefined;
    return Promise.resolve()
      .then(() => this._beforeEachResponse(this._component, config, index))
      .catch(e => {
        // We do not re-throw the error, because doing so would prevent Frontend
        // from receiving the response to follow.
        this._errorFromBeforeEachResponse = e;
      });
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

  _navigate() {
    return new Promise(resolve => {
      router.push(
        this._location,
        resolve,
        // The router.push() onAbort callback seems to be called if the user is
        // redirected after the navigation to this._location, even though the
        // redirection will ultimately lead to a confirmed navigation.
        () => waitUntil(() => store.state.router.lastNavigationWasConfirmed)
          .then(resolve)
      );
    });
  }

  _navigateAndMount() {
    if (this._location != null && this._mount != null) {
      // If both this.route() and this.mount() were specified, then this is the
      // first navigation. In that case, we trigger the navigation, then mount
      // the component without waiting for a confirmed navigation, matching what
      // happens in production.
      const promise = this._navigate();
      this._component = this._mount();
      return promise;
    }
    if (this._location != null) return this._navigate();
    if (this._mount != null) this._component = this._mount();
    return undefined;
  }

  _checkStateBeforeRequest() {
    /* this.route() and this.mount() are allowed to result in requests, but if
    they do, no request callback should be specified. We check for that case by
    examining this._requestResponseLog, which will have an entry if there has
    been a request already. (Note, however, that the response to the request
    might not yet have been sent: we may be in the period between the request
    and the response.) */
    if (this._requestResponseLog.length === 0) return;
    this._listRequestResponseLog();
    throw new Error('a request was sent before the request() callback was run');
  }

  /* eslint-disable no-console */
  _listRequestResponseLog() {
    console.log('request/response log for the last series executed:');
    if (this._requestResponseLog.length === 0) {
      console.log('(empty)');
    } else {
      for (const entry of this._requestResponseLog)
        console.log(entry);
    }
  }
  /* eslint-enable no-console */

  _restoreHttp() {
    // If this._previousPromise was rejected, the current series did not set
    // $http, and we do not need to restore it. We can check for that case by
    // examining this._inProgress, which will be falsy if this._previousPromise
    // was rejected.
    if (this._inProgress) Vue.prototype.$http = this._previousHttp;
  }

  /* eslint-disable no-console */
  _checkStateAfterWait() {
    if (this._errorFromBeforeEachNav != null) {
      console.error(this._errorFromBeforeEachNav);
      throw new Error('beforeEachNav() callback threw an error');
    }
    if (this._errorFromBeforeAnyResponse != null) {
      console.error(this._errorFromBeforeAnyResponse);
      throw new Error('beforeAnyResponse() callback threw an error');
    }
    if (this._errorFromBeforeEachResponse != null) {
      console.error(this._errorFromBeforeEachResponse);
      throw new Error('beforeEachResponse() callback threw an error');
    }
    if (this._errorFromResponse != null) {
      console.error(this._errorFromResponse);
      throw new Error('a response callback threw an error');
    }
    if (this._requestWithoutResponse || this._responseWithoutRequest) {
      this._listRequestResponseLog();
      if (this._requestWithoutResponse)
        throw new Error('request without response: no response specified for request');
      else
        throw new Error('response without request: not all responses were requested');
    }
  }
  /* eslint-enable no-console */

  _cleanUpAfterResponses() {
    this._inProgress = false;
    inProgress = false;
  }



  //////////////////////////////////////////////////////////////////////////////
  // PROMISE METHODS

  toPromise() {
    const anySetup = this._location != null ||
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
  then(p1, p2) { return this.toPromise().then(p1, p2); }
  catch(onRejected) { return this.toPromise().catch(onRejected); }
  finally(onFinally) { return this.toPromise().finally(onFinally); }
}

Object.assign(MockHttp.prototype, commonTests);

export const mockHttp = () => new MockHttp();

// Mounts the component associated with the bottom-level route matching
// `location`, setting propsData. If respondForOptions is not `false`, it will
// also set requestData and respond to the initial requests that the component
// sends.
const loadBottomComponent = (location, mountOptions, respondForOptions) => {
  const { route } = router.resolve(location);
  const components = routeComponents(route);
  const bottomComponent = last(components);

  const fullMountOptions = { ...mountOptions, router };

  const bottomRouteRecord = last(route.matched);
  const props = routeProps(route, bottomRouteRecord.props.default);
  fullMountOptions.propsData = bottomRouteRecord.meta.asyncRoute == null
    ? props
    : props.props;

  if (respondForOptions !== false) {
    const requestData = {};
    for (let i = 0; i < components.length - 1; i += 1) {
      for (const [key, callback] of requestDataByComponent(components[i].name)) {
        const option = respondForOptions != null
          ? respondForOptions[key]
          : null;
        requestData[key] = option != null
          ? (typeof option === 'number' ? { problem: option } : option())
          : callback();
      }
    }
    fullMountOptions.requestData = requestData;
  }

  return mockHttp()
    .mount(bottomComponent, fullMountOptions)
    .route(location)
    .modify(series => (respondForOptions !== false
      ? series.respondForComponent(bottomComponent, respondForOptions)
      : series));
};

export const load = (
  location,
  mountOptions = undefined,
  respondForOptions = undefined
) => {
  // Check whether the user has specified respondForOptions without
  // mountOptions.
  if (mountOptions != null && respondForOptions == null) {
    for (const value of Object.values(mountOptions)) {
      if (typeof value === 'function') throw new Error('invalid mount option');
    }
  }

  if (mountOptions != null && mountOptions.root === false) {
    const { root, ...optionsWithoutRoot } = mountOptions;
    return loadBottomComponent(location, optionsWithoutRoot, respondForOptions);
  }

  return mockHttp()
    .mount(App, { ...mountOptions, router })
    .route(location)
    .modify(series => (respondForOptions !== false
      ? series.respondFor(location, respondForOptions)
      : series));
};

// Deprecated
export const mockRoute = (location, mountOptions = undefined) =>
  load(location, mountOptions, false);
