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
    .mount(AccountResetPassword)
    // Sends a POST request.
    .request(async (component) => {
      await component.get('input').setValue('example@getodk.org');
      return component.get('form').trigger('submit');
    });

After specifying the request, specify the response as a callback:

  mockHttp()
    .mount(AuditList)
    .respondWithData(() => testData.extendedAudits.sorted())

Sometimes, mount() and/or request() will send more than one request. Simply
specify all the responses, in order of the request:

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .mount(Home)
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
    .mount(Home)
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted())
    .afterResponses(component => {
      component.findAllComponents(ProjectHomeBlock).length.should.equal(3);
    });

It is not until afterResponses() that the component is actually mounted and the
request() callback is run. afterResponses() mounts the component, runs the
request() callback, waits for the responses to be processed, then finally runs
its own callback, thereby completing the series of request-response cycles.

In other words, using mockHttp() involves two phases:

  1. Setup. Specify the series of request-response cycles, as well as any hooks
     to run before the responses. As a precaution, many setup methods will throw
     an error if they are called more than once.
  2. Execution. Once you specify a hook to run after the responses, the series
     of request-response cycles is kicked off.

afterResponses() returns a thenable, which usually is ultimately returned to
Mocha. You can call then(), catch(), or finally() on the thenable:

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .mount(Home)
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted())
    .afterResponses(component => {
      component.findAllComponents(ProjectHomeBlock).length.should.equal(3);
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
    action: 'user.update',
    actee: testData.toActor(testData.extendedUsers.first())
  });
  mockHttp()
    .mount(AuditList)
    .respondWithData(() => testData.extendedAudits.sorted())
    .afterResponses(component => {
      component.findComponent(AuditRow).exists().should.be.true;
    })
    .request(component =>
      component.get('#audit-filters-action select').setValue('user.delete'))
    .respondWithData(() => [])
    .afterResponses(component => {
      component.findComponent(AuditRow).exists().should.be.false;
    });

Notice how the mounted component is passed to each request() and
afterResponses() callback, even in the second series.

In some cases, you may need multiple series of request-response cycles, yet do
not need to assert something in each series. In that case, use complete(), which
is a shortcut for afterResponses(component => component). Because it calls
afterResponses(), complete() will also execute the series.

The router
----------

// TODO/vue3. Update these comments.

If the component uses <router-link>, you can use Vue Test Utils to stub it. If
it uses $route, you can use Vue Test Utils to mock it. For example:

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .mount(Home, {
      stubs: { RouterLink: RouterLinkStub },
      mocks: { $route: '/' }
    })
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted());

Alternatively, you can inject the actual router. To do so, specify the initial
location, then pass the router to mount():

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .route('/')
    .mount(Home, { router })
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted());

If a test will change the route, mount the root component (App) and inject the
router. After the initial navigation, you can navigate to a new location. If
doing so will send requests, also specify the responses. For example:

  mockLogin();
  testData.extendedProjects.createPast(3);
  mockHttp()
    .route('/')
    .mount(App, { router })
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted())
    .complete()
    .route('/system/audits')
    .respondWithData(() => testData.extendedAudits.sorted());

If navigating to the new location will not send a request, you can specify both
route() and request(). In that case, the request() callback will be run after
the navigation is confirmed.

A shortcut for specifying responses
-----------------------------------

Specifying responses can lead to repetitive code. As a shortcut, call load()
with a location to automatically specify the responses for the route. For
example, instead of:

  mockHttp()
    .route('/')
    .mount(App, { router })
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted())

you can call:

  load('/')

You can also call load() to change the route and specify the responses for the
new route:

  load('/')
    .complete()
    .load('/system/audits')

test/util/http/data.js maps each route to its responses.

Common load() options
---------------------

By default, load() mounts the root component, injecting the router, then
specifies responses. However, you can also choose not to mount the root
component or not to specify responses.

