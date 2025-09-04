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
  <div class="radio-buttons btn-group"
    v-tooltip.no-aria="disabled ? disabledMessage : null">
    <div v-for="{ value, text } of options" :key="value" class="radio"
      :class="{ disabled }">
      <label class="btn">
        <input v-model="model" type="radio" :value="value" :disabled="disabled"
          :aria-describedby="disabledMessageId">
        <span>{{ text }}</span>
      </label>
      <p v-if="disabledMessageId != null" :id="disabledMessageId">
        {{ disabledMessage }}
      </p>
    </div>
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
  (props.disabled && props.disabledMessage != null
    ? `radio-buttons-disabled${id}`
    : null));
</script>
