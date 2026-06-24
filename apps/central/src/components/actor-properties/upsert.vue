<template>
  <div class="actor-properties-upsert">
    <div class="actor-properties-upsert-table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th class="label-cell">{{ $t('resource.property') }}</th>
            <th class="new-value">{{ $t('header.value') }}</th>
          </tr>
        </thead>
        <tbody>
          <entity-update-row v-for="{ name } of propertyDefs"
            :key="name" ref="propertyRows" v-model="data[name]"
            :old-value="originalValues?.[name]" :label="name"
            :mark-value-changed="!create"/>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';

import EntityUpdateRow from '../entity/update/row.vue';

defineOptions({
  name: 'ActorPropertiesUpsert'
});

const propertyValues = defineModel('propertyValues');

defineProps({
  create: Boolean,
  propertyDefs: Array
});

const originalValues = ref(null);
const data = ref(Object.create(null));
const propertyRows = ref([]);

// Sync changes back to the parent model.
watch(data, (newData) => {
  propertyValues.value = newData;
}, { deep: true });

// This component is mounted when parent modal is shown
originalValues.value = { ...propertyValues.value };
nextTick(() => {
  for (const row of propertyRows.value) row.textarea.resize();
});

</script>

<style lang="scss">
.actor-properties-upsert {
  .table > thead {
    background-color: transparent;

    tr > th {
      border: none;
      padding: 10px 0;
    }

    tr > td {
      border: none;
    }
  }

  .entity-update-row .new-value {
    padding-left: 0;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the text of a table column header. "Value" refers to the value of
    // a public link property.
    "header": {
      "value": "Value"
    },
  }
}
</i18n>
