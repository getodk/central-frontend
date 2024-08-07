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
  <table-freeze v-if="project.dataExists" id="entity-table" ref="table"
    :data="odataEntities.value" key-prop="__id"
    :frozen-only="properties == null" divider @action="afterAction">
    <template #head-frozen>
      <th><span class="sr-only">{{ $t('common.rowNumber') }}</span></th>
      <th>{{ $t('header.createdBy') }}</th>
      <th>{{ $t('header.createdAt') }}</th>
      <th>{{ $t('header.updatedAtAndActions') }}</th>
    </template>
    <template #head-scrolling>
      <template v-if="properties != null">
        <th v-for="property of properties" :key="property.name">
          <span v-tooltip.text>{{ property.name }}</span>
        </th>
      </template>
      <th>{{ $t('entity.label') }}</th>
      <th>{{ $t('entity.entityId') }}</th>
    </template>

    <template #data-frozen="{ data, index }">
      <entity-metadata-row :entity="data"
        :row-number="odataEntities.originalCount - index"
        :verbs="project.verbs"/>
    </template>
    <template #data-scrolling="{ data }">
      <entity-data-row :entity="data" :properties="properties"/>
    </template>
  </table-freeze>
</template>

<script setup>
import { ref } from 'vue';

import EntityDataRow from './data-row.vue';
import EntityMetadataRow from './metadata-row.vue';
import TableFreeze from '../table-freeze.vue';

import { markRowsChanged, markRowsDeleted } from '../../util/dom';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityTable'
});
defineProps({
  properties: Array
});
const emit = defineEmits(['update', 'resolve', 'delete']);

// The component does not assume that this data will exist when the component is
// created.
const { project, odataEntities } = useRequestData();

const afterAction = ({ target, index }) => {
  const { classList } = target;
  if (classList.contains('delete-button'))
    emit('delete', index);
  else if (classList.contains('update-button'))
    emit('update', index);
  else if (classList.contains('resolve-button'))
    emit('resolve', index);
};
const table = ref(null);
const afterUpdate = (index) => { markRowsChanged(table.value.getRowPair(index)); };
const afterDelete = (index) => { markRowsDeleted(table.value.getRowPair(index)); };
defineExpose({ afterUpdate, afterDelete });
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-table .table-freeze-scrolling {
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

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "header": {
      "updatedAtAndActions": "Poslední aktualizace / Akce"
    }
  },
  "de": {
    "header": {
      "updatedAtAndActions": "Letzte Aktualisierung / Aktionen"
    }
  },
  "es": {
    "header": {
      "updatedAtAndActions": "Última actualización / Acciones"
    }
  },
  "fr": {
    "header": {
      "updatedAtAndActions": "Dernières mises à jour / Actions"
    }
  },
  "it": {
    "header": {
      "updatedAtAndActions": "Ultimo aggiornamento/ azioni"
    }
  },
  "sw": {
    "header": {
      "updatedAtAndActions": "Ilisasishwa Mwisho / Vitendo"
    }
  },
  "zh-Hant": {
    "header": {
      "updatedAtAndActions": "最後更新/操作"
    }
  }
}
</i18n>
