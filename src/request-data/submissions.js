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
import { reactive, shallowReactive } from 'vue';

import { computeIfExists } from './util';
import { useRequestData } from './index';

export default () => {
  const { createResource } = useRequestData();
  const odata = createResource('odata', () => ({
    transformResponse: ({ data, config }) => {
      for (const submission of data.value) {
        submission.__system = reactive(submission.__system);
      }
      const { searchParams } = new URL(config.url, window.location.origin);
      return shallowReactive({
        value: shallowReactive(data.value),
        count: data['@odata.count'],
        // The count of submissions at the time of the initial fetch or last
        // refresh
        originalCount: data['@odata.count'],
        filtered: searchParams.has('$filter'),
        nextLink: data['@odata.nextLink']
      });
    },
    addChunk(chunk) {
      for (const submission of chunk.value) {
        odata.value.push(submission);
      }

      odata.count = chunk['@odata.count'];
      odata.skip += chunk.value.length;
      odata.nextLink = chunk['@odata.nextLink'];
    }
  }));
  const submitters = createResource('submitters', () => ({
    ids: computeIfExists(() =>
      submitters.reduce((set, { id }) => set.add(id), new Set()))
  }));
  return { odata, submitters };
};
