<template>
  <ul class="entity-upload-property-list">
    <li v-for="name of names" :key="name">
      <span v-tooltip.text>{{ name }}</span>
    </li>
  </ul>
</template>

<script setup>
defineOptions({
  name: 'EntityUploadPropertyList'
});
defineProps({
  names: {
    type: Array,
    required: true
  }
});
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.entity-upload-property-list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-height: 135px;
  overflow-y: auto;
  margin-block: -2px 0;
  padding-left: 0;

  li {
    // Needed for text-overflow-ellipsis.
    overflow: hidden;
  }

  span {
    @include text-overflow-ellipsis;
    display: inline-block;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 20px;
    max-width: 275px;
    padding: 4px 8px;
  }
}
</style>
