<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr class="entity-update-row">
    <td v-if="label != null" class="label-cell">
      <label :for="textareaId" v-tooltip.text>
        {{ requiredLabel(label, required) }}
      </label>
    </td>
    <td class="new-value">
      <div class="form-group" :class="{ 'value-changed': markValueChanged && modelValue != null }">
        <textarea-autosize :id="textareaId" ref="textarea"
          :model-value="modelValue ?? oldValue ?? ''"
          :required="required" :disabled="disabled"
          :disabled-message="disabledMessage" @update:model-value="update"/>
      </div>
    </td>
  </tr>
</template>

<script>
let id = 0;
</script>
<script setup>
import { computed, ref } from 'vue';

import TextareaAutosize from '../../textarea-autosize.vue';

import { requiredLabel } from '../../../util/dom';

defineOptions({
  name: 'EntityUpdateRow'
});
const props = defineProps({
  modelValue: String,
  oldValue: String,
  label: {
    type: String,
    required: false
  },
  required: Boolean,
  disabled: Boolean,
  disabledMessage: String,
  markValueChanged: Boolean
});
const emit = defineEmits(['update:modelValue']);

id += 1;
const textareaId = `entity-update-row-textarea${id}`;


const update = (value) => {
  // We emit `undefined` if `value` is the same as props.oldValue. If `value` is
  // an empty string, and props.oldValue is nullish, the two are considered to
  // be the same. We emit `undefined` rather than `null` so that axios won't
  // send the value.
  emit('update:modelValue', value !== (props.oldValue ?? '') ? value : undefined);
};

const textarea = ref(null);
const resize = () => {
  textarea.value.resize();
};
defineExpose({ textarea: computed(() => ({ ...textarea.value, resize })) });
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.entity-update-row {
  td, textarea, label { font-size: 12px; }

  $vpadding: 4px;
  .label-cell, .new-value { padding-bottom: $vpadding; }
  .label-cell {
    padding-left: 0px;
    padding-right: 15px;
    padding-top: #{$vpadding + $padding-top-form-control};
  }
  .new-value {
    padding-top: $vpadding;
  }

    .value-changed {
      box-shadow: 0 0 0 3px #C8E4EE;
    }

  .label-cell { @include text-overflow-ellipsis; }
  label {
    // Needed for the text to truncate.
    display: inline;
    margin-bottom: 0;
    font-weight: 400;
  }

  .form-group {
    margin-bottom: 0;
    padding-bottom: 0;
  }
}
</style>
