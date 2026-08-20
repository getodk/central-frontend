<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <label class="form-group" :class="htmlClass">
    <slot name="before"></slot>
    <input ref="input" v-model="modelValue" v-bind="$attrs" class="form-control"
      :placeholder="requiredLabel(placeholder, required)" :required="required"
      v-tooltip.aria-describedby="tooltip" :autocomplete="autocomplete">
    <span class="form-label">{{ requiredLabel(placeholder, required) }}</span>
    <slot name="after"></slot>
  </label>
</template>

<script setup>
import { computed, ref } from 'vue';

import { requiredLabel } from '../util/dom';

defineOptions({
  inheritAttrs: false
});
const modelValue = defineModel({ required: true });
const props = defineProps({
  placeholder: {
    type: String,
    required: true
  },
  required: Boolean,
  tooltip: String,
  hasError: Boolean,
  autocomplete: {
    type: String,
    required: true
  }
});

const htmlClass = computed(() => ({
  'has-error': props.hasError
}));

const input = ref(null);
const focus = () => { input.value.focus(); };
defineExpose({ focus });
</script>
