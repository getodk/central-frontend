/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { computed, readonly, ref, shallowRef } from 'vue';

import { chainSignals, request } from '../util/request';
import { noop } from '../util/util';

const _data = Symbol('data');
const _awaitingResponse = Symbol('awaitingResponse');

export default (container, resourceDebugger) => {
  /*
  A Resource sends requests for a particular type of response data. A Resource
  often corresponds to a single Backend endpoint. The `ref` property holds a ref
  whose value is the response data. The `data` property provides easy access to
  the ref's value. The awaitingResponse property indicates whether a request is
  in progress.

  If the data for a Resource is `null`, that means that either no response has
  been received for the Resource, or the data has been cleared. It does not mean
  that a response has been received, and the response data itself is `null` or
  does not exist.
  */
  class Resource {
    constructor(data) {
      this[_data] = data;
      this.ref = readonly(data);
      this[_awaitingResponse] = ref(false);
      this.awaitingResponse = readonly(this[_awaitingResponse]);
      this.abortRequest = noop;
    }

    get data() { return this.ref.value; }

    // transformResponse() transforms the response before it is stored. Many
    // resources will override this method.
    transformResponse(response) { return response.data; }

    setFromResponse(response) {
      this[_data].value = this.transformResponse(response);
    }

    clear() { this[_data].value = null; }

    /*
    The request() method sends a request, then uses the response data. It calls
    the request() function in src/util/request.js and accepts all the same
    options. It also accepts the following options:

      - update (optional). By default, any existing data is completely replaced
        by the response data. To update only select properties of existing data,
        specify an array of property names for `update`.
      - clear (default: true). Specify `true` if any existing data for the key
        should be cleared before the request is sent. Specify `false` for a
        background refresh. Note that by default, the data is cleared for all
        keys whenever the route changes. (There are exceptions to this, however:
        see the preserveData meta field for more information.)
      - resend (default: true)

        By default, request() sends a request for every config object specified,
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

      - onSuccess (optional). The request() method returns a promise. If you
        call then() on the promise, note that the request will not be in
        progress when the then() callback is run: this.awaitingResponse will be
        `false`, and the data for the resource will be modified. Before the
        then() or catch() callback is run, Vue will react to these changes,
        running watchers and updating the DOM. Often that is perfectly fine.
        However, if you must run a callback in the same tick as these changes,
        you can do so by specifying the callback using the onSuccess or onError
        option. Note that the onSuccess callback will be run after the data is
        reconciled, but before the validateData watchers.

    Aborting the Request
    --------------------

    The request() method can only send a single request at a time. If another
    request is sent before the previous one completes, the previous request will
    be aborted.

    By default, the request() method will also specify `true` for
    abortAfterNavigate if the request is not a GET request. The router will
    determine whether to abort a GET request based on the preservesData route
    meta field.
    */
    // eslint-disable-next-line consistent-return
    async request(config) {
      if (typeof config === 'string') return this.request({ url: config });
      if (resourceDebugger != null) resourceDebugger(config);
      const { method = 'GET' } = config;
      const {
        update = undefined,
        clear = !(method === 'PATCH' || update != null),
        resend = true,
        onSuccess = noop,
        ...requestConfig
      } = config;

      /*
      We need to handle three cases:

        1. There is no data for the resource, and we are not waiting on a
           request for it.

           In this case, we simply need to send a request.

        2. There is no data, but we are waiting on a request for it.

           We will return immediately if `resend` is `false`. Otherwise, we will
           abort the last request and send a new request.

        3. There is data.

           We will return immediately if `resend` is `false`. Otherwise, we will
           send a new request, aborting the last request if it is still in
           progress.
      */
      if (!resend && (this[_data].value != null || this[_awaitingResponse].value))
        return; // eslint-disable-line consistent-return
      this.abortRequest();
      if (clear) {
        if (update != null) throw new Error('cannot clear data to be updated');
        this.clear();
      }

      this[_awaitingResponse].value = true;

      const abortController = new AbortController();
      this.abortRequest = () => { abortController.abort(); };
      if (requestConfig.signal != null)
        chainSignals(requestConfig.signal, abortController);
      requestConfig.signal = abortController.signal;

      if (requestConfig.abortAfterNavigate == null)
        requestConfig.abortAfterNavigate = method !== 'GET';

      const cleanup = () => {
        this[_awaitingResponse].value = false;
        this.abortRequest = noop;
      };
      const { onError = noop } = requestConfig;
      requestConfig.onError = () => {
        cleanup();
        onError();
      };

      const response = await request(container, requestConfig);
      if (update == null)
        this.setFromResponse(response);
      else
        update(response, this);

      cleanup();
      onSuccess();
    }
  }

  const createRef = () => {
    const data = shallowRef(null);
    if (resourceDebugger == null) return data;
    return computed({
      get: () => data.value,
      set: (value) => {
        data.value = value;
        resourceDebugger('set data', value);
      }
    });
  };

  return (...extensions) => {
    const data = createRef();
    return extensions.reduce(
      (resource, extension) => Object.assign(Object.create(resource), extension(data)),
      new Resource(data)
    );
  };
};
