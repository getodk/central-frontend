<template>
  <div class="pagination-container" :class="{ fixed }">
    <div class="pagination-container-left-side">
      <slot name="left"></slot>
    </div>
    <div class="pagination-container-right-side">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'TablePaginationFooter'
});

defineProps({
  fixed: {
    type: Boolean,
    default: true
  }
});
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.pagination-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;

  &.fixed {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: $color-page-background;
    padding: 10px $padding-inline-container;
  }

  .pagination-container-right-side {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
  }
}


</style>
