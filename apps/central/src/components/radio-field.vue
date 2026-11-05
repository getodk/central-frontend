<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="radio-field" :class="{ 'btn-appearance': buttonAppearance }"
    v-tooltip.no-aria="disabled ? disabledMessage : null">
    <label v-for="{ value, text, icon } of options" :key="value" :class="{ disabled, active: model === value, 'btn btn-toggle': buttonAppearance, radio: !buttonAppearance }">
      <input v-model="model" type="radio" :value="value" :disabled="disabled" autocomplete="off"
      :aria-describedby="disabledMessageId" :name="name">
      <template v-if="buttonAppearance">
        <span :class="icon"></span>
        <span class="sr-only">{{ text }}</span>
      </template>
      <template v-else>
        <span>{{ text }}</span>
      </template>
    </label>
    <p v-if="disabledMessageId != null" :id="disabledMessageId" class="sr-only">
      {{ disabledMessage }}
    </p>
  </div>
</template>

<script>
let nextId = 0;
</script>
<script setup>
import { computed } from 'vue';

const model = defineModel({ required: true });
const props = defineProps({
  options: {
    type: Array,
    required: true
  },
  disabled: Boolean,
  disabledMessage: String,
  buttonAppearance: {
    type: Boolean,
    default: false
  },
  name: String
});

const id = nextId;
nextId += 1;
const disabledMessageId = computed(() =>
  (props.disabled && props.disabledMessage != null ? `radio-field-disabled${id}` : null));
</script>

<style lang="scss">
@import '../assets/scss/variables';

.radio-field {
  label {
    font-weight: normal;
    cursor: pointer;
  }
}

.radio-field.btn-appearance {
  border-radius: 6px;
  border: 1px solid $color-border;
  padding: 5px;

  &:focus-within {
    outline: 2px solid $color-focus-ring;
  }

  input[type="radio"] {
    appearance: none;
    opacity: 0;
  }
  .btn-toggle {
    border-radius: 6px;
    background: $color-surface;
    box-shadow: none;
    position: relative;

    &.active {
      background: $color-action-light;
    }

    &:hover, &:focus-within {
      background-color: $color-action-overlay;
      color: $color-text-inverse;
    }

    &.disabled{
      opacity: 0.5;
    }

    &:first-child {
      margin-right: 2px;
    }
  }
}
</style>
