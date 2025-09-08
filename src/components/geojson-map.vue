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
  <div class="geojson-map">
    <p>GeoJSON loaded!</p>

    <button v-if="json == null" type="button" class="btn btn-primary"
      @click="showJson">
      Show JSON
    </button>
    <pre v-else><code>{{ json }}</code></pre>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  features: {
    type: Object,
    required: true
  }
});

const json = ref(null);
const showJson = () => { json.value = JSON.stringify(props.features, null, 2); };
watch(() => props.features, () => { json.value = null; });
</script>
