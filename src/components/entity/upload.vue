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
    backdrop @hide="$emit('hide')" @mutate="resizeColumnUnlessAnimating">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div :class="{ backdrop: uploading }">
        <div class="panel panel-simple">
          <div class="panel-heading">
            <h1 class="panel-title" v-tooltip.text>
              {{ $t('table.server', dataset) }}
            </h1>
          </div>
          <div class="panel-body">
            <entity-upload-table :ref="setTable(0)"
              :entities="serverEntities.value" :row-index="serverRow"
              :page-size="serverPage.size"
              :awaiting-response="serverEntities.awaitingResponse"/>
            <loading :state="serverEntities.initiallyLoading"/>
            <p v-if="serverEntities.dataExists && serverEntities.value.length === 0"
              class="empty-table-message">
              {{ $t('noEntities') }}
            </p>
            <pagination v-if="serverPage.count !== 0"
              v-model:page="serverPage.page" v-model:size="serverPage.size"
              :count="serverPage.count" :size-options="pageSizeOptions"
              :spinner="serverEntities.awaitingResponse"/>
          </div>
        </div>
        <div class="panel panel-simple">
          <div class="panel-heading">
            <h1 class="panel-title">{{ $t('table.file') }}</h1>
          </div>
          <div class="panel-body">
            <entity-upload-table :ref="setTable(1)" :entities="csvSlice"
              :row-index="csvRow" :page-size="csvPage.size"/>
            <pagination v-if="csvEntities != null" v-model:page="csvPage.page"
              v-model:size="csvPage.size" :count="csvEntities.length"
              :size-options="pageSizeOptions"/>
          </div>
        </div>
        <entity-upload-file-select v-show="csvEntities == null"
          :parsing="parsing" @change="selectFile">
          <entity-upload-help :errors="csvErrors"/>
        </entity-upload-file-select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary"
          :aria-disabled="csvEntities == null || uploading" @click="upload">
          {{ $t('action.append') }}
        </button>
        <button type="button" class="btn btn-link" :aria-disabled="uploading"
          @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
      </div>
      <div v-if="csvEntities != null" id="entity-upload-popups"
        @animationstart="animatePopup(true)"
        @animationend="animatePopup(false)">
        <entity-upload-popup :filename="fileMetadata.name" :count="csvEntities.length"
          :awaiting-response="uploading" :progress="uploadProgress"
          @clear="clearFile"/>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import EntityUploadFileSelect from './upload/file-select.vue';
import EntityUploadHelp from './upload/help.vue';
import EntityUploadPopup from './upload/popup.vue';
import EntityUploadTable from './upload/table.vue';
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import Pagination from '../pagination.vue';

