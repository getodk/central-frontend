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
  <div id="map-view" ref="el">
    <Loading :state="geojson.initiallyLoading || showingMap"
      :message="loading"/>
    <geojson-map ref="map" :data="geojson.data" :sizer="sizeMap"
      @show="setShowing(true)" @shown="setShowing(false)"
      @selection-changed="selectionChanged" @hit="handleHit"/>
    <slot name="popup" v-bind="selection" :listeners="popupListeners"></slot>
    <div v-show="selection == null">
      <slot name="overlap" :features="overlap" :listeners="overlapListeners"></slot>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref, shallowRef, useTemplateRef, watch, watchSyncEffect } from 'vue';

import Loading from '../loading.vue';

import { loadAsync } from '../../util/load-async';
import { noargs, noop } from '../../util/util';
import { styleBox } from '../../util/dom';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'MapView'
});
const props = defineProps({
  url: {
    type: String,
    required: true
  },
  odata: {
    type: Object,
    required: true
  },
  // Loading message
  loading: {
    type: String,
    required: true
  }
});

const GeojsonMap = defineAsyncComponent(loadAsync('GeojsonMap'));

const { createResource } = useRequestData();
const geojson = createResource('geojson', () => ({
  transformResponse: ({ data, config }) => {
    // After the GeoJSON response is received, we also set `odata`, as if we
    // received an OData response. That's needed because `odata` drives much of
    // the logic in SubmissionList (and EntityList). For a long time,
    // SubmissionList was only a table and only cared about OData. When we set
    // `odata`, we set as little data as possible in order to minimize the
    // memory footprint.
    const { features } = data;
    props.odata.setFromResponse({
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
// eslint-disable-next-line vue/no-mutating-props
watchSyncEffect(() => { if (geojson.data == null) props.odata.data = null; });

const fetchData = (clear = true) => {
  if (clear) props.odata.reset();
  return geojson.request({ url: props.url, clear }).catch(noop);
};
fetchData();
watch(() => props.url, noargs(fetchData));
// For defineExpose()
const cancelFetch = () => { geojson.cancelRequest(); };

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
  selection.value = feature != null ? { feature } : null;
};

const overlap = shallowRef(null);
const handleHit = (hits) => { overlap.value = hits.length > 1 ? hits : null; };
watch(() => geojson.data, () => { overlap.value = null; });

const map = useTemplateRef('map');
const hidePopup = () => {
  map.value.selectFeature(null);
  overlap.value = null;
};
const backToOverlap = () => { map.value.selectFeature(null); };
const popupListeners = { hide: hidePopup, back: backToOverlap };

const overlapListeners = {
  hide: hidePopup,
  preview: (data) => {
    map.value.selectFeature(data != null ? data.feature.id : null, false);
  },
  select: (data) => {
    map.value.selectFeature(data.feature.id, false);
    selection.value = data;
  }
};

const afterDelete = (instanceId) => {
  map.value.removeFeature(instanceId);
  if (overlap.value != null) {
    overlap.value = overlap.value.length > 1
      ? overlap.value.filter(feature => feature.id !== instanceId)
      : null;
  }

  props.odata.value.length -= 1; // eslint-disable-line vue/no-mutating-props
};

defineExpose({ fetchData, cancelFetch, afterDelete });
</script>

<style lang="scss">
#map-view {
  position: relative;

  .loading { color: #555; }
  .page-section:has(&) { margin-bottom: 15px; }
}
</style>
