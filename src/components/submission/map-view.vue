<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <geojson-map v-if="geojson.dataExists" :features="geojson.features"/>
  <odata-loading-message type="submission" :odata="geojson"
    :filter="filter != null" :refreshing="refreshing"
    :total-count="totalCount" :top="totalCount"/>
</template>

<script setup>
import { watch } from 'vue';

import GeojsonMap from '../geojson-map.vue';
import OdataLoadingMessage from '../odata-loading-message.vue';

import { apiPaths } from '../../util/request';
import { noargs, noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'SubmissionMapView'
});
const props = defineProps({
  // Props passed from FormSubmissions via SubmissionList
  projectId: {
    type: String,
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  },
  deleted: Boolean,

  // Table actions
  filter: Object,

  // Loading message
  refreshing: Boolean,
  totalCount: {
    type: Number,
    default: 0
  }
});

const { odata, createResource } = useRequestData();
const geojson = createResource('geojson', () => ({
  transformResponse: ({ data, config }) => {
    const { features } = data;
    odata.setFromResponse({
      data: {
        value: features.map(({ id }) => ({ __id: id })),
        '@odata.count': features.length
      },
      config
    });
    return data;
  }
}));

const fetchData = (clear = true) => {
  const query = !props.deleted
    ? props.filter
    : { ...props.filter, deleted: true };
  const url = apiPaths.submissions(
    props.projectId,
    props.xmlFormId,
    false,
    '.geojson',
    query
  );
  return geojson.request({ url, clear }).catch(noop);
};
fetchData();
watch([() => props.filter, () => props.deleted], noargs(fetchData));
const refresh = () => fetchData(false);

defineExpose({ refresh });
</script>
