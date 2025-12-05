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
  <map-view ref="view" :odata="odataEntities" :url="geojsonUrl"
    :loading="$t('loading')">
    <template #popup="{ feature, odata: odataElement, listeners }">
      <entity-map-popup :uuid="feature?.id" :odata="odataElement"
        :awaiting-response="awaitingResponses.has(feature?.id)"
        v-on="listeners"/>
    </template>
    <template #overlap="{ features, listeners }">
      <map-overlap-popup :features="features" :odata-url="overlapUrl"
        v-on="listeners">
        <template #title>
          {{ $tcn('overlapTitle', features != null ? features.length : 0) }}
        </template>
        <template #feature="{ odata: odataElement }">
          {{ odataElement.label }}
        </template>
      </map-overlap-popup>
    </template>
  </map-view>
</template>

<script setup>
import { computed, inject, ref } from 'vue';

import EntityMapPopup from './map-popup.vue';
import MapOverlapPopup from '../map/overlap-popup.vue';
import MapView from '../map/view.vue';

import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityMapView'
});
const props = defineProps({
  filter: Object,
  searchTerm: String,
  awaitingResponses: {
    type: Set,
    required: true
  }
});

const projectId = inject('projectId');
const datasetName = inject('datasetName');

const { odataEntities } = useRequestData();

const geojsonUrl = computed(() => {
  const query = { ...props.filter, $search: props.searchTerm };
  return apiPaths.entities(projectId, datasetName, '.geojson', query);
});
const overlapUrl = (query) =>
  apiPaths.odataEntities(projectId, datasetName, query);

const view = ref(null);
defineExpose({
  // Delegate these functions to the MapView.
  ...Object.fromEntries(['fetchData', 'cancelFetch', 'afterDelete']
    .map(name => [name, (...args) => view.value[name](...args)]))
});
</script>

<i18n lang="json5">
{
  "en": {
    "loading": "Preparing map. This could take a while.",
    "overlapTitle": "{count} Entity in this area | {count} Entities in this area"
  }
}
</i18n>
