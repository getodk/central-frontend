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
  <div class="panel panel-simple">
    <div class="panel-heading">
      <h1 class="panel-title">{{ $t('panel.title') }}</h1>
    </div>
    <div class="panel-body">
      <form @change="confirmationModal.show()" @submit.prevent>
        <div class="radio">
          <label>
            <input v-model="ownerOnly" type="radio" :value="false"
              aria-describedby="dataset-owner-only-false-help">
            <strong>{{ $t('accessAllDefault') }}</strong>
          </label>
          <p id="dataset-owner-only-false-help" class="help-block">
            {{ $t('radio.false') }}
          </p>
        </div>
        <div class="radio">
          <label>
            <input v-model="ownerOnly" type="radio" :value="true"
              aria-describedby="dataset-owner-only-true-help">
            <strong>{{ $t('ownerOnly') }}</strong>
          </label>
          <p id="dataset-owner-only-true-help" class="help-block">
            {{ $t('radio.true') }}
          </p>
        </div>
      </form>
    </div>
  </div>
  <modal v-bind="confirmationModal" :hideable="!awaitingResponse" backdrop
    @hide="cancel">
    <template #title>{{ ownerOnly ? $t('ownerOnly') : $t('accessAll') }}</template>
    <template #body>
      <p class="modal-introduction">
        {{ ownerOnly ? $t('trueModal.introduction') : $t('falseModal.introduction') }}
      </p>
      <div class="modal-actions">
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="cancel">
          {{ $t('action.cancel') }}
        </button>
        <button type="button" class="btn btn-primary"
          :aria-disabled="awaitingResponse" @click="confirm">
          {{ ownerOnly ? $t('trueModal.action.confirm') : $t('accessAll') }}
          <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'DatasetOwnerOnly'
});

const { t } = useI18n();
const { alert } = inject('container');

// The component assumes that this data will exist when the component is
// created.
const { dataset } = useRequestData();

const ownerOnly = ref(false);
watch(
  () => dataset.dataExists,
  (dataExists) => { if (dataExists) ownerOnly.value = dataset.ownerOnly; },
  { immediate: true }
);

const confirmationModal = modalData();
const cancel = () => {
  confirmationModal.hide();
  ownerOnly.value = !ownerOnly.value;
};

const { awaitingResponse } = dataset.toRefs();
const confirm = () => {
  dataset.request({
    method: 'PATCH',
    url: apiPaths.dataset(dataset.projectId, dataset.name),
    data: { ownerOnly: ownerOnly.value },
    patch: ({ data }) => { dataset.ownerOnly = data.ownerOnly; }
  })
    .then(() => {
      confirmationModal.hide();
      alert.success(dataset.ownerOnly
        ? t('alert.changeToTrue')
        : t('alert.changeToFalse'));
    })
    .catch(noop);
};
</script>

<i18n lang="json5">
{
  "en": {
    "panel": {
      // This is a title shown above a section of the page.
      "title": "App User and Data Collector Entity Access"
    },
    "accessAll": "Access all Entities",
    "accessAllDefault": "Access all Entities (default)",
    "ownerOnly": "Only access own Entities",
    "radio": {
      "false": "App Users and Data Collectors within this Project will have access to all Entities within their assigned Forms.",
      "true": "App Users and Data Collectors within this Project will only have access to the Entities they create, promoting privacy and limiting data transfers."
    },
    "falseModal": {
      "introduction": "App Users and Data Collectors will have access to all Entities, including ones they did not create."
    },
    "trueModal": {
      "introduction": "App Users and Data Collectors will lose access to the Entities they have not created. All other user types keep access to all Entities.",
      "action": {
        "confirm": "Access own Entities"
      }
    },
    "alert": {
      "changeToFalse": "App Users and Data Collectors will now have access to all Entities.",
      "changeToTrue": "App Users and Data Collectors will now only have access to Entities they create."
    }
  }
}
</i18n>
