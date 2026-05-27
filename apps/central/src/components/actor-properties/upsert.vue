<template>
  <div class="actor-properties-upsert">
    <div class="eactor-properties-upsert-header">{{ $t('resource.properties') }}</div>
    <div class="eactor-properties-upsert-table-scroll">
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
import { ref, watch } from 'vue';

import EntityUpdateRow from '../entity/update/row.vue';

defineOptions({
  name: 'ActorPropertiesUpsert'
});

const propertyValues = defineModel('propertyValues');

const props = defineProps({
  create: Boolean,
  propertyDefs: Object
});

// Snapshot original values so old-value isn't clobbered by the sync watch.
const originalValues = { ...propertyValues.value };

const data = ref(Object.fromEntries(
  props.propertyDefs.map(({ name }) => [name, undefined])
));

// Sync changes back to the parent model.
watch(data, (newData) => {
  propertyValues.value = { ...newData };
}, { deep: true });

</script>

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
