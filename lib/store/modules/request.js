/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';
import { DateTime } from 'luxon';
import { mapState } from 'vuex';

import BackupsConfig from '../../presenters/backups-config';
import FieldKey from '../../presenters/field-key';
import Form from '../../presenters/form';
import FormAttachment from '../../presenters/form-attachment';
import User from '../../presenters/user';
import { configForPossibleBackendRequest, logAxiosError, requestAlertMessage } from '../../util/request';

// Each type of response data that this module manages is associated with a key.
const allKeys = [
  'session',
  'currentUser',

  'projects',
  'project',
  'forms',
  'form',
  'schema',
  'attachments',
  'submissionsChunk',
  'managers',
  'fieldKeys',

  'users',

  'backupsConfig'
];

// Functions to transform response data (by key)
const transforms = {
  session: ({ data }) => ({
    token: data.token,
    expiresAt: DateTime.fromISO(data.expiresAt).toMillis()
  }),
  currentUser: ({ data }) => new User(data),

  forms: ({ data }) => data.map(form => new Form(form)),
  form: ({ data }) => new Form(data),
  attachments: ({ data }) =>
    data.map(attachment => new FormAttachment(attachment)),
  fieldKeys: ({ config, data }) => {
    const projectId = config.url.split('/')[3];
    return data.map(fieldKey => new FieldKey(projectId, fieldKey));
  },

  backupsConfig: (response) => BackupsConfig.fromResponse(response)
};

export default {
  state: {
    // Using allKeys.reduce() in part so that there is a reactive property for
    // each key.
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
    // `data` has a reactive property for each key. However, if the value of a
    // reactive property is itself a object, that object's properties are not
    // reactive. If you need one of them to be, use setDataProp().
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
      2. There is no key for which the last request for the key resulted in an
         error.

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
    loggedIn: ({ data }) => data.session != null && data.session.token != null,
    loggedOut: (_, getters) => !getters.loggedIn
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
      Vue.set(data[key], prop, value);
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

      - validateStatus (optional). Passed to axios.
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

      - problemToAlert (optional). If the request results in an error, get()
        shows an alert. By default, the alert message is the same as that of the
        Backend Problem. However, if a function is specified for problemToAlert,
        get() first passes the Problem to the function, which has the option to
        return a different message. If the function returns `null` or
        `undefined`, the default message is used.

      Other
      -----

      - clear (default: true). Specify `true` if any existing data for the key
        should be cleared before the request is sent. Specify `false` for a
        background refresh. Note that by default, the data is cleared for all
        keys whenever the route changes. (There are exceptions to this, however:
        see the preserveData meta field in router.js for more information.)

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
    results in an error or is canceled. Otherwise the promise should be
    fulfilled.

    If you call then() on the promise, note that the `state` of each request
    will be 'success' when the then() callback is run, not 'loading'. If you
    call catch() on the promise, your logic should not assume that any request
    resulted in an error. Before running the then() or catch() callback, Vue
    will react to the changes to the store state, for example, running watchers
    and updating the DOM.
    */
    get({ state, getters, commit }, configs) {
      let firstError = true;
      return Promise.all(configs.map(config => {
        const {
          key,

          // Request URL and headers
          url,
          headers = undefined,
          extended = false,

          // Response handling
          validateStatus = undefined,
          success,
          problemToAlert = undefined,

          // Other
          clear = true
        } = config;

        /*
        We need to handle three cases:

          1. There is no data for the key, and we are not waiting on a request
             for it.

             Either there has been no request, or the last request was canceled.
             This should only be the case when Frontend first loads or after the
             route changes. In this case, we simply need to send a request.

          2. There is no data, but we are waiting on a request for it.

             We will cancel the last request and send a new request.

          3. There is data.

             We will refresh the data, canceling the last request if it is still
             in progress.
        */
        const requestsForKey = state.requests[key];
        const lastRequest = requestsForKey.last;
        if ((state.data[key] == null && lastRequest.state === 'loading') ||
          state.data[key] != null) {
          if (lastRequest.state === 'loading') commit('cancelRequest', key);
          if (state.data[key] != null && clear) commit('clearData', key);
        }
        const { cancelId } = requestsForKey;

        const baseConfig = { method: 'GET', url };
        baseConfig.headers = extended
          ? { ...headers, 'X-Extended-Metadata': 'true' }
          : headers;
        if (validateStatus != null) baseConfig.validateStatus = validateStatus;
        const token = getters.loggedIn ? state.data.session.token : null;
        const axiosConfig = configForPossibleBackendRequest(baseConfig, token);

        const promise = Vue.prototype.$http.request(axiosConfig)
          .catch(error => { // eslint-disable-line no-loop-func
            if (requestsForKey.cancelId !== cancelId)
              throw new Error('request was canceled');

            logAxiosError(error);
            if (firstError) {
              const message = requestAlertMessage(error, problemToAlert);
              commit('setAlert', { type: 'danger', message });
            }

            commit('setRequestState', { key, state: 'error' });

            firstError = false;
            throw error;
          })
          .then(response => {
            if (requestsForKey.cancelId !== cancelId)
              throw new Error('request was canceled');
            commit('setRequestState', { key, state: 'success' });
            const transform = transforms[key];
            const transformed = transform != null
              ? transform(response)
              : response.data;
            commit('setData', { key, value: transformed });
            if (success != null) success(state.data);
          });
        commit('createRequest', { key, promise });
        return promise;
      }));
    }
  }
};

export const requestData = (keys) => {
  const map = {};
  for (const key of keys)
    map[key] = (state) => state.request.data[key];
  return mapState(map);
};

export const keys = allKeys;
