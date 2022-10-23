/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { computed, isRef, readonly, toRef } from 'vue';

import { isProblem, logAxiosError, requestAlertMessage, withAuth } from '../util/request';
import { noop } from '../util/util';
import { setCurrentResource } from './util';
import { unlessFailure } from '../util/router';

const _store = Symbol('store');
// Subclasses must define a property named `data`.
class BaseResource {
  constructor(name, store) {
    // We don't use a Symbol for this property so that it is easy to access it
    // for display in testing. Not using a Symbol also means that calling
    // Object.keys() on the resource will return a non-empty array. Vue I18n
    // uses Object.keys() to determine whether an object is empty.
    this._name = name;
    this[_store] = store;
  }

  get awaitingResponse() { return this[_store].awaitingResponse; }

  get dataExists() { return this[_store].data != null; }
  get initiallyLoading() { return this.awaitingResponse && !this.dataExists; }

  toRefs() {
    return {
      awaitingResponse: readonly(toRef(this[_store], 'awaitingResponse')),
      initiallyLoading: computed(() => this.initiallyLoading),
      dataExists: computed(() => this.dataExists)
    };
  }

  patch(data) {
    this[_store].$patch(() => {
      if (typeof data === 'function')
        data(this.data);
      else
        Object.assign(this.data, data);
    });
  }
}

const _container = Symbol('container');
const _abortController = Symbol('abortController');
class Resource extends BaseResource {
  constructor(container, name, store) {
    super(name, store);
    this[_container] = container;
    this[_abortController] = null;
  }

  get data() { return this[_store].data; }
  set data(value) { this[_store].data = value; }
  toRefs() { return { ...super.toRefs(), data: toRef(this[_store], 'data') }; }

  cancelRequest() { if (this.awaitingResponse) this[_abortController].abort(); }

  reset() {
    if (this.dataExists || this.awaitingResponse) {
      this[_store].$patch(() => {
        this.data = null;
        this.cancelRequest();
      });
    }
  }

  transformResponse(response) { return response.data; }
  setFromResponse(response) { this.data = this.transformResponse(response); }

