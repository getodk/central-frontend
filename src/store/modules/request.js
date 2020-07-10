/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// This module sends GET requests and stores the resulting response data.

import Vue from 'vue';
import { mapState } from 'vuex';
import { pick } from 'ramda';

import Option from '../../util/option';
import reconcileData from './request/reconcile';
import { Presenter } from '../../presenters/base';
import { configForPossibleBackendRequest, isProblem, logAxiosError, requestAlertMessage } from '../../util/request';
import { getters as dataGetters, keys as allKeys, transforms } from './request/keys';

const updateData = (oldData, newData, props) => {
  if (oldData == null) throw new Error('data does not exist');
  if (oldData instanceof Option) {
    if (oldData.isEmpty()) throw new Error('data is an empty Option');
    return Option.of(updateData(oldData.get(), newData, props));
  }
  if (oldData instanceof Presenter) return oldData.with(pick(props, newData));
  return { ...oldData, ...pick(props, newData) };
};

export default {
  state: {
    // Using allKeys.reduce() in part so that `requests` has a reactive property
    // for each key.
    requests: allKeys.reduce(
      (acc, key) => {
        // An object used to manage requests for the key
        acc[key] = {
          // Information about the last request
          last: {
            promise: null,
            // 'loading', 'success', 'error', or 'canceled'.
            state: null
          },
          // Used to cancel requests.
          cancelId: 0
        };
        return acc;
      },
      {}
    ),
    /*
    `data` contains all response data, mapping each key to its data. `data` has
    a reactive property for each key.

    If the value of the property associated with a key is `null`, that means
    that either no response has been received for the key, or the associated
    data has been cleared. It does not mean that a response has been received
    for the key, and the data itself is simply null or nonexistent. To implement
    the latter case, transform the response and return an Option.
    */
    data: allKeys.reduce(
      (acc, key) => {
        acc[key] = null;
        return acc;
      },
      {}
    )
  },
  getters: {
    loading: ({ requests }) => (key) => requests[key].last.state === 'loading',
    /*
    Given an Array of keys, initiallyLoading() returns `true` if:

      1. There is at least one key for which there is no data and for which a
         request is in progress. (This condition is not satisfied if there is
         already data for the key, and the data is simply being refreshed.)
      2. There is no key for which the last request for the key was
         unsuccessful.

    Otherwise it returns `false`.
    */
    initiallyLoading: ({ requests, data }) => (keys) => {
      let any = false;
      for (const key of keys) {
        const { state } = requests[key].last;
        if (state === 'error') return false;
        if (state === 'loading' && data[key] == null) any = true;
      }
      return any;
    },
    dataExists: ({ data }) => (keys) => {
      for (const key of keys) {
        if (data[key] == null) return false;
      }
      return true;
    },
    ...dataGetters
  },
  mutations: {
    /* eslint-disable no-param-reassign */
    createRequest({ requests }, { key, promise }) {
      const lastRequest = requests[key].last;
      lastRequest.promise = promise;
      lastRequest.state = 'loading';
    },
    setRequestState({ requests }, { key, state }) {
      requests[key].last.state = state;
    },
    resetRequests({ requests }) {
      for (const key of allKeys) {
        const requestsForKey = requests[key];
        const { last } = requestsForKey;
        last.promise = null;
        last.state = null;
        requestsForKey.cancelId = 0;
      }
    },
    // Cancels the last request for the key.
    cancelRequest({ requests }, key) {
      const requestsForKey = requests[key];
      requestsForKey.last.state = 'canceled';
      requestsForKey.cancelId += 1;
    },
    setData({ data }, { key, value }) {
      data[key] = value;
    },
    setDataProp({ data }, { key, prop, value }) {
      const target = data[key] instanceof Option ? data[key].get() : data[key];
      Vue.set(target, prop, value);
    },
    clearData({ data }, key = undefined) {
      if (key != null) {
        data[key] = null;
      } else {
        for (const k of allKeys)
          data[k] = null;
      }
    }
    /* eslint-enable no-param-reassign */
  },
  actions: {
    /*
    get() sends one or more GET requests and stores the response data. Specify
    an array of config objects with the following properties, one for each
    request:

      - key. Specifies where to store the response data. If the request is
        successful and is not canceled, then the response data will be
        transformed, and the result will be stored at state.data[key]. See
        allKeys for the list of possible values of `key`.

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
      - success (optional)

        Callback to run if the request is successful and is not canceled. get()
        also returns a promise, on which you can call then() and catch(). (See
        "Return Value" below for more information.) There are two times when you
        may wish to use `success` rather than then():

        1. If get() is used to send multiple requests, a different `success`
           callback can be specified for each request. On the other hand, the
           promise will be fulfilled only after all requests succeed.
        2. A then() or catch() callback will be run after Vue has reacted to the
           changes to the store state. Often that is fine, but if you want to
           run a callback before Vue reacts, specify `success`. As a rule of
           thumb, if the callback changes local state that is only used in the
           DOM, use then(). If the callback changes the store state or changes
           local state that is used outside the DOM, avoid inconsistent state by
           specifying `success`.

      Existing Data
      -------------

      - update (optional). By default, any existing data is completely replaced
        by the response data. To update only select properties of existing data,
        specify an array of property names for `update`.
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
        tab, then back to the original tab will destroy and recreate the
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
    get({ state, getters, commit }, configs) {
      let alerted = false;
      return Promise.all(configs.map(config => {
        const {
          key,

          // Request URL and headers
          url,
          headers = undefined,
          extended = false,

          // Response handling
          fulfillProblem = undefined,
          alert = true,
          success,

          // Existing data
          update = undefined,
          clear = update == null,
          resend = true
        } = config;

        if (clear && update != null)
          throw new Error('cannot clear data to be updated');

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
        const { data } = state;
        const requestsForKey = state.requests[key];
        const lastRequest = requestsForKey.last;
        if (!resend && (data[key] != null || lastRequest.state === 'loading'))
          return Promise.resolve();
        if ((data[key] == null && lastRequest.state === 'loading') ||
          data[key] != null) {
          if (lastRequest.state === 'loading') commit('cancelRequest', key);
          if (data[key] != null && clear) commit('clearData', key);
        }
        const { cancelId } = requestsForKey;

        const baseConfig = { method: 'GET', url };
        baseConfig.headers = extended
          ? { ...headers, 'X-Extended-Metadata': 'true' }
          : headers;
        const token = getters.loggedIn ? data.session.token : null;
        const axiosConfig = configForPossibleBackendRequest(baseConfig, token);

        const promise = Vue.prototype.$http.request(axiosConfig)
          .catch(error => { // eslint-disable-line no-loop-func
            if (requestsForKey.cancelId !== cancelId)
              throw new Error('request was canceled');

            if (fulfillProblem != null && error.response != null &&
              isProblem(error.response.data) &&
              fulfillProblem(error.response.data))
              return error.response;

            if (alert) {
              logAxiosError(error);
              if (!alerted) {
                const message = requestAlertMessage(error);
                commit('setAlert', { type: 'danger', message });
                alerted = true;
              }
            }

            commit('setRequestState', { key, state: 'error' });

            throw error;
          })
          .then(response => {
            if (requestsForKey.cancelId !== cancelId)
              throw new Error('request was canceled');
            commit('setRequestState', { key, state: 'success' });

            if (update == null) {
              const transform = transforms[key];
              const transformed = transform != null
                ? transform(response)
                : response.data;
              commit('setData', { key, value: transformed });
            } else {
              commit('setData', {
                key,
                value: updateData(data[key], response.data, update)
              });
            }

            reconcileData.reconcile(key, data, commit);

            if (success != null) success(data);
          });
        commit('createRequest', { key, promise });
        return promise;
      }));
    }
  }
};

/*
requestData() facilitates access to the response data, returning functions that
can be used for computed properties. (It probably would have been more accurate
to name it responseData().)

requestData() takes a single parameter, an array specifying the keys for the
data to which the component requires access. For each element of the array,
specify either a key or an object.

Examples:

// The component requires access to `project` and `form`.
requestData(['project', 'form'])

// The component also requires access to formDraft, which is an Option. Because
// getOption is specified as `true`, get() will be called on the Option. The
// resulting value, not the Option, will be passed to the component.
requestData(['project', 'form', { key: 'formDraft', getOption: true }])
*/
export const requestData = (options) => {
  const map = {};
  for (const keyOptions of options) {
    if (typeof keyOptions === 'string') {
      map[keyOptions] = (state) => state.request.data[keyOptions];
    } else {
      const { key, getOption = false } = keyOptions;
      if (!getOption) {
        map[key] = (state) => state.request.data[key];
      } else {
        map[key] = (state) => {
          const value = state.request.data[key];
          return value != null ? value.get() : null;
        };
      }
    }
  }
  return mapState(map);
};
