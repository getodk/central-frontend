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
        <p>
          {{ $t('explanation.first') }}
          <i18n-t tag="span" keypath="explanation.second" :plural="pendingSubmissions">
            <template #records>
              <strong>{{ $tcn('explanation.records', pendingSubmissions) }}</strong>
            </template>
          </i18n-t>
        </p>
        <form id="dataset-auto-convert-form">
          <div class="radio">
            <label>
              <input v-model="convert" name="convert" type="radio" :value="false"
                aria-describedby="dataset-auto-convert-false">
              <strong>{{ $t('dontConvert.label') }}</strong>
            </label>
            <p id="dataset-auto-convert-false" class="help-block">
              {{ $tcn('dontConvert.description', pendingSubmissions) }}
            </p>
          </div>
          <div class="radio">
            <label>
              <input v-model="convert" name="convert" type="radio" :value="true"
                aria-describedby="dataset-auto-convert-true">
              <strong>{{ $t('convert.label') }}</strong>
            </label>
            <p id="dataset-auto-convert-true" class="help-block">
              {{ $tcn('convert.description', pendingSubmissions) }}
            </p>
          </div>
        </form>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger" :aria-disabled="convert === null"
          @click="$emit('success', convert)">
          {{ $t('action.changeSetting') }}
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
    required: true
  }
});

defineEmits(['hide', 'success']);

const convert = ref(null);
</script>

<i18n lang="json5">
{
  "en": {
    "title": "Pending Submissions",
    "action": {
      "changeSetting": "Change setting"
    },
    "explanation": {
      "first": "You are setting Entity creation to occur when Submissions are first received by Central.",
      "second": "Once this takes effect, Entities will no longer be generated when Submissions are marked Approved, including {records} we found that have neither been marked Approved or Rejected. | Once this takes effect, Entities will no longer be generated when Submissions are marked Approved, including {records} we found that have neither been marked Approved or Rejected.",
      "records": "{count} record | {count} records"
    },
    "dontConvert": {
      "label": "I understand and this is not a problem for me.",
      "description": "Change the setting and do nothing with the pending Submission. | Change the setting and do nothing with the pending Submissions."
    },
    "convert": {
      "label": "Convert all pending Submissions to Entities now.",
      "description": "Change the setting and create Entity out of {count} Submission not yet marked Approved or Rejected. The Review States will not be affected. | Change the setting and create Entities out of all {count} Submissions not yet marked Approved or Rejected. The Review States will not be affected."
    }
  }
}
</i18n>
