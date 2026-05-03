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
  <div class="geojson-map-dev-tools" :class="{ expanded }">
    <div>
      <strong>DevTools</strong>
      <a href="#" role="button" aria-label="Toggle" @click.prevent="toggle">
        <span v-if="expanded" class="icon-angle-down"></span>
        <span v-else class="icon-angle-up"></span>
      </a>
    </div>
    <form v-show="expanded">
      <p>Zoom level: {{ $n(zoom, 'maximumFractionDigits2') }}</p>
      <form-group v-model="maxZoom" type="number" placeholder="Max auto-zoom"
        min="1" autocomplete="off"/>
      <hr>

      <fieldset :disabled="clustersDisabledMessage != null"
        v-tooltip.no-aria="clustersDisabledMessage">
        <div class="checkbox">
          <label><input v-model="cluster" type="checkbox">Cluster</label>
        </div>
        <form-group v-model="clusterDistance" type="number"
          placeholder="Max distance between features in cluster (px)"
          min="1" autocomplete="off"/>
        <form-group v-model="clusterMinDistance" type="number"
          placeholder="Min distance between clusters"
          min="0" autocomplete="off"/>
      </fieldset>
      <hr>

      <form-group v-model="overlapRadius" type="number"
        placeholder="Radius of overlap search area (px)"
        min="1" autocomplete="off"/>
      <div class="checkbox">
        <label>
          <input v-model="overlapHint" type="checkbox">Show overlap search area
        </label>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

import FormGroup from '../form-group.vue';

defineOptions({
  name: 'GeojsonMapDevTools'
});
const maxZoom = defineModel('maxZoom');
const cluster = defineModel('cluster');
const clusterDistance = defineModel('clusterDistance');
const clusterMinDistance = defineModel('clusterMinDistance');
const overlapRadius = defineModel('overlapRadius');
const overlapHint = defineModel('overlapHint');
const props = defineProps({
  zoom: {
    type: Number,
    required: true
  }
});

const expanded = ref(false);
const toggle = () => { expanded.value = !expanded.value; };

const clustersDisabledMessage = computed(() => (props.zoom >= maxZoom.value
  ? 'Once the zoom level reaches the max auto-zoom, clusters are automatically hidden.'
  : null));
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.geojson-map-dev-tools {
  background-color: #fff;
  border-radius: 4px;

  padding: 8px;
  &.expanded { padding: 12px; }

  > :first-child {
    display: flex;
    justify-content: space-between;
    column-gap: 15px;
  }

  a {
    color: #888;

    span {
      @include text-link;
      &:first-child { margin-right: 0; }
    }
  }

  form { margin-top: 10px; }

  form, fieldset {
    > :last-child { margin-bottom: 0; }
  }

  hr { margin-block: 12px; }
}
</style>
