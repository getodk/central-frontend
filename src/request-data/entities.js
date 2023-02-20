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
import { last } from 'ramda';
import { shallowReactive } from 'vue';

import { useRequestData } from './index';

export default () => {
  const { createResource } = useRequestData();
  const entityOData = createResource('odataEntities', () => ({
    transformResponse: ({ data, config }) => {
      const entityIds = new Set();
      for (const entity of data.value) {
        entityIds.add(entity.__id);
      }
      const { searchParams } = new URL(config.url, window.location.origin);
      return shallowReactive({
        value: shallowReactive(data.value),
        entityIds,
        count: data['@odata.count'],
        // The count of entities at the time of the initial fetch or last
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
      const lastCreatedDate = last(entityOData.value).__system.createdAt;
      for (const entity of chunk.value) {
        // If one or more entities have been created since the initial fetch
        // or last refresh, then the latest chunk of entities may include a
        // newly created entities or a entities that is already shown in the
        // table.
        if (entity.__system.createdAt <= lastCreatedDate &&
          !entityOData.entityIds.has(entity.__id)) {
          entityOData.value.push(entity);
          entityOData.entityIds.add(entity.__id);
        }
      }

      entityOData.count = chunk['@odata.count'];
      entityOData.skip += chunk.value.length;
    }
  }));
  return entityOData;
};
