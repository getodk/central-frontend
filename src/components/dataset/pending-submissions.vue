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
  <modal id="dataset-pending-submissions" :state="state" backdrop hideable @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <i18n-t tag="p" keypath="explanation.full">
          <template #records>
            <strong>{{ $tc('explanation.records', pendingSubmissions) }}</strong>
          </template>
        </i18n-t>
        <form id="dataset-auto-convert-form">
          <div class="radio">
            <label>
              <input v-model="convert" name="convert" type="radio" :value="false"
                aria-describedby="dataset-auto-convert-false" @change="update">
              <strong>{{ $t('dontConvert.label') }}</strong>
            </label>
            <p id="dataset-auto-convert-false" class="help-block">
              {{ $t('dontConvert.description') }}
            </p>
          </div>
          <div class="radio">
            <label>
              <input v-model="convert" name="convert" type="radio" :value="true"
                aria-describedby="dataset-auto-convert-true" @change="update">
              <strong>{{ $t('convert.label') }}</strong>
            </label>
            <i18n-t id="dataset-auto-convert-true" tag="p" keypath="convert.description" class="help-block">
              <template #submissions>
                {{ $tc('count.submission', pendingSubmissions) }}
              </template>
            </i18n-t>
          </div>
        </form>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger" :disabled="convert === null"
          aria-disabled="convert === null" @click="$emit('success', convert)">
          {{ $t('changeSetting') }}
        </button>
        <button type="button" class="btn btn-link" @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
export default {
  name: 'DatasetPendingSubmissions'
};
</script>

<script setup>
import { ref } from 'vue';

import Modal from '../modal.vue';

defineProps({
  state: {
    type: Boolean,
    default: false
  },
  pendingSubmissions: {
    type: Number,
    requied: true
  }
});

defineEmits(['hide', 'success']);

const convert = ref(null);
</script>

<style scoped lang="scss">
@import '../../assets/scss/variables';
button[disabled] {
  cursor: not-allowed;

  &:hover{
    background-color: $color-danger
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Pending Submissions",
    "changeSetting": "Change setting",
    "explanation": {
      "full": "You are setting Entity creation to occur when Submissions are first received by Central. Once this takes effect, Entities will no longer be generated when Submissions are marked Approved, including {records} records we found that have neither been marked Approved or Rejected.",
      "records": "{count} record | {count} records"
    },
    "dontConvert": {
      "label": "I understand and this is not a problem for me.",
      "description": "Change the setting and do nothing with the pending Submissions."
    },
    "convert": {
      "label": "Convert all pending Submissions to Entities now.",
      "description": "Change the setting and create Entities out of all {submissions} not yet marked Approved or Rejected right now. The review states will not be affected."
    }
  }
}
</i18n>
