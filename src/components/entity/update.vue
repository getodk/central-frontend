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
  <modal id="entity-update" :state="state" :hideable="!awaitingResponse" large
    backdrop @shown="afterShown" @hide="$emit('hide')">
    <template #title>{{ $t('title', currentVersion) }}</template>
    <template #body>
      <form @submit.prevent="submit">
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th ref="labelCellHeader" class="label-cell">
                  <span class="sr-only">{{ $t('resource.property') }}</span>
                </th>
                <th class="old-value">{{ $t('header.currentValue') }}</th>
                <th class="new-value">{{ $t('header.updatedValue') }}</th>
              </tr>
            </thead>
            <tbody>
              <entity-update-row ref="labelRow" v-model="label"
                :old-value="currentVersion.label"
                :label="$t('entity.entityLabel')" required/>
              <template v-if="dataset.dataExists">
                <entity-update-row v-for="{ name } of dataset.properties"
                  :key="name" ref="propertyRows" v-model="data[name]"
                  :old-value="currentVersion.data[name]" :label="name"/>
              </template>
            </tbody>
          </table>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary"
            :aria-disabled="awaitingResponse">
            {{ $t('action.update') }} <spinner :state="awaitingResponse"/>
          </button>
          <button type="button" class="btn btn-link"
            :aria-disabled="awaitingResponse" @click="$emit('hide')">
            {{ $t('action.neverMind') }}
          </button>
        </div>
      </form>
    </template>
  </modal>
</template>

<script>
export default {
  name: 'EntityUpdate'
};
</script>
<script setup>
import { computed, ref, watch } from 'vue';

import EntityUpdateRow from './update/row.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useColumnGrow from '../../composables/column-grow';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

const props = defineProps({
  state: Boolean,
  entity: Object
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
  const { entity } = props;
  const url = apiPaths.entity(dataset.projectId, dataset.name, entity.uuid, {
    force: true
  });
  request.patch(url, { label: label.value, data: data.value })
    .then(response => {
      // It is the responsibility of the parent component to patch the entity.
      emit('success', response.data);
    })
    .catch(noop);
};

const labelCellHeader = ref(null);
const { resize: resizeLabelCells } = useColumnGrow(labelCellHeader, 1.5);
const labelRow = ref(null);
const propertyRows = ref([]);
const afterShown = () => {
  resizeLabelCells();

  labelRow.value.textarea.resize();
  for (const row of propertyRows.value) row.textarea.resize();

  labelRow.value.textarea.focus();
};

const noEntity = {
  currentVersion: { label: '', data: {} }
};
const currentVersion = computed(() =>
  (props.entity ?? noEntity).currentVersion);
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-update {
  .modal-dialog { margin-top: 15vh; }
  .table-scroll {
    max-height: calc(70vh -
      #{/* .modal-header */ 46px + /* .modal-actions */ 50px});
    overflow-y: auto;
  }

  .modal-body {
    padding-left: 0;
    padding-right: 0;
    padding-top: 0;
  }
  table { margin-bottom: 0; }
  .modal-actions {
    margin-left: 0;
    margin-right: 0;
    margin-top: 0;
  }

  table { table-layout: fixed; }
  thead {
    .label-cell { width: 16.66666667%; }
    .old-value { width: 33.33333333%; }
  }

  tr:nth-child(2) td { border-top-color: #bbb; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. {label} is the label of an
    // Entity.
    "title": "Update {label}",
    // This is the text of a table column header. "Value" refers to the value of
    // an Entity property.
    "header": {
      "currentValue": "Current Value",
      "updatedValue": "Updated Value"
    }
  }
}
</i18n>
