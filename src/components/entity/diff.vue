<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <diff-item v-for="key of entityVersion.serverDiff" :key="key" :path="[key]"
      :old="propOrLabel(oldVersion, key)"
      :new="propOrLabel(entityVersion, key)"/>
  </div>
</template>

<script>
const propOrLabel = (version, key) =>
  (key === 'label' ? version.label : version.data[key]);
</script>

<script setup>
import { computed } from 'vue';

import DiffItem from '../diff-item.vue';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityDiff'
});
const props = defineProps({
  entityVersion: {
    type: Object,
    required: true
  }
});

// The component assumes that this data will exist when the component is
// created.
const { entityVersions } = useRequestData();
const oldVersion = computed(() =>
  entityVersions[props.entityVersion.version - 2]);
</script>
