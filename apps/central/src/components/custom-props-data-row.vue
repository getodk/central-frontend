<template>
  <tr class="custom-props-data-row" :class="{ success: actor.id === highlighted }">
    <td v-for="property of properties" :key="property.name">
      <span v-tooltip.text>{{ actor.properties?.[property.name] }}</span>
    </td>
  </tr>
</template>

<script setup>
defineOptions({
  name: 'CustomPropsDataRow'
});

defineProps({
  actor: {
    type: Object,
    required: true
  },
  properties: {
    type: Object,
    required: true
  },
  highlighted: Number
});
</script>

<style lang="scss">
.custom-props-data-row {
  .table tbody & td {
    height: 37px;
  }
}
</style>
