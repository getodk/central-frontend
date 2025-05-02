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
  <modal id="entity-restore" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')" @shown="focusCheckbox">
    <template #title>{{ $t('title', { label: entity?.label }) }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]', { label: entity?.label }) }}</p>
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
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
        <button type="button" class="btn btn-danger"
          :aria-disabled="awaitingResponse" @click="restore">
          {{ $t('action.restore') }} <spinner :state="awaitingResponse"/>
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
  name: 'EntityRestore'
});
const props = defineProps({
  state: Boolean,
  checkbox: Boolean,
  awaitingResponse: Boolean,
  entity: Object
});
const emit = defineEmits(['hide', 'restore']);

const noConfirm = ref(false);
watch(() => props.state, (state) => { if (!state) noConfirm.value = false; });

const input = ref(null);
const focusCheckbox = () => { if (props.checkbox) input.value.focus(); };

const restore = () => {
  if (props.checkbox)
    emit('restore', [props.entity, !noConfirm.value]);
  else
    emit('restore', [props.entity]);
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. {label} is the label of an
    // Entity.
    "title": "Restore {label}",
    "introduction": [
      // {label} is the label of an Entity.
      "Are you sure you want to restore “{label}”?",
      "The Entity will be restored to its previous state.",
      "If the Entity is deleted again, it will be another 30 days before it is removed."
    ],
    "field": {
      // @transifexKey component.SubmissionRestore.field.noConfirm
      "noConfirm": "Restore immediately without confirmation until I leave the page"
    }
  }
}
</i18n>