Instead of mounting the root component and injecting the router, you can mount
the route component, stubbing <router-link> and mocking $route. For example,

  load('/', { root: false })

is equivalent to:

  mockHttp()
    .mount(Home, {
      stubs: { RouterLink: RouterLinkStub },
      mocks: { $route: '/' }
    })
    .respondWithData(() => testData.extendedProjects.sorted())
    .respondWithData(() => testData.standardUsers.sorted())

Although it is rarely necessary, it is also possible not to specify responses.
For example,

  load('/', {}, false)

is equivalent to:

  mockHttp()
    .route('/')
    .mount(App, { router })

Which of these approaches should I take?
----------------------------------------

Every test of a component will need to mount the component. There are a few ways
to do so:

  1. mount()
  2. mockHttp()
  3. load()
  4. load(), specifying `root` as `false`

However, it might not be clear which approach to take for a particular
component. Here are some guidelines to help decide:

  - If you need to mount the root component (App), use load(). You should mount
    App if:
    - The test uses both the route component and another child component of App,
      for example, Navbar
    - The test uses the component for a parent route
    - The test will change the route
    - You are testing a navigation guard
    - (Uncommon) You may need to mount App if the component uses a <router-link>
      with a scoped slot.
  - If you don't need to mount the root component, and the component will not
    send a request during the test, then you should probably use mount(). This
    is the simplest and most explicit way to test a component in isolation and
    is also fastest.
    - If the component uses <router-link>, use Vue Test Utils to stub it. If it
      uses $route, use Vue Test Utils to mock it. If you mock $route, then
      mount() will also pass a minimal mock of $router with read-only
      functionality.
  - If you don't need to mount the root component, but the component will send
    a request during the test, then you should use either mockHttp() or load().
    - If you are testing the behavior of a route component, use load(),
      specifying `root` as `false`.
    - If you are testing the behavior of another component -- for example, a
      modal or another child component of a route component -- you should use
      mockHttp().
      - As with mount(), you can use Vue Test Utils to stub <router-link> or
        mock $route.

The goal should be to write a test that is as isolated as possible while also
avoiding repetitive code.

Additional options
------------------

There is a lot you can do with mockHttp() and load(). You can learn more by
reviewing the comments above each method below.
*/

import { clone, identity, last, pick } from 'ramda';

import App from '../../src/components/app.vue';

import { noop } from '../../src/util/util';
import { routeProps } from '../../src/util/router';

import createTestContainer from './container';
import requestDataByComponent from './http/data';
import testData from '../data';
import * as commonTests from './http/common';
import { loadAsyncCache } from './load-async';
import { mockAxiosError, mockResponse } from './axios';
import { mockRouter, setInstallLocation, testRouter } from './router';
import { mount as lifecycleMount, withSetup } from './lifecycle';
import { setRequestData } from './request-data';
import { wait, waitUntil } from './util';

