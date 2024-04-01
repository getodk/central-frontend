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
  <modal id="dataset-property-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
      </div>
      <form @submit.prevent="submit">
        <form-group ref="name.value" v-model.trim="name"
          :placeholder="$t('newPropertyName')" required autocomplete="off"/>
        <p>{{ $t('introduction[1]') }}</p>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary"
            :aria-disabled="awaitingResponse">
            {{ $t('action.create') }} <spinner :state="awaitingResponse"/>
          </button>
          <button type="button" class="btn btn-link"
            :aria-disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.cancel') }}
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script setup>
import { ref, watch } from 'vue';

import Modal from '../../modal.vue';
import FormGroup from '../../form-group.vue';
import Spinner from '../../spinner.vue';

import useRequest from '../../../composables/request';
import { apiPaths } from '../../../util/request';
import { useRequestData } from '../../../request-data';
import { noop } from '../../../util/util';

const { request, awaitingResponse } = useRequest();
const { project, dataset } = useRequestData();

defineOptions({
  name: 'DatasetPropertyNew'
});
const props = defineProps({
  state: {
    type: Boolean,
    default: false
  }
});
const name = ref('');

const emit = defineEmits(['hide', 'success']);

watch(() => props.state, (state) => {
  if (!state) name.value = '';
});

const submit = () => {
  request({
    method: 'POST',
    url: apiPaths.datasetProperties(project.id, dataset.name),
    data: { name: name.value }
  })
    .then(() => {
      emit('success');
    })
    .catch(noop);
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Add Entity Property",
    "introduction": [
      "To add an Entity Property, choose a unique property name below.",
      "You can also add new properties by uploading a Form that references them, in which case the properties are created when the Form is published."
    ],
    "newPropertyName": "New property name"
  }
}
</i18n>
