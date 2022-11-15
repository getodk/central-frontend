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
import { last } from 'ramda';
import { reactive, shallowReactive } from 'vue';

import { computeIfExists } from './util';
import { useRequestData } from './index';

export default () => {
  const { createResource } = useRequestData();
  const odata = createResource('odata', () => ({
    transformResponse: ({ data, config }) => {
      const instanceIds = new Set();
      for (const submission of data.value) {
        submission.__system = reactive(submission.__system);
        instanceIds.add(submission.__id);
      }
      const { searchParams } = new URL(config.url, window.location.origin);
      return shallowReactive({
        value: shallowReactive(data.value),
        instanceIds,
        count: data['@odata.count'],
        // The count of submissions at the time of the initial fetch or last
        // refresh
        originalCount: data['@odata.count'],
        // odata.skip is the number of submissions that have been fetched so
        // far, which will need to be skipped in the next request. odata.skip
        // will often equal odata.value.length, but the two may diverge. For
        // example, if a submission has been created since the initial fetch or
        // last refresh, it won't added to odata.value, but it will need to be
        // skipped.
        skip: data.value.length,
        filtered: searchParams.has('$filter')
      });
    },
    addChunk(chunk) {
      const lastSubmissionDate = last(odata.value).__system.submissionDate;
      for (const submission of chunk.value) {
        // If one or more submissions have been created since the initial fetch
        // or last refresh, then the latest chunk of submissions may include a
        // newly created submission or a submission that is already shown in the
        // table.
        if (submission.__system.submissionDate <= lastSubmissionDate &&
          !odata.instanceIds.has(submission.__id)) {
          odata.value.push(submission);
          odata.instanceIds.add(submission.__id);
        }
      }

      odata.count = chunk['@odata.count'];
      odata.skip += chunk.value.length;
    }
  }));
  const submitters = createResource('submitters', () => ({
    ids: computeIfExists(() =>
      submitters.reduce((set, { id }) => set.add(id), new Set()))
  }));
  return { odata, submitters };
};
