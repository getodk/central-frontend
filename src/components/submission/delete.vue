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
  <modal id="submission-delete" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')" @shown="focusCheckbox">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <p>{{ $t('introduction[1]') }}</p>
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
          :aria-disabled="awaitingResponse" @click="del">
          {{ $t('action.delete') }} <spinner :state="awaitingResponse"/>
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
  name: 'SubmissionDelete'
});
const props = defineProps({
  state: Boolean,
  checkbox: Boolean,
  awaitingResponse: Boolean,
  submission: Object
});
const emit = defineEmits(['hide', 'delete']);

const noConfirm = ref(false);
watch(() => props.state, (state) => { if (!state) noConfirm.value = false; });

const input = ref(null);
const focusCheckbox = () => { if (props.checkbox) input.value.focus(); };

const del = () => {
  if (props.checkbox)
    emit('delete', [props.submission, !noConfirm.value]);
  else
    emit('delete', [props.submission]);
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of Submission delete pop-up.
    "title": "Delete Submission",
    "introduction": [
      "Are you sure you want to delete this Submission?",
      "This action will move the Submission to the Trash. After 30 days in the Trash, it will be permanently purged, but it can be undeleted before then."
    ],
    "field": {
      // @transifexKey component.EntityDelete.field.noConfirm
      "noConfirm": "Delete immediately without confirmation until I leave the page"
    }
  }
}
</i18n>
