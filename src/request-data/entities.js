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
import { shallowReactive } from 'vue';

import { useRequestData } from './index';

export default () => {
  const { createResource } = useRequestData();
  const entityOData = createResource('odataEntities', () => ({
    transformResponse: ({ data, config }) => shallowReactive({
      value: shallowReactive(data.value),
      originalCount: data['@odata.count'],
      count: data['@odata.count'],
      deletedCount: 0,
      filtered: new URL(config.url, window.location.origin).searchParams.has('$filter'),
      nextLink: data['@odata.nextLink']
    }),
    addChunk: (chunk) => {
      for (const e of chunk.value) {
        entityOData.value.push(e);
      }
      entityOData.count = chunk['@odata.count'];
      entityOData.nextLink = chunk['@odata.nextLink'];
    },
    // countDeletion() updates the counts after an entity is deleted. We do not
    // modify entityOData.value when an entity is deleted: doing so is possible,
    // but it would cause EntityTable to re-render and overall doesn't seem
    // simpler.
    countDeletion: () => {
      // This change to entityOData.count will be overwritten if/when the next
      // chunk is received with the latest count. However, the change to
      // entityOData.deletedCount will persist as long as entityOData is not
      // cleared (e.g., when the refresh button is clicked or a filter is
      // changed).
      entityOData.count -= 1;
      entityOData.deletedCount += 1;
    }
  }));
  return entityOData;
};
