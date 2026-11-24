<template>
  <tr class="entity-upload-row" :class="{ highlight: isHighlighted }">
    <td class="row-number">{{ $n(rowIndex + 1, 'noGrouping') }}</td>
    <td>
      <div :class="{ changed: entity.label != null && entity.label !== oldLabel }">
        <div v-if="entity.label !== oldLabel" class="old-value"
          v-tooltip.no-aria="oldLabel">
          {{ oldLabel }}
        </div>
        <div class="new-value" v-tooltip.text>
          {{ entity.label }}
        </div>
      </div>
    </td>
    <td v-for="{ name } of dataset.properties" :key="name">
      <div :class="{ changed: entity.data[name] != null && entity.data[name] !== oldData(name) }">
        <div v-if="entity.data[name] !== oldData(name)" class="old-value"
          v-tooltip.no-aria="oldData(name)">
          {{ oldData(name) }}
        </div>
        <div class="new-value" v-tooltip.text>
          {{ entity.data[name] }}
        </div>
      </div>
    </td>
    <template v-if="extraProperties != null">
      <td v-for="name of extraProperties" :key="name">
        <div class="changed">
          <div class="new-value" v-tooltip.text>{{ entity.extra?.[name] }}</div>
        </div>
      </td>
    </template>
  </tr>
</template>

<script setup>
import { computed } from 'vue';

import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityUploadRow'
});
const props = defineProps({
  // The entity from the CSV file
  entity: {
    type: Object,
    required: true
  },
  rowIndex: {
    type: Number,
    required: true
  },
  extraProperties: Array,
  highlighted: Array
});

const { dataset, serverEntities } = useRequestData();

const serverEntity = computed(() =>
  (serverEntities.dataExists ? serverEntities.get(props.entity.uuid) : null));
const oldLabel = computed(() => serverEntity.value?.label);
const oldData = (property) => serverEntity.value?.data[property];

const isHighlighted = computed(() => props.highlighted != null &&
  props.rowIndex >= props.highlighted[0] &&
  props.rowIndex <= props.highlighted[1]);
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.entity-upload-row {
  // Provide extra room for the row number in case it is large.
  td:first-child { padding-left: 0; }

  .old-value, .new-value {
    @include text-overflow-ellipsis;
    color: $gray-400;

    &:empty { display: none; }
  }

  .changed {
    display: flex;
    column-gap: 5px;

    .old-value { text-decoration: line-through; }
    .new-value { color: $color-success-text; }
  }
}
</style>
