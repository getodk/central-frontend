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
  <div id="submission-map-view" ref="el">
    <odata-loading-message :state="geojson.initiallyLoading || showingMap"
      type="submission" :filter="filter != null"/>
    <geojson-map ref="map" :data="geojson.data" :sizer="sizeMap"
      @show="setShowing(true)" @shown="setShowing(false)"
      @selection-changed="selectionChanged" @hit="handleHit"/>
    <submission-map-popup :project-id="projectId" :xml-form-id="xmlFormId"
      v-bind="selection" :awaiting-response="awaitingResponses.has(selection?.instanceId)"
      @hide="hidePopup" @back="backToOverlap"
      @review="$emit('review', $event)" @delete="$emit('delete', $event)"/>
    <div v-show="selection == null">
      <map-overlap-popup :features="overlap" :odata-url="overlapUrl"
        @hide="hidePopup" @preview="overlapPreview" @select="overlapSelect">
        <template #title>
          {{ $tcn('overlapTitle', overlap != null ? overlap.length : 0) }}
        </template>
        <template #feature="slotProps">
          {{ slotProps.odata.meta?.instanceName ?? slotProps.odata.__id }}
        </template>
      </map-overlap-popup>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref, shallowRef, useTemplateRef, watch } from 'vue';

import MapOverlapPopup from '../map-overlap-popup.vue';
import OdataLoadingMessage from '../odata-loading-message.vue';
import SubmissionMapPopup from './map-popup.vue';

import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { noargs, noop } from '../../util/util';
import { styleBox } from '../../util/dom';
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

  // Table actions
  filter: Object,

  awaitingResponses: {
    type: Set,
    required: true
  }
});
defineEmits(['review', 'delete']);

const GeojsonMap = defineAsyncComponent(loadAsync('GeojsonMap'));

const { odata, createResource } = useRequestData();
const geojson = createResource('geojson', () => ({
  transformResponse: ({ data, config }) => {
    // After the GeoJSON response is received, we also set `odata`, as if we
    // received an OData response. That's needed because `odata` drives much of
    // the logic in SubmissionList. For a long time, SubmissionList was only a
    // table and only cared about OData. When we set `odata`, we set as little
    // data as possible in order to minimize the memory footprint.
    const { features } = data;
    odata.setFromResponse({
      data: {
        value: new Array(features.length),
        '@odata.count': features.length
      },
      config
    });

    // After setting `odata`, return the GeoJSON unchanged.
    return data;
  }
}));

const fetchData = (clear = true) => {
  const url = apiPaths.submissions(
    props.projectId,
    props.xmlFormId,
    false,
    '.geojson',
    props.filter
  );
  return geojson.request({ url, clear }).catch(noop);
};
fetchData();
watch(() => props.filter, noargs(fetchData));
const refresh = () => fetchData(false);
const cancelRefresh = () => { geojson.cancelRequest(); };

const showingMap = ref(false);
const setShowing = (value) => { showingMap.value = value; };
watch(() => geojson.dataExists, (dataExists) => {
  // We need to set showingMap.value to `false` if the data is cleared between
  // the `show` and `shown` events of the GeojsonMap.
  if (!dataExists) setShowing(false);
});

const el = useTemplateRef('el');
// Stretches the map to the bottom of the screen.
const sizeMap = () => {
  const rect = el.value.getBoundingClientRect();
  if (rect.height === 0) return '';
  const section = el.value.closest('.page-section');
  const { marginBottom } = styleBox(getComputedStyle(section));
  return document.documentElement.clientHeight - rect.top - marginBottom;
};

const selection = shallowRef(null);
const selectionChanged = (feature) => {
  selection.value = feature != null
    ? { instanceId: feature.id, fieldpath: feature.properties.fieldpath }
    : null;
};

const map = useTemplateRef('map');

const overlap = shallowRef(null);
const handleHit = (hits) => { overlap.value = hits.length > 1 ? hits : null; };
watch(() => geojson.data, () => { overlap.value = null; });
const overlapUrl = (query) =>
  apiPaths.odataSubmissions(props.projectId, props.xmlFormId, false, query);
const overlapPreview = (data) => {
  map.value.selectFeature(data != null ? data.feature.id : null, false);
};
const overlapSelect = (data) => {
  const { feature } = data;
  map.value.selectFeature(feature.id, false);
  selection.value = {
    instanceId: feature.id,
    fieldpath: feature.properties.fieldpath,
    odata: data.odata
  };
};

const hidePopup = () => {
  map.value.selectFeature(null);
  overlap.value = null;
};
const backToOverlap = () => {
  map.value.selectFeature(null);
};

const afterDelete = (instanceId) => {
  map.value.removeFeature(instanceId);
  if (overlap.value != null) {
    overlap.value = overlap.value.length > 1
      ? overlap.value.filter(feature => feature.id !== instanceId)
      : null;
  }

  odata.value.length -= 1;
};

defineExpose({ refresh, cancelRefresh, afterReview: noop, afterDelete });
</script>

<style lang="scss">
#submission-map-view {
  position: relative;

  .page-section:has(&) { margin-bottom: 15px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "overlapTitle": "{count} Submission in this area | {count} Submissions in this area"
  }
}
</i18n>