import useEventListener from '../../composables/event-listener';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { formatCSVRow, parseCSV, parseCSVHeader } from '../../util/csv';
import { noop, throttle } from '../../util/util';
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
// serverRow.value holds the 0-indexed row number of the first entity of
// serverEntities.value. Usually, that will be the same as the first row of the
// page (i.e., serverPage.page * serverPage.count). However, the two may differ
// while a request for entities is in progress.
const serverRow = ref(-1);
watch(() => props.state, (state) => {
  if (state) {
    if (dataset.entities !== 0) {
      serverPage.page = 0;
      const now = new Date().toISOString();
      odataFilter = `__system/createdAt le ${now}`;
    } else {
      serverEntities.data = { value: [] };
    }
  } else {
    serverEntities.reset();
    Object.assign(serverPage, { count: 0, page: -1, size: defaultPageSize });
    odataFilter = null;
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

// FILE SELECTION AND PARSING
// Entities from the CSV file
const csvEntities = shallowRef(null);
// Metadata about the CSV file
const fileMetadata = shallowRef(null);
// If the CSV file is invalid, then either an alert is shown, or
// EntityUploadErrors is rendered. If an alert is shown, then alertedAt is set,
// allowing the alert to be hidden later. If EntityUploadErrors is rendered,
// then csvErrors is set with props for the component.
let alertedAt;
const csvErrors = shallowRef(null);
const parsing = ref(false);
// Function to abort parsing in progress
let abortParse = noop;
// Validates the column header of the CSV file, setting csvErrors if the header
// is invalid. Returns `true` if the header is valid and `false` if not.
const validateHeader = ({ columns, errors, meta }, file) => {
  const details = {};
  // If there are errors from Papa Parse, just surface those and don't check for
  // other errors. If there are errors from Papa, then there is something pretty
  // wrong that may need to be addressed first.
  if (errors.length !== 0) {
    details.invalidQuotes = errors.some(({ type }) => type === 'Quotes');
  } else {
    const columnSet = new Set();
    for (const column of columns) {
      if (/^\s*$/.test(column))
        details.emptyColumn = true;
      else if (columnSet.has(column))
        details.duplicateColumn = true;
      else
        columnSet.add(column);
    }
    const hasLabel = columnSet.has('label');
    details.missingLabel = !hasLabel;
    const columnProperties = dataset.properties.reduce(
      (count, { name }) => (columnSet.has(name) ? count + 1 : count),
      0
    );
    details.missingProperty = columnProperties !== dataset.properties.length;
    details.unknownProperty = columnSet.size !== columnProperties +
      (hasLabel ? 1 : 0);
  }
  if (!Object.values(details).includes(true)) return true;
  csvErrors.value = {
    filename: file.name,
    header: formatCSVRow(columns, { delimiter: meta.delimiter }),
    delimiter: meta.delimiter,
    ...details
  };
  return false;
};
const { t } = useI18n();
// noPropertyData is used to minimize the JSON sent to Backend: the JSON won't
// specify a `data` property for an entity without property data.
const noPropertyData = { toJSON: () => undefined };
const rowToEntity = (values, columns) => {
  const obj = Object.create(null);
  let hasProperty = false;
  for (const [i, value] of values.entries()) {
    if (value === '') continue; // eslint-disable-line no-continue
    const column = columns[i];
    obj[column] = value;
    if (column !== 'label') hasProperty = true;
  }
  const { label } = obj;
  if (label == null || /^\s+$/.test(label))
    throw new Error(t('alert.blankLabel'));
  if (hasProperty) {
    delete obj.label;
    return { label, data: obj };
  }
  obj.data = noPropertyData;
  return obj;
};
const { i18n: globalI18n, alert } = inject('container');
const parseEntities = async (file, headerResults, signal) => {
  const { data } = await parseCSV(globalI18n, file, headerResults.columns, {
    delimiter: headerResults.meta.delimiter,
    transformRow: rowToEntity,
    signal
  });
  if (data.length === 0) throw new Error(t('alert.noData'));
  csvEntities.value = data;
  fileMetadata.value = { name: file.name, size: file.size };
};
const selectFile = async (file) => {
  // Hide any previous errors.
  if (alert.state && alert.at === alertedAt) {
    alert.blank();
    alertedAt = null;
  }
  csvErrors.value = null;

  parsing.value = true;
  const abortController = new AbortController();
  abortParse = () => { abortController.abort(); };
  const { signal } = abortController;
  try {
    const headerResults = await parseCSVHeader(globalI18n, file, signal);
    if (validateHeader(headerResults, file))
      await parseEntities(file, headerResults, signal);
  } catch (error) {
    if (!signal.aborted) {
      alert.danger(error.message);
      alertedAt = alert.at;
    }
  } finally {
    parsing.value = false;
    abortParse = noop;
  }
};
const clearFile = () => {
  csvEntities.value = null;
  fileMetadata.value = null;
};
watch(() => props.state, (state) => {
  if (state) return;
  abortParse();
  csvEntities.value = null;
  fileMetadata.value = null;
  alertedAt = null;
  csvErrors.value = null;
});
onBeforeUnmount(() => { abortParse(); });

const csvPage = reactive({ page: 0, size: defaultPageSize });
const csvRow = computed(() =>
  (csvEntities.value != null ? csvPage.page * csvPage.size : null));
const csvSlice = computed(() => (csvEntities.value != null
  ? csvEntities.value.slice(csvRow.value, csvRow.value + csvPage.size)
  : null));
watch(csvEntities, (value) => {
  if (value == null) Object.assign(csvPage, { page: 0, size: defaultPageSize });
});

const { request, awaitingResponse: uploading } = useRequest();
const uploadProgress = ref(0);
const upload = () => {
  request({
    method: 'POST',
    url: apiPaths.entities(dataset.projectId, dataset.name),
    data: { source: fileMetadata.value, entities: csvEntities.value },
    onUploadProgress: (event) => { uploadProgress.value = event.progress ?? 0; }
  })
    .then(() => { emit('success', csvEntities.value.length); })
    .finally(() => { uploadProgress.value = 0; })
    .catch(noop);
};

const popupAnimating = ref(false);
const animatePopup = (value) => { popupAnimating.value = value; };
watch(csvEntities, (value) => {
  if (value == null) popupAnimating.value = false;
});

// Resize the last column of the tables.
const tables = [null, null];
const setTable = (i) => (el) => { tables[i] = el; };
const resizeLastColumn = () => {
  for (const table of tables) table.resizeLastColumn();
};
watch(() => props.state, () => { nextTick(resizeLastColumn); });
watch(popupAnimating, (value) => { if (!value) resizeLastColumn(); });
const resizeColumnUnlessAnimating = throttle(() => {
  if (props.state && !popupAnimating.value) resizeLastColumn();
});
useEventListener(window, 'resize', resizeColumnUnlessAnimating);

watch(() => props.state, (state) => {
  if (!state) {
    for (const table of tables) table.resetScroll();
  }
});
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

@keyframes tocorner {
  0% { transform: translate(-70px, -70px); }
  100% { transform: translate(0, 0); }
}

#entity-upload {
  .backdrop {
    opacity: 0.27;
    pointer-events: none;
  }

  .panel-simple {
    margin-bottom: 0;

    .panel-heading {
      @include text-overflow-ellipsis;
      background-color: #ccc;
      border-bottom: none;
    }

    .panel-body { padding: 0; }
  }
  .panel-simple + .panel-simple {
    .panel-heading {
      background-color: $color-action-background;
      color: #fff;
    }

    thead { background-color: #c5dfe7; }
  }

  .pagination { margin-left: $padding-left-table-data; }

  // margin-bottom of the tables
  .entity-upload-table {
    // The margin before text, either the Loading component or the
    // .empty-table-message
    margin-bottom: 10px;
    // The margin before the Pagination component
    &:has(tbody) { margin-bottom: 0; }
    // The margin if there is no text or Pagination
    &:last-child { margin-bottom: 0; }
  }
  // margin-bottom of the first .panel-simple
  .panel-simple:first-child {
    // The margin if the last element of the .panel-body is text
    margin-bottom: 10px;
    // The margin if the last element is Pagination
    &:has(tbody) { margin-bottom: 12px; }
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
    "action": {
      "append": "Append data"
    },
    "alert": {
      "blankLabel": "The label is missing.",
      "noData": "Your file does not contain any data."
    }
  }
}
</i18n>
