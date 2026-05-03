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
  <tr class="entity-data-row" :class="{ 'entity-row-selected': entity.__system.selected }">
    <td v-for="property of properties" :key="property.name">
      <span v-tooltip.text>{{ entity[property.odataName] }}</span>
    </td>
    <td><span v-tooltip.text>{{ entity.label }}</span></td>
    <td>{{ entity.__id }}</td>
  </tr>
</template>

<script setup>
defineOptions({
  name: 'EntityDataRow'
});
defineProps({
  entity: {
    type: Object,
    required: true
  },
  properties: {
    type: Array,
    required: true
  }
});
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.entity-row-selected {
  background-color: $color-selected-row;
}
</style>
