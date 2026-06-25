<template>
  <div class="actor-properties-upsert">
    <table class="table">
      <thead>
        <tr>
          <th class="label-cell">{{ $t('resource.property') }}</th>
          <th class="new-value">{{ $t('header.value') }}</th>
        </tr>
      </thead>
      <tbody>
        <entity-update-row v-for="{ name } of propertyDefs"
          :key="name" ref="propertyRows" v-model="propertyValues[name]"
          :old-value="originalValues?.[name]" :label="name"
          :mark-value-changed="!create"/>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue';

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
const propertyRows = ref([]);

// This component is mounted when parent modal is shown
originalValues.value = { ...propertyValues.value };

// This now tracks only properties that are changed.
propertyValues.value = Object.create(null);

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
  }

  .entity-update-row .new-value {
    padding-left: 0;
  }
}
</style>
