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
  <div class="radio-field btn-group" data-toggle="buttons"
    v-tooltip.no-aria="disabled ? disabledMessage : null">
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vue/require-explicit-emits -->
    <label v-for="{ value, text } of options" :key="value" class="btn btn-toggle" :class="{ disabled, active: model === value }" @click="$emit('update:model-value', value)">
      <input v-model="model" type="radio" :value="value" :disabled="disabled" autocomplete="off"
      :aria-describedby="disabledMessageId">
      <span v-show="model === value" class="icon-check"></span>
      <span>{{ text }}</span>
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
  disabledMessage: String
});

const id = nextId;
nextId += 1;
const disabledMessageId = computed(() =>
  (props.disabled && props.disabledMessage != null ? `radio-field-disabled${id}` : null));
</script>

<style lang="scss">
@import '../assets/scss/variables';

.radio-field {
  input[type="radio"] {
    appearance: none;
  }
  .btn-toggle {
    border-radius: 0 2px 2px 0;
    border: 1px solid $central-grey-2;
    background: #FFF;
    box-shadow: none;
    padding: 10px 30px;
    min-width: 80px;
    position: relative;

    &.active {
      background: $color-action-light;
    }

    &.disabled{
      opacity: 0.5;
    }

    .icon-check {
      position: absolute;
      top: 12px;
      left: 10px;
    }
  }
}
</style>
