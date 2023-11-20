/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { reactive } from 'vue';

import { useRequestData } from './index';

export default () => {
  const { createResource } = useRequestData();
  const entity = createResource('entity', () => ({
    transformResponse: ({ data }) => reactive(data)
  }));
  const audits = createResource('audits');
  const entityVersions = createResource('entityVersions', () => ({
    transformResponse: ({ data }) => {
      for (const version of data)
        version.conflictingProperties = new Set(version.conflictingProperties);
      return data;
    }
  }));
  return { entity, audits, entityVersions };
};
