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
  <modal id="dataset-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <i18n-t tag="p" keypath="moreInfo.helpArticle.full">
          <template #helpArticle>
            <doc-link to="central-entities/">{{ $t('moreInfo.helpArticle.helpArticle') }}</doc-link>
          </template>
        </i18n-t>
      </div>
      <form @submit.prevent="submit">
        <form-group ref="name.value" v-model.trim="name"
          :placeholder="$t('field.name')" required autocomplete="off"/>
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

import Modal from '../modal.vue';
import DocLink from '../doc-link.vue';
import FormGroup from '../form-group.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { noop } from '../../util/util';

const { request, awaitingResponse } = useRequest();

defineOptions({
  name: 'DatasetNew'
});
const props = defineProps({
  state: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: String,
    required: true
  }
});
const name = ref('');

const emit = defineEmits(['hide', 'success']);

watch(() => props.state, (state) => {
  if (!state) name.value = '';
});

const submit = () => {
  request({
    // TODO: change to apiPaths
    method: 'POST',
    url: `/v1/projects/${props.projectId}/datasets`,
    data: { name: name.value }
  })
    .then(({ data }) => {
      emit('success', data);
    })
    .catch(noop);
};
</script>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Create Dataset",
    "introduction": [
      "Entities let you share information between Forms so you can collect longitudinal data, manage cases over time, and represent other workflows with multiple steps."
    ]
  }
}
</i18n>
