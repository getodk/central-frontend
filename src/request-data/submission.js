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
import { reactive } from 'vue';

import { computeIfExists } from './util';
import { useRequestData } from './index';

export default () => {
  const { createResource } = useRequestData();
  const submission = createResource('submission', () => ({
    transformResponse: ({ data }) => {
      const result = data.value[0];
      result.__system = reactive(result.__system);
      return result;
    },
    instanceNameOrId: computeIfExists(() => {
      const { meta } = submission;
      return meta != null && typeof meta.instanceName === 'string'
        ? meta.instanceName
        : submission.__id;
    })
  }));
  const submissionVersion = createResource('submissionVersion');
  const audits = createResource('audits');
  const comments = createResource('comments');
  const diffs = createResource('diffs');
  return { submission, submissionVersion, audits, comments, diffs };
};