  /*
  request() sends a request and stores the response data. Specify a config
  object with the following properties:

    Request URL and Headers
    -----------------------

    - url. The URL of the request.
    - headers (optional). The headers of the request.
    - extended (default: false). `true` if extended metadata is requested and
      `false` if not.

    Response Handling
    -----------------

    - fulfillProblem (optional). Usually, an error response means that the
      request was invalid or that something went wrong. However, in some
      cases, an error response should be treated as if it is successful
      (resulting in a fulfilled, not a rejected, promise). Use fulfillProblem
      to identify such responses. fulfillProblem is passed the Backend
      Problem. (Any error response that is not a Problem is automatically
      considered unsuccessful.) fulfillProblem should return `true` if the
      response should be considered successful and `false` if not.
    - alert (default: true). Specify `true` to show an alert for an
      unsuccessful response and to log it. Specify `false` not to display an
      unsuccessful response.

    Existing Data
    -------------

    - patch (optional). By default, any existing data is completely replaced
      by the response data. To update only select properties of existing data,
      specify an array of property names for `patch`.
    - clear (default: true). Specify `true` if any existing data for the key
      should be cleared before the request is sent. Specify `false` for a
      background refresh. Note that by default, the data is cleared for all
      keys whenever the route changes. (There are exceptions to this, however:
      see the preserveData meta field for more information.)
    - resend (default: true)

      By default, get() sends a request for every config object specified,
      even if there is existing data for the corresponding key. However, if
      `resend` is specified as `false`, a request will not be sent if there is
      existing data for the key or if another request is in progress for the
      same key. Note that the entire request process will be short-circuited,
      so any existing data will not be cleared even if `clear` is specified as
      `true`.

      One common example of specifying `false` for `resend` arises with tabbed
      navigation. Say a component associated with one tab sends a request for
      a particular key. In most cases, navigating from that tab to another
      tab, then back to the original tab will unmount and recreate the
      component. However, in that case, we usually do not need to send a new
      request for the data that the component needs.

  Canceled Requests
  -----------------

  A request can be canceled if it is still in progress. This happens for one
  of two reasons:

    1. After the request is sent, another request is sent for the same key.
    2. When the route changes, the new route has the option to cancel one or
       more requests. (See router.js.)

  If a request is canceled, then if/when a response is received for the
  request, it will not be used.

  Return Value
  ------------

  get() returns a promise. The promise will be rejected if any of the requests
  is unsuccessful or is canceled. Otherwise the promise should be fulfilled.

  If you call then() on the promise, note that the `state` of each request
  will be 'success' when the then() callback is run, not 'loading'. If you
  call catch() on the promise, your logic should not assume that any request
  resulted in an error. Before running the then() or catch() callback, Vue
  will react to the changes to the store state, for example, running watchers
  and updating the DOM.
  */
  request({
    // The request
    method = 'GET',
    url,
    headers = undefined,
    extended = false,
    data = undefined,

    // Response handling
    fulfillProblem = undefined,
    alert: alertOption = true,
    problemToAlert = undefined,

    // Existing data
    patch = undefined,
    clear = method === 'GET' && patch == null,
    resend = true
  }) {
    /*
    We need to handle three cases:

      1. There is no data for the key, and we are not waiting on a request
         for it.

         Either there has been no request, or the last request was canceled.
         This should only be the case when Frontend first loads or after the
         route changes. In this case, we simply need to send a request.

      2. There is no data, but we are waiting on a request for it.

         We will return immediately if `resend` is `false`. Otherwise, we
         will cancel the last request and send a new request.

      3. There is data.

         We will return immediately if `resend` is `false`. Otherwise, we
         will refresh the data, canceling the last request if it is still in
         progress.
    */
    if (!resend && (this.dataExists || this.awaitingResponse))
      return Promise.resolve();
    if (this.awaitingResponse) this.cancelRequest();
    if (clear) {
      if (patch != null)
        throw new Error('cannot clear data to be patched');
      this.data = null;
    }

    const axiosConfig = { method, url };
    if (extended)
      axiosConfig.headers = { ...headers, 'X-Extended-Metadata': 'true' };
    else if (headers != null)
      axiosConfig.headers = headers;
    if (data != null) axiosConfig.data = data;

    const abortController = new AbortController();
    this[_abortController] = abortController;
    axiosConfig.signal = abortController.signal;
    const { router, i18n, requestData, alert, http, logger } = this[_container];
    // `router` may be `null` in testing.
    const removeHook = router == null || method === 'GET'
      ? noop
      : router.afterEach(unlessFailure(() => { abortController.abort(); }));

    this[_store].awaitingResponse = true;
    const cleanup = () => {
      // Each request is associated with its own AbortController. If another
      // request is sent for this same resource, then that will cancel this
      // request and immediately set this[_abortController] to the
      // AbortController associated with the new request. In that case, we will
      // let the new request complete this part of the cleanup.
      if (this[_abortController] === abortController) {
        this[_store].awaitingResponse = false;
        this[_abortController] = null;
      }

      // We can't call removeHook() in the same tick as the navigation hook.
      // (See src/util/router.js for related comments.) However, there shouldn't
      // be an issue here: if the navigation hook calls abortController.abort(),
      // then that will cause cleanup() to be called very soon, yet
      // asynchronously (in a different tick from the navigation hook).
      removeHook();
    };

    return http.request(withAuth(axiosConfig, requestData.session.token))
      .catch(error => {
        if (abortController.signal.aborted) {
          cleanup();
          throw new Error('request was canceled');
        }

        if (fulfillProblem != null && error.response != null &&
          isProblem(error.response.data) && fulfillProblem(error.response.data))
          return error.response;

        cleanup();

        if (alertOption) {
          logAxiosError(logger, error);
          alert.danger(requestAlertMessage(i18n, error, problemToAlert));
        }

        throw error;
      })
      .then(response => {
        cleanup();
        if (abortController.signal.aborted)
          throw new Error('request was canceled');

        if (patch == null) {
          this.setFromResponse(response);
        } else {
          if (!this.dataExists) throw new Error('data does not exist');
          this[_store].$patch(() => { patch(response, this); });
        }
      });
  }
}

const proxyHandler = {
  get: (resource, prop) => {
    if (prop in resource) return resource[prop];
    const { data } = resource;
    if (data == null) return undefined;
    const value = data[prop];
    return typeof value === 'function' ? value.bind(data) : value;
  },
  /* eslint-disable no-param-reassign */
  set: (resource, prop, value) => {
    if (prop in resource)
      resource[prop] = value;
    else
      resource.data[prop] = value;
    return true;
  }
  /* eslint-enable no-param-reassign */
};

export const createResource = (container, name, store, setup = undefined) => {
  const resource = new Resource(container, name, store);
  const proxy = new Proxy(resource, proxyHandler);

  if (setup != null) {
    const refs = {};
    setCurrentResource(proxy);
    for (const [key, value] of Object.entries(setup(proxy))) {
      if (isRef(value)) {
        Object.defineProperty(resource, key, { get: () => value.value });
        refs[key] = value;
      } else {
        resource[key] = value;
      }
    }
    setCurrentResource(null);

    if (Object.keys(refs).length !== 0) {
      resource.toRefs = () => ({
        ...Resource.prototype.toRefs.call(resource),
        ...refs
      });
    }
  }

  return proxy;
};

const _view = Symbol('view');
class ResourceView extends BaseResource {
  constructor(resource, lens) {
    const store = resource[_store];
    super(`${resource._name} view`, store);
    this[_view] = computed(() =>
      (store.data != null ? lens(store.data) : null));
  }

  get data() { return this[_view].value; }
  toRefs() { return { ...super.toRefs(), data: this[_view] }; }
}

export const resourceView = (resource, lens) =>
  new Proxy(new ResourceView(resource, lens), proxyHandler);
