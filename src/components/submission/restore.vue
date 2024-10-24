<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="submission-restore" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')" @shown="focusCheckbox">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <p>{{ $t('introduction[1]') }}</p>
        <p>{{ $t('introduction[2]') }}</p>
      </div>
      <form v-if="checkbox">
        <div class="checkbox">
          <label>
            <input ref="input" v-model="noConfirm" type="checkbox">
            {{ $t('field.noConfirm') }}
          </label>
        </div>
      </form>
      <div class="modal-actions">
        <button type="button" class="btn btn-danger"
          :aria-disabled="awaitingResponse" @click="restore">
          {{ $t('action.restore') }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { ref, watch } from 'vue';

import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

defineOptions({
  name: 'SubmissionRestore'
});
const props = defineProps({
  state: Boolean,
  checkbox: Boolean,
  awaitingResponse: Boolean,
  submission: Object
});
const emit = defineEmits(['hide', 'restore']);

const noConfirm = ref(false);
watch(() => props.state, (state) => { if (!state) noConfirm.value = false; });

const input = ref(null);
const focusCheckbox = () => { if (props.checkbox) input.value.focus(); };

const restore = () => {
  if (props.checkbox)
    emit('restore', [props.submission, !noConfirm.value]);
  else
    emit('restore', [props.submission]);
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of Submission undelete pop-up.
    "title": "Undelete Submission",
    "introduction": [
      "Are you sure you want to undelete this Submission?",
      "The Submission will be restored to its previous state, including associated data like comments.",
      "If the Submission is deleted again, it will be another 30 days before it is removed."
    ],
    "field": {
      "noConfirm": "Undelete immediately without confirmation until I leave the page"
    }
  }
}
</i18n>
