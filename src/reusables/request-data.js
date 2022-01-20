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
import { map } from 'ramda';
import { unref } from 'vue';

/*
For components using the Options API, requestDataComputed() facilitates access
to requestData, returning functions that can be used as computed properties.
requestDataComputed() maps an object of functions to an object of computed
properties. Each function is passed requestData. For example:

  requestDataComputed({
    project: ({ project }) => project.data,
    fieldKeysWithToken: ({ fieldKeys }) => fieldKeys.withToken,
    dataExists: (requestData) => requestData.dataExists(['project', 'fieldKeys'])
  })

returns:

  {
    project() {
      return this.requestData.project.data;
    },
    fieldKeysWithToken() {
      return this.requestData.fieldKeys.withToken.value;
    },
    dataExists() {
      return this.requestData.dataExists(['project', 'fieldKeys']).value;
    }
  }

A component that uses requestDataComputed() must also inject requestData.
*/
// eslint-disable-next-line import/prefer-default-export
export const requestDataComputed = (fs) => map(
  // eslint-disable-next-line func-names
  (f) => function() { return unref(f(this.requestData)); },
  fs
);
