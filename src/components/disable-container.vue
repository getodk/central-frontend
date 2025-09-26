<template>
  <div class="disable-container">
    <div v-show="disabled" class="disable-container-overlay" tabindex="0" v-tooltip.sr-only></div>
    <span v-if="disabled && disabledMessage" class="sr-only">{{ disabledMessage }}</span>
    <div :inert="disabled"><slot></slot></div>
  </div>
</template>

<script setup>
defineProps({
  disabled: Boolean,
  disabledMessage: String
});

</script>

<style lang="scss">
@import '../assets/scss/mixins';

.disable-container {
  position: relative;

  .disable-container-overlay {
    @include overlay(absolute, 0.5);
    cursor: not-allowed;
  }
}
</style>
