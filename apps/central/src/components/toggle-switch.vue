<template>
  <label class="toggle-switch">
    <input v-model="model" type="checkbox" role="switch" :aria-checked="model">
    <span class="toggle-track">
      <span class="toggle-thumb"></span>
    </span>
    <span class="toggle-label">
      <slot></slot>
    </span>
  </label>
</template>

<script setup>
const model = defineModel({ type: Boolean });
</script>

<style lang="scss">
@import '../assets/scss/variables';

.toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
  user-select: none;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;

    &:focus-visible + .toggle-track {
      box-shadow: $btn-focus-box-shadow;
    }
  }

  .toggle-track {
    position: relative;
    width: 42px;
    height: 24px;
    background-color: #d1d5db;
    border-radius: 30px;
    transition: background-color 0.2s ease;
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background-color: #fff;
    border-radius: 9px;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  input:checked + .toggle-track {
    background-color: $color-action-background;

    .toggle-thumb {
      transform: translateX(18px);
    }
  }

  &:hover .toggle-track {
    background-color: #9ca3af;
  }

  &:hover input:checked + .toggle-track {
    background-color: $color-action-background-hover;
  }

  .toggle-label {
    color: $color-text;
    font-size: 14px;
  }
}
</style>
