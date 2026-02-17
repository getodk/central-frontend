<!--
Copyright 2026 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="entity-create" :state="state" :hideable="!awaitingResponse"
    size="large" backdrop @shown="afterShown" @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <form @submit.prevent="submit">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th ref="labelCellHeader" class="label-cell">
                  <span class="sr-only">{{ $t('resource.property') }}</span>
                </th>
                <th class="new-value">{{ $t('header.value') }}</th>
              </tr>
            </thead>
            <tbody>
              <entity-update-row ref="labelRow" v-model="label"
                :show-old-value="false"
                :label="$t('entity.entityLabel')" required/>
              <template v-if="dataset.dataExists">
                <entity-update-row v-for="{ name } of dataset.properties"
                  :key="name" ref="propertyRows" v-model="data[name]"
                  :show-old-value="false" :label="name"/>
              </template>
            </tbody>
          </table>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-link"
            :aria-disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.neverMind') }}
          </button>
          <button type="submit" class="btn btn-primary"
            :aria-disabled="awaitingResponse">
            {{ $t('action.create') }} <spinner :state="awaitingResponse"/>
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';

import EntityUpdateRow from './update/row.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useColumnGrow from '../../composables/column-grow';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityCreate'
});
const props = defineProps({
  state: Boolean
});

const emit = defineEmits(['hide', 'success']);

const { dataset } = useRequestData();

const label = ref(undefined);
const data = ref(Object.create(null));
watch(() => props.state, (state) => {
  if (!state) {
    label.value = undefined;
    data.value = Object.create(null);
  }
});

const { request, awaitingResponse } = useRequest();
const submit = () => {
  const url = apiPaths.entities(dataset.projectId, dataset.name);

  request.post(
    url,
    { label: label.value, data: data.value },
  )
    .then(response => {
      emit('success', response.data);
    })
    .catch(noop);
};

const labelCellHeader = ref(null);
const { resize: resizeLabelCells } = useColumnGrow(labelCellHeader, 1.5);
const labelRow = ref(null);
const propertyRows = ref([]);
const afterShown = () => {
  labelRow.value.textarea.focus();

  nextTick(() => {
    resizeLabelCells();

    labelRow.value.textarea.resize();
    for (const row of propertyRows.value) row.textarea.resize();
  });
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-create {
  .modal-dialog { margin-top: 15vh; }
  .table-scroll {
    max-height: calc(70vh -
      #{/* .modal-header */ 46px + /* .modal-actions */ 100px});
    overflow-y: auto;
  }

  table { margin-bottom: 0; }

  table { table-layout: fixed; }
  thead {
    .label-cell { width: 25%; }
  }

  tr:nth-child(2) td { border-top-color: #bbb; }

  .alert { margin: 15px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up for creating a new Entity.
    "title": "Create New Entity",
    // This is the text of a table column header. "Value" refers to the value of
    // an Entity property.
    "header": {
      "value": "Value"
    }
  }
}
</i18n>
