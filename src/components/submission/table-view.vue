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
  <submission-table v-show="odata.dataExists" ref="table"
    :project-id="projectId" :xml-form-id="xmlFormId" :draft="draft" :deleted="deleted"
    :fields="fields" :awaiting-deleted-responses="awaitingResponses"
    v-on="reemitters"/>
  <odata-loading-message :state="odata.initiallyLoading"
    type="submission"
    :top="pagination.size"
    :filter="!!filter"
    :total-count="totalCount"/>
  <!-- @update:page is emitted on size change as well -->
  <Pagination v-if="pagination.count > 0"
    v-model:page="pagination.page" v-model:size="pagination.size"
    :count="pagination.count" :size-options="pageSizeOptions"
    :spinner="odata.awaitingResponse"
    :empty="odata.dataExists && odata.value.length === 0"
    @update:page="handlePageChange"/>
</template>

<script setup>
import { computed, reactive, useTemplateRef, watch } from 'vue';

import OdataLoadingMessage from '../odata-loading-message.vue';
import Pagination from '../pagination.vue';
import SubmissionTable from './table.vue';

import { apiPaths } from '../../util/request';
import { noop, reemit, reexpose } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'SubmissionTableView'
});
const props = defineProps({
  // Props passed from FormSubmissions via SubmissionList
  projectId: {
    type: String,
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  },
  draft: Boolean,
  deleted: Boolean,

  // Table actions
  filter: String,
  fields: Array,

  totalCount: {
    type: Number,
    default: 0
  },
  awaitingResponses: {
    type: Set,
    required: true
  }
});
const emit = defineEmits(['review', 'delete', 'restore']);

const { odata, deletedSubmissionCount } = useRequestData();

const pageSizeOptions = [250, 500, 1000];
const pagination = reactive({ page: 0, size: pageSizeOptions[0], count: 0 });

const odataSelect = computed(() => {
  if (props.fields == null) return null;
  const paths = props.fields.map(({ path }) => path.replace('/', ''));
  paths.unshift('__id', '__system');
  return paths.join(',');
});

// `clear` indicates whether this.odata should be cleared before sending the
// request. `refresh` indicates whether the request is a background refresh
// (whether the refresh button was pressed).
const fetchChunk = (clear, refresh = false) => {
  // Are we fetching the first chunk of submissions or the next chunk?
  const first = clear || refresh;
  if (first) {
    pagination.page = 0;
  }

  return odata.request({
    url: apiPaths.odataSubmissions(
      props.projectId,
      props.xmlFormId,
      props.draft,
      {
        $top: pagination.size,
        $skip: pagination.page * pagination.size,
        $count: true,
        $wkt: true,
        $filter: props.deleted ? '__system/deletedAt ne null' : props.filter,
        $select: odataSelect.value,
        $orderby: '__system/submissionDate desc'
      }
    ),
    clear,
    patch: !first
      ? (response) => odata.replaceData(response.data, response.config)
      : null
  })
    .then(() => {
      pagination.count = odata.count;

      if (props.deleted) {
        deletedSubmissionCount.cancelRequest();
        if (!deletedSubmissionCount.dataExists) {
          deletedSubmissionCount.data = reactive({});
        }
        deletedSubmissionCount.value = odata.count;
      }
    })
    .catch(noop);
};
fetchChunk(true);
watch([() => props.filter, () => props.deleted], () => { fetchChunk(true); });
watch(() => props.fields, (_, oldFields) => {
  // SubmissionList resets column selector when delete button is pressed, in
  // that case we don't want to send request from here.
  if (oldFields != null && !props.deleted) fetchChunk(true);
});
const handlePageChange = () => {
  // This function is called for size change as well. So the total number of submissions are
  // less than the lowest size option, hence we don't need to make a request.
  if (odata.count < pageSizeOptions[0]) return;
  fetchChunk(false);
};
const refresh = () => fetchChunk(false, true);
const cancelRefresh = () => { odata.cancelRequest(); };

const reemitters = reemit(emit, ['review', 'delete', 'restore']);

const table = useTemplateRef('table');
defineExpose({
  refresh, cancelRefresh,
  ...reexpose(table, ['afterReview', 'afterDelete'])
});
</script>
