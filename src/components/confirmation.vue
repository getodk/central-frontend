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
  <modal :state="state" :hideable="!awaitingResponse"
    backdrop class="confirmation" @hide="$emit('hide')">
    <template #title>{{ title }}</template>
    <template #body>
      <div class="modal-introduction">
        <slot name="body"></slot>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary"
          :aria-disabled="awaitingResponse" @click="$emit('success')">
          {{ yesTextC }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link" :aria-disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ noTextC }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Modal from './modal.vue';
import Spinner from './spinner.vue';

const { t } = useI18n();

defineOptions({
  name: 'Confirmation'
});

const prop = defineProps({
  state: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  yesText: {
    type: String
  },
  noText: {
    type: String
  },
  awaitingResponse: {
    type: Boolean,
    default: false
  }
});

const yesTextC = computed(() => prop.yesText || t('common.yes'));
const noTextC = computed(() => prop.noText || t('common.no'));

defineEmits(['hide', 'success']);

</script>
