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
      type="submission" :filter="filter != null" :total-count="0" :top="0"/>
    <geojson-map :data="geojson.data" :sizer="sizeMap"
      @show="showMap(true)" @shown="showMap(false)"
      @selection-changed="selectionChanged"/>
    <submission-map-popup v-if="selection != null" :instance-id="selection.id"
      :fieldpath="selection.properties.fieldpath"
      :coordinates="selection.coordinates"/>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref, shallowRef, useTemplateRef, watch } from 'vue';

import OdataLoadingMessage from '../odata-loading-message.vue';
import SubmissionMapPopup from './map-popup.vue';

import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
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
  filter: Object
});

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
        value: features.map(({ id }) => ({ __id: id })),
        '@odata.count': features.length
      },
      config
    });

    // After setting `odata`, return the GeoJSON unchanged.
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

const showingMap = ref(false);
const showMap = (showing) => { showingMap.value = showing; };

const el = useTemplateRef('el');
// Stretches the map to the bottom of the screen.
const sizeMap = () => {
  const rect = el.value.getBoundingClientRect();
  if (rect.height === 0) return '';

  const padding = 15;
  // Not sure why this correction is needed. Without it, the map seems to
  // overflow slightly.
  const correction = -2;
  return document.documentElement.clientHeight - rect.top - padding + correction;
};

const selection = shallowRef(null);
const selectionChanged = (value) => { selection.value = value; };

defineExpose({ refresh });
</script>

<style lang="scss">
#submission-map-view {
  position: relative;
}
</style>
