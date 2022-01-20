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
import { computed } from 'vue';
import { construct } from 'ramda';

import createResources from './resources';

class RequestData {
  constructor(container) {
    const resources = createResources(container, this);
    Object.assign(this, resources);
    this.resources = Object.values(resources);
  }

  /*
  initiallyLoading() takes an array of resource keys and returns a computed
  value that is either `true` or `false`. The computed value is `true` if:

    1. There is at least one resource for which there is no data and for which a
       request is in progress. (This condition is not satisfied if there is
       already data for the resource, and the data is simply being refreshed.)
    2. There is no resource for which there is no data and for which a request
       is no longer in progress (because the request resulted in an unsuccessful
       response).

  Otherwise the computed value is `false`.
  */
  initiallyLoading(keys) {
    return computed(() => {
      let any = false;
      for (const key of keys) {
        const resource = this[key];
        if (resource.data == null) {
          if (!resource.awaitingResponse.value) return false;
          any = true;
        }
      }
      return any;
    });
  }

  dataExists(keys) {
    return computed(() => keys.every(key => this[key].data != null));
  }

  clear() {
    for (const resource of this.resources)
      resource.clear();
  }

  abortRequests() {
    for (const resource of this.resources)
      resource.abortRequest();
  }
}

export default construct(RequestData);
