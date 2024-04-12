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
    @hide="hideOrComplete" @shown="nameGroup.focus()">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <template v-if="step === 0">
        <div class="modal-introduction">
          <p>{{ $t('introduction[0]') }}</p>
          <i18n-t tag="p" keypath="moreInfo.helpArticle.full">
            <template #helpArticle>
              <doc-link to="central-entities/">{{ $t('moreInfo.helpArticle.helpArticle') }}</doc-link>
            </template>
          </i18n-t>
        </div>
        <form @submit.prevent="submit">
          <form-group ref="nameGroup" v-model.trim="name"
            :placeholder="$t('entityListName')" required autocomplete="off"/>
          <div class="modal-actions">
            <button type="submit" class="btn btn-primary"
              :aria-disabled="awaitingResponse">
              {{ $t('action.create') }} <spinner :state="awaitingResponse"/>
            </button>
            <button type="button" class="btn btn-link"
              :aria-disabled="awaitingResponse" @click="hideOrComplete">
              {{ $t('action.cancel') }}
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <div id="dataset-new-success" class="modal-introduction">
          <p>
            <span class="icon-check-circle"></span>
            <strong>{{ $t('common.success') }}</strong>
            <sentence-separator/>
            <span>{{ $t('success[0]', createdDataset) }}</span>
          </p>
          <p>{{ $t('success[1]') }}</p>
        </div>
        <div class="modal-actions">
          <button id="dataset-new-done-button" type="button" class="btn btn-primary" @click="complete">
            {{ $t('action.done') }}
          </button>
        </div>
      </template>
    </template>
  </modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { equals } from 'ramda';
import { useI18n } from 'vue-i18n';

import Modal from '../modal.vue';
import DocLink from '../doc-link.vue';
import FormGroup from '../form-group.vue';
import SentenceSeparator from '../sentence-separator.vue';
import Spinner from '../spinner.vue';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';
import { noop } from '../../util/util';

const { request, awaitingResponse } = useRequest();
const { project } = useRequestData();

defineOptions({
  name: 'DatasetNew'
});
const props = defineProps({
  state: {
    type: Boolean,
    default: false
  }
});
const nameGroup = ref(null);
const name = ref('');
const step = ref(0);
const createdDataset = ref(null);

const emit = defineEmits(['hide', 'success']);

watch(() => props.state, (state) => {
  if (!state) name.value = '';
});

const { t } = useI18n();
const submit = () => {
  request({
    method: 'POST',
    url: apiPaths.datasets(project.id),
    data: { name: name.value },
    problemToAlert: ({ code, details }) =>
      (code === 409.3 && equals(details.fields, ['name', 'projectId'])
        ? t('problem.409_3', { datasetName: details.values[0] })
        : null)
  })
    .then(({ data }) => {
      // Reset the form
      name.value = '';
      step.value = 1;
      createdDataset.value = data;
    })
    .catch(noop);
};

const complete = () => {
  emit('success', createdDataset.value);
};

const hideOrComplete = () => {
  if (createdDataset.value == null)
    emit('hide');
  else
    complete();
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#dataset-new-success {
  .icon-check-circle {
    color: $color-success;
    font-size: 32px;
    margin-right: 6px;
    vertical-align: middle;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Create Entity List",
    "introduction": [
      // @transifexKey component.DatasetList.heading.0
      "Entities let you share information between Forms so you can collect longitudinal data, manage cases over time, and represent other workflows with multiple steps."
    ],
    // This appears above a text input field for the name of an Entity List
    "entityListName": "Entity List name",
    "success": [
      "The Entity List “{name}” has been created.",
      "You can get started with it by adding its data properties directly on this page, or by uploading Forms that use it. In this case, any properties the Form calls out will be automatically created when you publish the Form."
    ],
    "problem": {
      "409_3": "An Entity List already exists in this Project with the name of “{datasetName}”."
    },
  }
}
</i18n>
