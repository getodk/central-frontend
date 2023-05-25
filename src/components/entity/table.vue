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
  <table-freeze :data="odataEntities.value" key-prop="__id"
    :frozen-only="properties == null"
    ids="entity-table-metadata entity-table-data" divider>
    <template #head-frozen>
      <th><!-- Row number --></th>
      <th>{{ $t('header.createdBy') }}</th>
      <th>{{ $t('header.createdAt') }}</th>
      <th>{{ $t('header.updatedAtAndActions') }}</th>
    </template>
    <template #head-scrolling>
      <template v-if="properties != null">
        <th v-for="property of properties" :key="property.id">
          <span v-tooltip.text>{{ property.name }}</span>
        </th>
      </template>
      <th>{{ $t('entity.label') }}</th>
      <th>{{ $t('entity.entityId') }}</th>
    </template>

    <template #data-frozen="{ data, index }">
      <entity-metadata-row :entity="data"
        :row-number="odataEntities.value.length - index"/>
    </template>
    <template #data-scrolling="{ data }">
      <entity-data-row :entity="data" :properties="properties"/>
    </template>
  </table-freeze>
</template>

<script>
export default {
  name: 'EntityTable'
};
</script>
<script setup>
import EntityDataRow from './data-row.vue';
import EntityMetadataRow from './metadata-row.vue';
import TableFreeze from '../table-freeze.vue';

import { useRequestData } from '../../request-data';

defineProps({
  properties: Array
});

// The component does not assume that this data will exist when the component is
// created.
const { odataEntities } = useRequestData();
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-table-data {
  th, td {
    @include text-overflow-ellipsis;
    max-width: 250px;
    &:last-child { max-width: 325px; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "header": {
      // This is the text of a column header of a table of Entities. The column
      // shows when each Entity was last updated, as well as actions that can be
      // taken on the Entity.
      "updatedAtAndActions": "Last Updated / Actions"
    }
  }
}
</i18n>
