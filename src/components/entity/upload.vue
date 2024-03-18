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
  <modal id="entity-upload" :state="state" :hideable="!uploading" size="full"
    backdrop @hide="$emit('hide')" @resize="setTableHeight">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div :class="{ backdrop: uploading }">
        <entity-upload-table :ref="setTable(0)"
          :title="$t('table.server', dataset)" :entities="serverEntities.value"
          :row-index="serverRow" :page-size="serverPage.size"
          :awaiting-response="serverEntities.awaitingResponse"
          :max-height="tableHeight"/>
        <loading :state="serverEntities.initiallyLoading"/>
        <p v-if="serverEntities.dataExists && serverEntities.value.length === 0"
          class="empty-table-message">
          {{ $t('noEntities') }}
        </p>
        <pagination v-if="serverPage.count !== 0" v-model:page="serverPage.page"
          v-model:size="serverPage.size" :count="serverPage.count"
          :size-options="pageSizeOptions"
          :spinner="serverEntities.awaitingResponse"/>

        <entity-upload-table :ref="setTable(1)" :title="$t('table.file')"
          :page-size="defaultPageSize" :max-height="tableHeight"/>

        <entity-upload-file-select v-show="file == null" @change="selectFile">
          <div>
            <span>{{ $t('headersNote') }}</span>
            <sentence-separator/>
            <entity-upload-data-template/>
          </div>
        </entity-upload-file-select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary"
          :aria-disabled="file == null || uploading" @click="upload">
          {{ $t('action.append') }}
        </button>
        <button type="button" class="btn btn-link" :aria-disabled="uploading"
          @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
      </div>
      <div v-if="file != null" id="entity-upload-popups">
        <!-- TODO. Pass the actual count. -->
        <entity-upload-popup :filename="file.name" :count="1"
          :awaiting-response="uploading" :progress="uploadProgress"
          @clear="clearFile"/>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { nextTick, reactive, ref, watch } from 'vue';

import EntityUploadDataTemplate from './upload/data-template.vue';
import EntityUploadFileSelect from './upload/file-select.vue';
import EntityUploadPopup from './upload/popup.vue';
import EntityUploadTable from './upload/table.vue';
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import Pagination from '../pagination.vue';
import SentenceSeparator from '../sentence-separator.vue';

import useEventListener from '../../composables/event-listener';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { odataEntityToRest } from '../../util/odata';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityUpload'
});
const props = defineProps({
  state: Boolean
});
const emit = defineEmits(['hide', 'success']);

const { dataset, createResource } = useRequestData();

const pageSizeOptions = [5, 10, 20, 50];
const defaultPageSize = pageSizeOptions[0];

// SERVER DATA
const serverEntities = createResource('serverEntities', () => ({
  transformResponse: ({ data }) => ({
    value: data.value.map(entity =>
      odataEntityToRest(entity, dataset.properties).currentVersion),
    count: data['@odata.count']
  })
}));
/* We set serverPage.count after requesting the first page of serverEntities,
then keep it fixed. That way, the pagination controls won't change while the
user is navigating the table, even if another user modifies the entity list.
Newly created entities will be excluded using the $filter OData query parameter.
However, one downside of this approach is that if entities are deleted, it is
possible for the table to have blank pages. */
const serverPage = reactive({ count: 0, page: -1, size: defaultPageSize });
let odataFilter;
// The 0-indexed row number of the first entity of serverEntities.value
const serverRow = ref(-1);
watch(() => props.state, (state) => {
  if (state) {
    if (dataset.entities !== 0) {
      serverPage.page = 0;
      const now = new Date().toISOString();
      odataFilter = `__system/createdAt le ${now}`;
    }
  } else {
    serverEntities.reset();
    Object.assign(serverPage, { count: 0, page: -1, size: defaultPageSize });
    serverRow.value = -1;
  }
});
watch([() => serverPage.page, () => serverPage.size], () => {
  const { count, page, size } = serverPage;
  if (page === -1) return;
  const first = count === 0;
  serverEntities.request({
    url: apiPaths.odataEntities(dataset.projectId, dataset.name, {
      $filter: odataFilter,
      $orderby: '__system/createdAt asc',
      $top: size,
      $skip: page * size,
      $count: first
    }),
    clear: false
  })
    .then(() => {
      if (first) serverPage.count = serverEntities.count;
      serverRow.value = page * size;
    })
    .catch(noop);
});

const file = ref(null);
const selectFile = (value) => { file.value = value; };
const clearFile = () => { file.value = null; };
watch(() => props.state, (state) => { if (!state) clearFile(); });

const { request, awaitingResponse: uploading } = useRequest();
const uploadProgress = ref(0);
const upload = () => {
  request({
    method: 'POST',
    url: apiPaths.entities(dataset.projectId, dataset.name),
    data: {
      source: { name: file.value.name, size: file.value.size },
      entities: []
    },
    onUploadProgress: (event) => { uploadProgress.value = event.progress ?? 0; }
  })
    // TODO. Emit the correct count.
    .then(() => { emit('success', 1); })
    .finally(() => { uploadProgress.value = 0; })
    .catch(noop);
};

// The max height of a table
const tableHeight = ref(0);
const setTableHeight = (heightOfModalBody) => {
  tableHeight.value = heightOfModalBody / 2;
};

// Resize the last column of the tables.
const tables = [null, null];
const setTable = (i) => (el) => { tables[i] = el; };
const resizeLastColumn = () => {
  for (const table of tables) table.resizeLastColumn();
};
watch([() => props.state, file], () => { nextTick(resizeLastColumn); });
useEventListener(window, 'resize', () => {
  if (props.state) resizeLastColumn();
});
</script>

<style lang="scss">
@keyframes tocorner {
  0% { transform: translate(-70px, -70px); }
  100% { transform: translate(0, 0); }
}

#entity-upload {
  .backdrop {
    opacity: 0.27;
    pointer-events: none;
  }
}

#entity-upload-popups {
  animation-duration: 2s;
  animation-name: tocorner;
  animation-timing-function: cubic-bezier(0.05, 0.9, 0, 1);
  bottom: 70px;
  position: absolute;
  right: 15px;
  width: 305px;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Import Data from File",
    "table": {
      // This is shown above a list of Entities on the server. {name} is the
      // name of the Entity List.
      "server": "{name} server data",
      "file": "Data to import"
    },
    // @transifexKey component.EntityList.noEntities
    "noEntities": "There are no Entities to show.",
    "headersNote": "The first row in your data file must exactly match the table header you see above.",
    "action": {
      "append": "Append data"
    }
  }
}
</i18n>
