<template>
  <tr class="field-key-data-row" :class="{ success: fieldKey.id === highlighted }">
    <td v-for="property of actorProperties" :key="property.name">
      <span v-tooltip.text>{{ fieldKey.properties?.[property.name] }}</span>
    </td>
  </tr>
</template>

<script setup>
defineOptions({
  name: 'FieldKeyDataRow'
});

defineProps({
  fieldKey: {
    type: Object,
    required: true
  },
  actorProperties: {
    type: Object,
    required: true
  },
  highlighted: Number
});
</script>

<style lang="scss">
.field-key-data-row {
  .table tbody & td {
    height: 37px;
  }
}
</style>
