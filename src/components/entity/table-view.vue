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
  <entity-table v-show="odataEntities.dataExists" ref="table"
    v-model:all-selected="allSelected" :properties="dataset.properties"
    :deleted="deleted" :awaiting-deleted-responses="awaitingResponses"
    v-on="reemitters"/>
  <odata-loading-message :state="odataEntities.initiallyLoading"
    type="entity"
    :top="pagination.size"
    :filter="filter != null || !!searchTerm"
    :total-count="dataset.dataExists ? dataset.entities : 0"/>
  <!-- @update:page is emitted on size change as well -->
  <Pagination v-if="pagination.count > 0"
    v-model:page="pagination.page" v-model:size="pagination.size"
    :count="pagination.count" :size-options="pageSizeOptions"
    :spinner="odataEntities.awaitingResponse"
    @update:page="handlePageChange"/>
</template>

<script setup>
import { inject, reactive, useTemplateRef, watch } from 'vue';

import EntityTable from './table.vue';
import OdataLoadingMessage from '../odata-loading-message.vue';
import Pagination from '../pagination.vue';

import { apiPaths } from '../../util/request';
import { noop, reemit } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityTableView'
});
const props = defineProps({
  deleted: Boolean,
  filter: String,
  searchTerm: String,
  awaitingResponses: {
    type: Set,
    required: true
  }
});
const allSelected = defineModel('allSelected');
const emit = defineEmits(['selection-changed', 'clear-selection', 'update', 'resolve', 'delete', 'restore']);

const projectId = inject('projectId');
const datasetName = inject('datasetName');

const { dataset, odataEntities, deletedEntityCount } = useRequestData();

const pageSizeOptions = [250, 500, 1000];
const pagination = reactive({ page: 0, size: pageSizeOptions[0], count: 0 });

// For more information about how the snapshot filter works, see
// SubmissionTableView.
let snapshotFilter;
const setSnapshotFilter = () => {
  snapshotFilter = '';
  const now = new Date().toISOString();
  if (props.deleted) {
    snapshotFilter += `__system/deletedAt le ${now}`;
  } else {
    snapshotFilter += `__system/createdAt le ${now} and `;
    snapshotFilter += `(__system/deletedAt eq null or __system/deletedAt gt ${now})`;
  }
};

// `clear` indicates whether odataEntities should be cleared before sending the
// request. `refresh` indicates whether the request is a background refresh
// (whether the refresh button was pressed).
const fetchChunk = (clear, refresh = false) => {
  // Are we fetching the first chunk of entities or the next chunk?
  const first = clear || refresh;
  if (first) {
    setSnapshotFilter();
    pagination.page = 0;
  }

  let $filter = snapshotFilter;
  if (props.filter) {
    $filter += ` and ${props.filter}`;
  }

  const $search = props.searchTerm ? props.searchTerm : undefined;

  emit('clear-selection');

  return odataEntities.request({
    url: apiPaths.odataEntities(
      projectId,
      datasetName,
      {
        $top: pagination.size,
        $skip: pagination.page * pagination.size,
        $count: true,
        $filter,
        $search,
        $orderby: '__system/createdAt desc'
      }
    ),
    clear,
    patch: !first
      ? (response) => odataEntities.replaceData(response.data, response.config)
      : null
  })
    .then(() => {
      pagination.count = odataEntities.count;

      if (props.deleted) {
        deletedEntityCount.cancelRequest();
        if (!deletedEntityCount.dataExists) {
          deletedEntityCount.data = reactive({});
        }
        deletedEntityCount.value = odataEntities.count;
      }
    })
    .catch(noop);
};
fetchChunk(true);
watch([() => props.deleted, () => props.filter, () => props.searchTerm], () => {
  fetchChunk(true);
});
const handlePageChange = () => {
  // This function is called for size change as well. So when the total number of entities are
  // less than the lowest size option, hence we don't need to make a request.
  if (odataEntities.count < pageSizeOptions[0]) return;
  fetchChunk(false);
};
// For defineExpose()
const exposedFetch = {
  fetchData: (clear = true) => fetchChunk(clear, !clear),
  cancelFetch: () => { odataEntities.cancelRequest(); }
};

const reemitters = reemit(
  emit,
  ['selection-changed', 'update', 'resolve', 'delete', 'restore']
);

const table = useTemplateRef('table');
const afterUpdate = (index) => table.value.afterUpdate(index);
const afterDelete = (index) => table.value.afterDelete(index);

defineExpose({ ...exposedFetch, afterUpdate, afterDelete });
</script>