const routeResolver = createTestContainer({ router: testRouter() }).router;
const resolveRoute = (location) => routeResolver.resolve(location);
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
    container = null,
    // If the current series follows a previous series of request-response
    // cycles, previousPromise is the promise from the previous series.
    // previousPromise is used to chain series.
    previousPromise = null,
    location = null,
    mount = null,
    request = null,
    // Array of response callbacks
    orderedResponses = [],
    respondIf = [],
    beforeAnyResponse = null,
    beforeEachResponse = null
  } = {}) {
    this._container = container;
    this._previousPromise = previousPromise;
    this._location = location;
    this._mount = mount;
    this._request = request;
    this._orderedResponses = orderedResponses;
    this._respondIf = respondIf;
    this._beforeAnyResponse = beforeAnyResponse;
    this._beforeEachResponse = beforeEachResponse;
  }

  _with(options) {
    return new MockHttp({
      container: this._container,
      previousPromise: this._previousPromise,
      location: this._location,
      mount: this._mount,
      request: this._request,
      orderedResponses: this._orderedResponses,
      respondIf: this._respondIf,
      beforeAnyResponse: this._beforeAnyResponse,
      beforeEachResponse: this._beforeEachResponse,
      ...options
    });
  }

  modify(f) { return f(this); }

  //////////////////////////////////////////////////////////////////////////////
  // REQUESTS

  // Specifies the location to navigate to. If it is the initial navigation,
  // then mockHttp() will wait for the navigation to be completed before
  // mounting the component.
  route(location) {
    if (this._location != null)
      throw new Error('cannot call route() more than once in a single series');
    return this._with({ location });
  }

  mount(component, options = undefined, throwIfEmit = undefined) {
    if (this._mount != null)
      throw new Error('cannot call mount() more than once in a single chain');
    if (this._previousPromise != null)
      throw new Error('cannot call mount() after the first series in a chain');

    const containerOption = options != null ? options.container : undefined;
    if (containerOption != null && this._container != null &&
      containerOption !== this._container) {
      throw new Error('cannot call mount() with different container from series');
    }
    const container = this._container != null
      ? this._container
      : (containerOption != null && containerOption.install != null
        ? containerOption
        : createTestContainer(containerOption));

    const mount = () => {
      const wrapper = lifecycleMount(component, { ...options, container });

      if (throwIfEmit != null) {
        const emitted = wrapper.emitted();
        if (emitted != null) {
          let any = false;
          for (const [name, calls] of Object.entries(emitted)) {
            if (!name.startsWith('hook:')) {
              console.error(name, calls[0]); // eslint-disable-line no-console
              any = true;
            }
          }
          if (any) throw new Error(throwIfEmit);
        }
      }

      return wrapper;
    };

    return this._with({ container, mount });
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

  // `callback` must return a response object (specifically, an object with
  // `status` and `data` properties).
  respond(callback) {
    return this._with({
      orderedResponses: [...this._orderedResponses, callback]
    });
  }

  respondWithData(callback) {
    return this.respond(() => ({ status: 200, data: callback() }));
  }

  respondWithSuccess() {
    return this.respond(() => ({ status: 200, data: { success: true } }));
  }

  respondWithProblem(problemOrCode = 500.1) {
    return this.respond(() => mockResponse.problem(problemOrCode));
  }

  // Specifies a response to return for a matching request.
  respondIf(f, responseCallback) {
    return this._with({
      respondIf: [
        ...this._respondIf,
        [f, (config) => mockResponse.of(responseCallback(config))]
      ]
    });
  }

  restoreSession(restore = true) {
    if (!restore) return this.respondWithProblem(404.1);
    if (testData.extendedUsers.size === 0) throw new Error('user not found');
    const session = testData.sessions.size !== 0
      ? testData.sessions.last()
      : testData.sessions.createPast(1).last();
    return this
      .respondWithData(() => session)
      .respondWithData(() => testData.extendedUsers.first());
  }

  // respondForComponent() responds with all the responses expected for the
  // specified route component. Most tests should use respondFor() instead of
  // this method. `options` here work the same way as they do in respondFor().
  respondForComponent(componentName, options = undefined) {
    return requestDataByComponent(componentName).responses.reduce(
      (series, [resourceName, response]) => {
        const option = options?.[resourceName];
        if (option === false) return series;
        if (typeof response === 'function')
          return series.respond(() => mockResponse.of((option ?? response)()));
        if (Array.isArray(response))
          return series.respondIf(response[0], option ?? response[1]);
        throw new Error(`invalid response for component ${componentName}`);
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

    .respondFor('/projects/1', { forms: () => mockResponse.problem(500.1) }) is
    equivalent to:

      .respondWithData(() => testData.extendedProjects.last())
      .respondWithProblem(500.1)

    .respondFor('/projects/1', { forms: false }) is equivalent to:

      .respondWithData(() => testData.extendedProjects.last())
      // No response for `forms`

  In other words, a default response can be overriden with a callback that
  returns response data or a full response, or can be overriden with `false`.
  The property names of `options` correspond to resource names.
  */
  respondFor(location, options = undefined) {
    return routeComponents(resolveRoute(location)).reduce(
      (series, component) => series.respondForComponent(component.name, options),
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
    if (this._container == null) throw new Error('container required');
    if (this._location != null && this._container.router == null)
      throw new Error('container does not contain a router');
    return new MockHttp({
      container: this._container,
      previousPromise: this._executeSeries(optionsOrCallback)
    });
  }

  afterResponse(optionsOrCallback) {
    return this.afterResponses(optionsOrCallback);
  }

  complete() { return this.afterResponses(identity); }

  async _executeSeries({ callback, pollWork = undefined }) {
    if (this._previousPromise != null) {
      // Immediately reject if this._previousPromise is rejected. `component` is
      // the component that the previous promise mounted (if any).
      const { component } = await this._previousPromise;
      this._component = component;
    }

    this._requestWithoutResponse = false;
    this._orderedResponsesRequested = 0;
    this._orderedResponsesReturned = 0;
    this._errorFromBeforeAnyResponse = null;
    this._errorFromBeforeEachResponse = null;
    this._errorFromResponse = null;
    this._requestResponseLog = [];
    const { http, router } = this._container;
    http.respond(this._http());

    this._errorFromRouter = null;
    const removeRouterHandler = router != null
      ? router.onError(error => { this._errorFromRouter = error; })
      : noop;

    try {
      const routeBefore = router != null ? router.currentRoute.value : null;
      if (this._location != null) await router.push(this._location);
      if (this._mount != null) {
        this._component = this._mount();
        // Mounting may have triggered the initial navigation.
        if (router != null) await router.isReady();
      }

      if (this._request != null) {
        // If there has been a navigation, then wait for any async components
        // associated with the route to load.
        if (router != null && router.currentRoute.value !== routeBefore)
          await wait();

        this._checkStateBeforeRequest();
        await this._request(this._component);
      }
    } finally {
      // Wait for any responses to be processed.
      await wait();
      if (pollWork != null) await waitUntil(() => pollWork(this._component));
      http.respond(null);
      removeRouterHandler();
    }

    this._checkStateAfterWait();
    const callbackResult = await callback(this._component);
    return { component: this._component, result: callbackResult };
  }

  // Returns a function that responds with each of the specified responses in
  // turn.
  _http() {
    /*
    MockHttp uses two promises:

      1. The first promise is chained on this._previousPromise and returned by
         an after responses hook. Usually it is ultimately returned to Mocha.
      2. The second promise, stored here in `promise`, holds the responses,
         chained in order of request. `promise` is not returned to Mocha, but
         rather to Frontend from `http` in the container.

    The two promises are related: the first promise triggers one or more
    requests; for which responses are returned to Frontend through the second
    promise; then the first promise is returned to Mocha or whatever else comes
    after the hook.

    It is because the second promise is returned to Frontend and not Mocha that
    this._tryBeforeAnyResponse() and this._tryBeforeEachResponse() catch any
    error even though they are called within a promise chain. Those methods
    catch and store any error so that the after responses hook is able to reject
    the first promise if something unexpected happens in the second promise.
    */
    let promise = Promise.resolve();

    let requestCount = 0;
    // Tracks the responses returned from this._respondIf. We return each
    // response only once.
    const respondedIf = new Set();

    return (config) => {
      const requestToLog = pick(['method', 'url', 'headers', 'data'], config);
      if (requestToLog.method == null) requestToLog.method = 'GET';
      this._requestResponseLog.push(requestToLog);

      const index = requestCount;
      requestCount += 1;

      let responseCallback;
      let isOrdered = false;
      for (const [i, [f, ifCallback]] of this._respondIf.entries()) {
        if (!respondedIf.has(i) && f(config)) {
          responseCallback = () => ifCallback(config);
          respondedIf.add(i);
          break;
        }
      }
      if (responseCallback == null) {
        if (this._orderedResponsesRequested === this._orderedResponses.length) {
          this._requestWithoutResponse = true;
          return Promise.reject(new Error());
        }
        responseCallback = this._orderedResponses[this._orderedResponsesRequested];
        this._orderedResponsesRequested += 1;
        isOrdered = true;
      }

      promise = promise
        // If this is not the first response, and the previous response was an
        // error, then `promise` will be rejected. However, we need this part of
        // the promise chain to be fulfilled, because this response will not
        // necessarily be an error even if the previous one was.
        .catch(noop)
        .then(() => (index === 0 && this._beforeAnyResponse != null
          ? this._tryBeforeAnyResponse()
          : null))
        .then(() => (this._beforeEachResponse != null
          ? this._tryBeforeEachResponse(config, index)
          : null))
        .then(() => new Promise((resolve, reject) => {
          if (isOrdered) this._orderedResponsesReturned += 1;

          let response;
          try {
            response = responseCallback();
          } catch (e) {
            if (this._errorFromResponse == null) this._errorFromResponse = e;
            reject(e);
            return;
          }

          response.headers = new Map([['date', new Date()], ...(response.headers ?? [])]);

          // The response data returned by responseCallback may be mutated in
          // the future, e.g., by testData. We clone the response data before
          // adding it to the log to ensure that any such mutations do not
          // appear in the log.
          const cloneResponse = () => {
            const result = { ...response };
            const { data } = response;
            if (typeof data === 'object' && data != null)
              result.data = clone(data);
            return result;
          };
          this._requestResponseLog.push(cloneResponse());

          /* Before adding `config` to the response, we clone the response data
          once again, this time because Frontend may mutate the data (e.g.,
          requestData does this sometimes). We want to ensure that changes by
          testData don't reach Frontend and also that changes by Frontend don't
          reach the request/response log. It's for the latter reason that we
          don't pass the same cloned data to Frontend as we do the log. */
          const responseWithConfig = { ...cloneResponse(), config };
          if (response.status >= 200 && response.status < 300)
            resolve(responseWithConfig);
          else
            reject(mockAxiosError(responseWithConfig));
        }));
      return promise;
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

  _checkStateBeforeRequest() {
    // this.mount() and this.route() are allowed to result in requests, but if
    // they do, this.request() should not be specified.
    if (this._requestResponseLog.length === 0) return;
    this._listRequestResponseLog();
    throw new Error('a request was sent before the request() callback was run');
  }

  /* eslint-disable no-console */

  _listRequestResponseLog() {
    console.error('request/response log for the last series executed:');
    if (this._requestResponseLog.length === 0) {
      console.error('(empty)');
    } else {
      for (const entry of this._requestResponseLog)
        console.error(entry);
    }
  }

  _checkStateAfterWait() {
    if (this._errorFromRouter != null) {
      console.error(this._errorFromRouter);
      throw new Error('a navigation threw an error');
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

    if (this._requestWithoutResponse) {
      this._listRequestResponseLog();
      throw new Error('request without response: no response specified for request');
    } else if (this._orderedResponsesRequested < this._orderedResponses.length) {
      this._listRequestResponseLog();
      throw new Error('response without request: not all responses were requested');
    } else if (this._orderedResponsesReturned !== this._orderedResponses.length) {
      this._listRequestResponseLog();
      throw new Error('All responses were requested, but not all were returned in time. By default, all responses are expected to be returned in microtasks, before the next task. You may need to use the pollWork option of afterResponses().');
    }
  }

  /* eslint-enable no-console */

  //////////////////////////////////////////////////////////////////////////////
  // PROMISE METHODS

  toPromise() {
    const anySetup = this._container != null || this._location != null ||
      this._mount != null || this._request != null ||
      this._orderedResponses.length !== 0 || this._respondIf.length !== 0 ||
      this._beforeAnyResponse != null || this._beforeEachResponse != null;
    if (!anySetup && this._previousPromise == null) return Promise.resolve();
    const promise = anySetup
      ? this.complete()._previousPromise
      : this._previousPromise;
    return promise.then(({ result }) => result);
  }

  // The inclusion of these methods means that we can return a MockHttp to Mocha
  // in lieu of a Promise.
  then(...args) { return this.toPromise().then(...args); }
  catch(onRejected) { return this.toPromise().catch(onRejected); }
  finally(onFinally) { return this.toPromise().finally(onFinally); }
}

Object.assign(MockHttp.prototype, commonTests);

export const mockHttp = (container = undefined) => new MockHttp({ container });

// Mounts the component associated with the bottom-level route matching
// `location`, specifying props. If respondForOptions is not `false`, it will
// also set requestData and respond to the initial requests that the component
// sends.
const loadBottomComponent = (location, mountOptions, respondForOptions) => {
  const fullMountOptions = { ...mountOptions };
  const containerOption = fullMountOptions.container;
  if (containerOption == null || containerOption.install == null) {
    fullMountOptions.container = createTestContainer({
      router: mockRouter(location),
      ...containerOption
    });
  }
  const { container } = fullMountOptions;

  const { router, requestData } = container;
  const route = router.resolve(location);
  const components = routeComponents(route);
  const bottomComponent = last(components);

  const bottomRouteRecord = last(route.matched);
  const props = routeProps(route, bottomRouteRecord.props.default);
  fullMountOptions.props = bottomRouteRecord.meta.asyncRoute == null
    ? props
    : props.props;

  const allComposables = [];
  const allResponses = {};
  for (let i = 0; i < components.length - 1; i += 1) {
    const { composables, responses } = requestDataByComponent(components[i].name);
    allComposables.push(...composables);
    if (respondForOptions !== false) {
      for (const [name, response] of responses) {
        const option = respondForOptions != null
          ? respondForOptions[name]
          : null;
        if (option != null)
          allResponses[name] = option();
        // Ordered responses are set automatically, but conditional responses
        // are not. Without there being actual requests to match against, we
        // can't tell which conditional responses should be set.
        else if (typeof response === 'function')
          allResponses[name] = response();
      }
    }
  }
  if (allComposables.length !== 0) {
    withSetup(
      () => {
        for (const composable of allComposables)
          composable();
      },
      { container }
    );
  }
  setRequestData(requestData, allResponses);

  // A component may emit an event in order to ask its parent component to send
  // a request. However, loadBottomComponent() doesn't support that approach.
  const throwIfEmit = `${bottomComponent.name} emitted an event, but it is not expected to do so. In this case, root cannot be specified as false.`;

  return mockHttp()
    .mount(bottomComponent, fullMountOptions, throwIfEmit)
    .modify(series => (respondForOptions !== false
      ? series.respondForComponent(bottomComponent.name, respondForOptions)
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
      const type = typeof value;
      if (type === 'function' || type === 'number')
        throw new Error('invalid mount option');
    }
  }

  if (mountOptions != null && mountOptions.root === false) {
    const { root, ...optionsWithoutRoot } = mountOptions;
    return loadBottomComponent(location, optionsWithoutRoot, respondForOptions);
  }

  const optionsWithContainer = { ...mountOptions };
  const containerOption = optionsWithContainer.container;
  if (containerOption == null || containerOption.install == null) {
    optionsWithContainer.container = createTestContainer({
      router: testRouter(),
      ...containerOption
    });
  }
  // We will mount the component without waiting for the initial navigation to
  // be completed because that is the behavior in production for the root
  // component.
  setInstallLocation(optionsWithContainer.container.router, location);

  return mockHttp()
    .mount(App, optionsWithContainer)
    .modify(series => (respondForOptions !== false
      ? series.respondFor(location, respondForOptions)
      : series));
};
