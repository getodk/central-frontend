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
  <div v-show="featureCount !== 0" ref="el" class="geojson-map">
    <div ref="mapContainer" class="map-container" :class="{ opaque: shown }" tabindex="0" :inert="!shown"></div>
    <div v-show="shown">
      <span class="count">{{ countMessage }}</span>
      <div class="control-bar">
        <button v-tooltip.aria-describedby="$t('zoomToFit')" type="button"
          @click="fitViewToAllFeatures()">
          <!-- eslint-disable-next-line vuejs-accessibility/alt-text -->
          <img class="fit-icon" :src="FitIcon">
        </button>
      </div>
      <GeojsonMapDevTools v-if="config.devTools" v-model:max-zoom="maxZoom"
        v-model:cluster="showsClusters"
        v-model:cluster-distance="clusterDistance"
        v-model:cluster-min-distance="clusterMinDistance"
        v-model:overlap-hint="showsOverlapHints" :zoom="zoomLevel"/>
    </div>
  </div>
</template>

<script setup>
// OpenLayers
import Cluster from 'ol/source/Cluster';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import Zoom from 'ol/control/Zoom';
import { boundingExtent, createEmpty, extend, getCenter } from 'ol/extent';
import { get as getProjection } from 'ol/proj';

import { equals } from 'ramda';
import { computed, inject, onBeforeUnmount, onMounted, useTemplateRef, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import FitIcon from '../assets/images/geojson-map/fullscreen.svg';
import GeojsonMapDevTools from './geojson-map/dev-tools.vue';

import useEventListener from '../composables/event-listener';
import { getStyles, getTextStyles } from '../util/map-styles';
import { noop } from '../util/util';
import { px } from '../util/dom';

const props = defineProps({
  data: Object,
  // Function to set the height of the map
  sizer: {
    type: Function,
    default: noop
  }
});
const emit = defineEmits(['show', 'shown', 'hit', 'selection-changed']);

const { t, n } = useI18n();
const { config, buildMode } = inject('container');

// eslint-disable-next-line no-console
const log = config.devTools ? console.log.bind(console) : noop;

// Constants
const animationDuration = 1000;

const el = useTemplateRef('el');
const mapContainer = useTemplateRef('mapContainer');



////////////////////////////////////////////////////////////////////////////////
// OPENLAYERS OBJECTS

const baseLayer = new TileLayer({ source: new OSM() });

const style = getStyles();
// We use WebGL for performance reasons. WebGL isn't available in our current
// testing setup, so in test, we fall back to a basic 2D canvas.
const createWebGLLayer = (source) => (buildMode === 'test'
  ? new VectorLayer({ source })
  : new WebGLVectorLayer({
    source,
    // It's not really useful to pass these options to VectorLayer in test.
    // VectorLayer doesn't even support `variables`.
    style,
    variables: { selectedId: '' }
  }));

const featureSource = new VectorSource();
const featureLayer = createWebGLLayer(featureSource);

const projection = 'EPSG:3857';
const mapInstance = new Map({
  layers: [baseLayer, featureLayer],
  // The `extent` option is needed to prevent issues related to map cloning,
  // which happens when panning at low zoom. See
  // https://github.com/getodk/central-frontend/pull/1384
  view: new View({ projection, extent: getProjection(projection).getExtent() }),
  controls: [new Zoom()]
});



////////////////////////////////////////////////////////////////////////////////
// CLUSTERING

const clusterSource = new Cluster({
  source: featureSource,
  geometryFunction: (feature) => {
    const geometry = feature.getGeometry();
    switch (geometry.getType()) {
      case 'Point': return geometry;
      case 'LineString': return new Point(geometry.getCoordinateAt(0.5));
      case 'Polygon': return geometry.getInteriorPoint();
      default: return new Point(getCenter(geometry.getExtent()));
    }
  },
  createCluster: (point, features) => (features.length === 1
    ? features[0]
    : new Feature({
      geometry: point,
      features,
      clusterSize: n(features.length, 'default')
    }))
});

const clusterDistance = ref(40);
const clusterMinDistance = ref(10);
watch(
  clusterDistance,
  (value) => { clusterSource.setDistance(value); },
  { immediate: true }
);
watch(
  clusterMinDistance,
  (value) => { clusterSource.setMinDistance(value); },
  { immediate: true }
);

const clusterLayer = createWebGLLayer(clusterSource);
mapInstance.addLayer(clusterLayer);

// WebGLVectorLayer doesn't seem to support text styles, so cluster sizes go in
// a separate layer.
const clusterSizeLayer = new VectorLayer({
  source: clusterSource,
  style: getTextStyles()
});
mapInstance.addLayer(clusterSizeLayer);

const showsClusters = ref(true);
// Many base layers offer tiles up to a zoom level of 18 or 19. Beyond that, the
// tiles can get blurry.
const maxZoom = ref(19);
watch(
  [showsClusters, maxZoom],
  () => {
    // Only show clusters when the zoom level is below maxZoom. Subtracting
    // 0.001 because the maxZoom option here is inclusive.
    clusterLayer.setMaxZoom(showsClusters.value ? maxZoom.value - 0.001 : -1);
    clusterSizeLayer.setMaxZoom(clusterLayer.getMaxZoom());

    // Only show featureLayer once clusters are no longer shown.
    featureLayer.setMinZoom(clusterLayer.getMaxZoom());
  },
  { immediate: true }
);

const isCluster = (feature) => feature.get('clusterSize') != null;



////////////////////////////////////////////////////////////////////////////////
// ADD/REMOVE FEATURES

const featureCount = ref(0);

const addFeatures = () => {
  if (props.data == null) return;

  const features = new GeoJSON().readFeatures(props.data, {
    featureProjection: mapInstance.getView().getProjection()
  });
  if (features.length === 0) return;

  // Copy each feature's id into properties so that it can be accessed from
  // OpenLayers style rules.
  for (const feature of features) feature.set('id', feature.getId());

  featureSource.addFeatures(features);
  featureCount.value = features.length;
  log('features added');
};

const removeFeatures = () => {
  if (featureCount.value === 0) return;
  featureSource.clear(true);
  featureCount.value = 0;
  log('features removed');
};



////////////////////////////////////////////////////////////////////////////////
// RESIZE MAP

const resize = () => {
  const { sizer } = props;
  const result = sizer();
  if (result != null) {
    // Here, we set the element's min-height, not its full height.
    // .map-container also has a min-height, and if that's greater than the
    // min-height here, the element will be taller than its min-height.
    el.value.style.minHeight = typeof result === 'number'
      ? (result > 0 ? px(result) : '')
      : result;
  }

  // .map-container seems to need a concrete height to be set on it (e.g.,
  // setting `height: 100%;` in CSS didn't work).
  mapContainer.value.style.height = px(el.value.getBoundingClientRect().height);

  const oldSize = mapInstance.getSize();
  mapInstance.updateSize();
  if (!equals(mapInstance.getSize(), oldSize)) log('resized');
};



////////////////////////////////////////////////////////////////////////////////
// VIEW

const fitView = (extent, options = undefined) => {
  mapInstance.getView().fit(extent, {
    // We need to provide enough space for styled features.
    padding: [50, 50, 50, 50],
    // Avoid zooming in to an extreme degree.
    maxZoom: maxZoom.value,
    ...options
  });
};

const fitViewToAllFeatures = (animate = true) => {
  // Used by map initial view and control button to reset the view to show all features
  fitView(featureSource.getExtent(), animate ? { duration: animationDuration } : null);
};

const inViewCount = ref(0);
const countFeaturesInView = () => {
  let count = 0;
  const extent = mapInstance.getView().calculateExtent();
  if (clusterLayer.isVisible()) {
    clusterSource.forEachFeatureIntersectingExtent(extent, feature => {
      // This counts the entire cluster even if not all features in the cluster
      // are in view. While that's arguably imprecise, it's probably less
      // confusing to users that way.
      count += isCluster(feature) ? feature.get('features').length : 1;
    });
  } else {
    featureSource.forEachFeatureIntersectingExtent(extent, () => {
      count += 1;
    });
  }
  inViewCount.value = count;
};
const countMessage = computed(() =>
  t('showing', { count: n(inViewCount.value), total: n(featureCount.value) }));

const zoomLevel = ref(0);



////////////////////////////////////////////////////////////////////////////////
// SHOW/HIDE

/*
There are two levels of visibility at play here:

1. display: none. If there is no data, then the component as a whole will be
   hidden. The component will also be hidden if an ancestor element is hidden.
   Once the component becomes visible, show() will be called via a
   ResizeObserver.
2. opacity: 0. Even once the component is technically visible (once `display` is
   not 'none'), the map will be transparent. That's because show() is async:
   before fully showing/opacifying the map to the user, we wait for the map to
   render fully (e.g., loading tiles). That way, the user won't see layers
   appear at different times as the tiles fade in. We use opacity for this part
   instead of `display: none` because the map needs to be visible in order to
   render.
*/

const shown = ref(false);
let abortShow = noop;

const show = async () => {
  if (shown.value) return;

  // show() is async, but there are also cases where it will be called multiple
  // times in a short period of time. Because of that, show() is abortable.
  // Here, we abort any previous attempt to show(). That's needed to avoid
  // emitting `show` twice.
  abortShow();

  if (featureCount.value === 0) return;

  // Before the view can be fit, the map first needs to be sized: otherwise, the
  // fit would be incorrect. If the map hasn't been sized, we return immediately
  // and try again later.
  if (mapInstance.getSize().find(length => length === 0)) return;

  // Give the parent component an opportunity to resize the map right before
  // it's shown.
  resize();
  if (mapInstance.getSize().find(length => length === 0)) return;

  emit('show');
  fitViewToAllFeatures(false);

  // Set abortShow.
  const abortController = new AbortController();
  abortShow = () => {
    abortController.abort();
    abortShow = noop;
  };

  // Wait for the map to render fully. But if it takes too long, just proceed
  // with showing the map.
  await Promise.race([
    new Promise(resolve => {
      mapInstance.once('rendercomplete', resolve);
      // Nudge mapInstance to render if it's not already doing so for some
      // reason. Otherwise, the promise may never resolve.
      mapInstance.render();
    }),
    new Promise(resolve => { setTimeout(resolve, 1500); })
  ]);
  if (abortController.signal.aborted) return;

  shown.value = true;
  abortShow = noop;
  inViewCount.value = featureCount.value;
  log('shown');
  emit('shown');
};

const hide = () => {
  abortShow();

  if (shown.value) {
    shown.value = false;
    log('hidden');
  }
};



////////////////////////////////////////////////////////////////////////////////
// OVERLAP HINTS

// getHits() below searches a radius for overlapping features. If
// showsOverlapHints.value is `true`, then the radius will be shown on the map
// as a helpful hint.
const showsOverlapHints = ref(false);
const overlapHintSource = new VectorSource();

const showOverlapHint = (pixel) => {
  if (!showsOverlapHints.value) return;
  overlapHintSource.addFeature(new Feature({
    geometry: new Point(mapInstance.getCoordinateFromPixel(pixel)),
    overlapHint: true
  }));
};
const hideOverlapHint = () => { overlapHintSource.clear(true); };

if (config.devTools) {
  const overlapHintLayer = createWebGLLayer(overlapHintSource);
  mapInstance.addLayer(overlapHintLayer);
  watch(showsOverlapHints, (value) => {
    hideOverlapHint();
    overlapHintLayer.setVisible(value);
  });
}



////////////////////////////////////////////////////////////////////////////////
// HIT DETECTION

const hitDetectionOptions = {
  layerFilter: (layer) => layer === featureLayer || layer === clusterLayer
};

// Updates the cursor based on whether the user is moving over a feature.
const moveOverFeature = (event) => {
  if (event.dragging) return;
  const hit = mapInstance.hasFeatureAtPixel(event.pixel, hitDetectionOptions);
  mapContainer.value.style.cursor = hit ? 'pointer' : '';
};

const forEachFeatureNearPixel = (source, pixel, radius, callback) => {
  // Start with a boundary box.
  const corners = [
    [pixel[0] - radius, pixel[1] - radius], // top-left
    [pixel[0] + radius, pixel[1] + radius] // bottom-right
  ];
  const extent = boundingExtent(corners.map(p =>
    mapInstance.getCoordinateFromPixel(p)));

  // For features within `extent`, filter for those that are actually within
  // `radius` pixels of `pixel`.
  const coordinate = mapInstance.getCoordinateFromPixel(pixel);
  const r2 = radius ** 2;
  source.forEachFeatureIntersectingExtent(extent, (feature) => {
    const closest = mapInstance.getPixelFromCoordinate(
      feature.getGeometry().getClosestPoint(coordinate)
    );
    if ((closest[0] - pixel[0]) ** 2 + (closest[1] - pixel[1]) ** 2 <= r2)
      callback(feature);
  });
};

// overlapRadius is the radius within which to seach for overlap. It isn't
// dynamic (it isn't a computed ref), because it is also hard-coded in
// getStyles().
const overlapRadius = clusterDistance.value / 2;

const getHits = (pixel) => {
  hideOverlapHint();

  const hits = mapInstance.getFeaturesAtPixel(pixel, hitDetectionOptions);
  if (hits.length === 0) return hits;

  if (clusterLayer.isVisible()) {
    const cluster = hits.find(isCluster);
    if (cluster != null) return [cluster];
  }

  // getFeaturesAtPixel() above usually works great, but when features overlap,
  // it only seems to return the feature on top. Here, we try to detect
  // additional, overlapping hits by searching for features near `pixel`. As we
  // do so, we skip clusters and avoid duplicates.
  const source = clusterLayer.isVisible() ? clusterSource : featureSource;
  const ids = hits.reduce((set, hit) => set.add(hit.getId()), new Set());
  forEachFeatureNearPixel(source, pixel, overlapRadius, (feature) => {
    if (!(isCluster(feature) || ids.has(feature.getId()))) hits.push(feature);
  });
  showOverlapHint(pixel);

  return hits;
};



////////////////////////////////////////////////////////////////////////////////
// SELECT FEATURE

let selectedId;

// Converts an OpenLayers Feature object to a simple object before emitting it.
// That way, the parent component never has to interact with OpenLayers.
const featureToObject = (feature) =>
  ({ id: feature.getId(), properties: feature.getProperties() });

// Selects an individual feature (not a cluster) or deselects the selected
// feature (if feature is `null`).
const selectFeature = (feature, emitChange = true) => {
  const id = feature?.getId();
  if (id === selectedId) return;

  if (feature != null && feature.getGeometry().getType() === 'Point')
    // The overlap hint is a circle just like the background of a selected
    // point, so we hide it.
    hideOverlapHint();

  mapInstance.getLayers().forEach(layer => {
    if (layer instanceof WebGLVectorLayer)
      layer.updateStyleVariables({ selectedId: id ?? '' });
  });

  selectedId = id;
  if (emitChange)
    emit('selection-changed', feature != null ? featureToObject(feature) : null);
};

const selectCluster = (cluster) => {
  selectFeature(null);

  const features = cluster.get('features');
  // If there aren't too many features in the cluster, calculate their boundary
  // box and fit the view to that. If there are enough features that such a
  // calculation might be onerous, just zoom in on the cluster.
  if (features.length < 1000) {
    const extent = createEmpty();
    for (const feature of features)
      extend(extent, feature.getGeometry().getExtent());
    fitView(extent, { duration: animationDuration });
  } else {
    const view = mapInstance.getView();
    view.animate({
      center: cluster.getGeometry().getCoordinates(),
      zoom: view.getZoom() + 1,
      duration: animationDuration
    });
  }
};

const selectFeatureAtPixel = (pixel) => {
  const hits = getHits(pixel);
  emit('hit', hits.length === 0 || isCluster(hits[0])
    ? []
    : hits.map(featureToObject));

  if (hits.length === 1) {
    const hit = hits[0];
    if (isCluster(hit))
      selectCluster(hit);
    else
      selectFeature(hit);
  } else {
    selectFeature(null);
  }
};



////////////////////////////////////////////////////////////////////////////////
// HOOKS - TIE EVERYTHING TOGETHER

// We may have attempted to show() the map, but failed because the map hadn't
// been sized. The main reason for that is that an ancestor element was hidden.
// This ResizeObserver accounts for that case: once the ancestor element becomes
// visible, this component will become visible, and the ResizeObserver will be
// triggered.
const resizeObserver = new ResizeObserver(show);

onMounted(() => {
  mapInstance.setTarget(mapContainer.value);
  addFeatures();
  // If el.value is already visible, resizeObserver will run the callback
  // immediately.
  resizeObserver.observe(el.value);
});

// OpenLayers event listeners
const olListeners = [];
const olOn = (target, type, callback) => {
  target.on(type, callback);
  olListeners.push([target, type, callback]);
};

olOn(mapInstance, 'moveend', () => {
  // show() will trigger an initial `moveend`, so we use shown.value to ignore
  // that.
  if (shown.value) countFeaturesInView();

  zoomLevel.value = mapInstance.getView().getZoom();
  hideOverlapHint();
});
olOn(mapInstance, 'pointermove', moveOverFeature);

// OpenLayers has a `singleclick` event, but it lags the actual click by 250
// milliseconds in order to exclude double-clicks. Here, we listen for `click`
// events in order to avoid the lag, then use ignoreDoubleClick() to account for
// double-clicks.
const ignoreDoubleClick = (callback) => {
  let previousPixel;
  let previousTime = 0;
  return (event) => {
    const now = Date.now();
    if (!equals(event.pixel, previousPixel) || now > previousTime + 250)
      callback(event);
    previousPixel = event.pixel;
    previousTime = now;
  };
};
olOn(mapInstance, 'click', ignoreDoubleClick(event => {
  selectFeatureAtPixel(event.pixel);
}));

watch(() => props.data, (newData, oldData) => {
  log(newData != null
    ? (oldData == null ? 'data set' : 'data updated')
    : 'data cleared');

  selectFeature(null);
  removeFeatures();

  if (newData != null) {
    addFeatures();

    if (!shown.value)
      // Even though shown.value is `false`, we can't rely on resizeObserver to
      // call show(): we need to call it here as well. If props.data were
      // changed while the map was rendering (while a previous call to show()
      // was still in progress), the component would be visible, with its size
      // set, even as the map remains transparent.
      show();
    else
      // If the map isn't already shown, then show() above will set
      // inViewCount.value.
      countFeaturesInView();
  } else {
    hide();
  }
});

const resizeIfShown = () => { if (shown.value) resize(); };
useEventListener(window, 'resize', resizeIfShown);

onBeforeUnmount(() => {
  abortShow();
  for (const [target, type, callback] of olListeners) target.un(type, callback);
  resizeObserver.disconnect();
  mapInstance.setTarget(null);

  // It's probably not necessary to manually clean up layers in this way. It's
  // just an attempt to make sure that everything is garbage-collected.
  featureSource.clear(true);
  for (const layer of [...mapInstance.getLayers().getArray()]) {
    mapInstance.removeLayer(layer);
    layer.setSource(null);
  }
});

// Here, we expose functions that allow the parent component to modify
// individual features. To update the set of features as a whole, the parent
// component can change props.data; the functions here are specifically oriented
// around individual features. We also expose functions that facilitate testing
// (e.g., getFeatures()).
defineExpose({
  getFeatures: () => featureSource.getFeatures().map(featureToObject),
  selectFeature: (id, emitChange) => {
    const feature = id != null ? featureSource.getFeatureById(id) : null;
    selectFeature(feature, emitChange);
  },
  removeFeature: (id) => {
    const feature = featureSource.getFeatureById(id);
    if (feature == null) return;

    if (id === selectedId) selectFeature(null);
    featureSource.removeFeature(feature);

    featureCount.value -= 1;
    if (shown.value) countFeaturesInView();
  }
});
</script>

<style lang="scss">
// based on Web Forms variables
// (zoom controls styled similarly to those in WF MapBlock.vue)
$spacing: 10px;
$background-color: #fff;
$radius: 6px;
$border-color: #cbd5e1;
$muted-background-color: #F1F5F9;

.geojson-map {
  position: relative;

  .map-container {
    min-height: 400px;
    border: 1px solid $border-color;
    border-radius: $radius;

    opacity: 0;
    &.opaque { opacity: 1; }
  }

  .count {
    position: absolute;
    top: 5px;
    left: 50%;
    transform: translateX(-50%);

    background-color: #fff;
    border-radius: 4px;
    color: #000;
    font-size: 12px;
    line-height: 16px;
    padding-block: 6px;
    padding-inline: 8px;
    user-select: none;
  }

  .ol-zoom {
    position: absolute;
    right: $spacing;
    bottom: $spacing;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: center;
    box-shadow: none;
    background: $background-color;
    border-radius: $radius;
    overflow: hidden;
    border: 1px solid $border-color;

    button,
    button:hover,
    button:focus,
    button:active {
      height: 37px;
      width: 36px;
      border: none;
      background: $background-color;
      -webkit-tap-highlight-color: transparent;
      font-size: 24px;
      font-weight: 300;
      cursor: pointer;
      &:first-child {
        border-bottom: 1px solid $border-color;
      }
      &:hover {
        background: $muted-background-color;
      }
    }
  }

  .control-bar {
    position: absolute;
    display: flex;
    flex-direction: column;
    top: $spacing;
    right: $spacing;
    z-index: 1;
    gap: 4px;

    button {
      background: $background-color;
      padding: 8px;
      border-radius: $radius;
      border: 1px solid $border-color;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;

      &:hover {
        background: $muted-background-color;
      }

      .fit-icon {
        width: 20px;
        height: 20px;
      }
    }
  }

  .geojson-map-dev-tools {
    position: absolute;
    right: #{$spacing + 72px};
    bottom: $spacing;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // {count} and {total} are both numbers.
    "showing": "Showing {count} of {total}",
    // Shown above control button on map to zoom out to show all features
    "zoomToFit": "Zoom to fit all data"
  }
}
</i18n>
