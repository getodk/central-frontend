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
  <modal id="entity-upload" :state="state" :hideable="!uploading" :persistent="true" size="full"
    backdrop @hide="hide" @mutate="resizeColumnIfShown">
    <template #title>{{ $t('action.append') }}</template>
    <template #body>
      <div :class="{ backdrop: uploading }" :inert="uploading">
        <p class="entity-upload-section-title">{{ $t('currentEntities') }}</p>
        <div class="entity-upload-table-container">
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

        <div v-show="csvEntities != null">
          <p class="entity-upload-section-title">{{ $t('newEntities') }}</p>
          <div class="entity-upload-table-container panel panel-simple">
            <div class="panel-heading">
              <h1 class="panel-title">{{ $t('table.file') }}</h1>
            </div>
            <div class="panel-body">
              <entity-upload-table :ref="setTable(1)" :entities="csvSlice"
                :extra-properties="propertiesToCreate" :row-index="csvRow"
                :page-size="csvPage.size" :highlighted="warningRows"/>
              <pagination v-if="csvEntities != null" v-model:page="csvPage.page"
                v-model:size="csvPage.size" :count="csvEntities.length"
                :size-options="pageSizeOptions"/>
            </div>
          </div>
        </div>

        <entity-upload-errors v-if="errors != null" v-bind="errors"
          :delimiter="fileMetadata.delimiter"/>
        <entity-upload-warnings v-if="warnings != null" v-bind="warnings"
          :filename="fileMetadata.name" :has-error="errors != null"
          @rows="showWarningRows">
          <template #extra-properties>
            <entity-upload-extra-properties :properties="warnings.extraProperties"
              :selected="selectedProperties" :created="propertyCreator.created"
              :disabled="errors != null" @toggle="toggleExtraProperty"/>
          </template>
        </entity-upload-warnings>

        <entity-upload-file-select :data-template="csvEntities == null"
          :errors="errors?.count" :disabled="parsing || uploading"
          :parsing="parsing" @change="selectFile"/>
      </div>
      <entity-upload-popup v-if="uploading" :filename="fileMetadata.name"
        :count="csvEntities.length"
        :extra-properties="propertiesToCreate != null"
        :progress="uploadProgress"/>
      <div ref="actions" class="modal-actions">
        <button type="button" class="btn btn-link" :aria-disabled="uploading"
          @click="hide">
          {{ $t('action.cancel') }}
        </button>
        <button type="button" class="btn btn-primary"
          :aria-disabled="csvEntities == null || uploading" @click="upload">
          {{ $t('action.append') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue';
import { identity, pick } from 'ramda';
import { useI18n } from 'vue-i18n';

import EntityUploadErrors from './upload/errors.vue';
import EntityUploadExtraProperties from './upload/extra-properties.vue';
import EntityUploadFileSelect from './upload/file-select.vue';
import EntityUploadPopup from './upload/popup.vue';
import EntityUploadTable from './upload/table.vue';
import EntityUploadWarnings from './upload/warnings.vue';
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import Pagination from '../pagination.vue';

import useEventListener from '../../composables/event-listener';
import usePropertyCreator from '../../composables/property-creator';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { odataEntityToRest } from '../../util/odata';
import { parseCSV, parseCSVHeader } from '../../util/csv';
import { useRequestData } from '../../request-data';
import { validatePropertyName } from '../../util/entity';

defineOptions({
  name: 'EntityUpload'
});
const props = defineProps({
  state: Boolean
});
const emit = defineEmits(['hide', 'success']);

const { t } = useI18n();
const { i18n: globalI18n, redAlert } = inject('container');
const { dataset, createResource } = useRequestData();
const { request, awaitingResponse: uploading } = useRequest();

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

// Validates the column header of the CSV file, returning any errors or
// warnings.
const validateHeader = ({ columns, errors: papaErrors }) => {
  const errorDetails = {};
  const warningDetails = {};

  // If there are errors from Papa Parse, just surface those and don't check for
  // other errors. If there are errors from Papa, then there is something pretty
  // wrong that may need to be addressed first.
  if (papaErrors.length !== 0) {
    errorDetails.invalidQuotes = papaErrors.some(({ type }) => type === 'Quotes');
  } else {
    const columnSet = new Set();
    const duplicateColumns = new Set();
    for (const column of columns) {
      if (/^\s*$/.test(column))
        errorDetails.emptyColumn = true;
      else if (columnSet.has(column))
        duplicateColumns.add(column);
      else
        columnSet.add(column);
    }
    errorDetails.duplicateColumns = [...duplicateColumns];

    // A label is only required for new entities, not entity updates. If there
    // is no __id column, that means the CSV is all new entities, not updates,
    // in which case we expect there to be a label column.
    errorDetails.missingLabel = !columnSet.has('__id') && !columnSet.has('label');

    warningDetails.missingProperties = [];
    const lowercaseProperties = new Map();
    for (const { name } of dataset.properties) {
      if (!columnSet.has(name)) warningDetails.missingProperties.push(name);

      lowercaseProperties.set(name.toLowerCase(), name);
    }

    warningDetails.systemProperties = [];
    warningDetails.invalidProperties = [];
    warningDetails.caseMismatch = [];
    warningDetails.extraProperties = [];
    for (const column of columnSet) {
      // Skip permitted system properties.
      // eslint-disable-next-line no-continue
      if (column === '__id' || column === 'label') continue;

      if (column.startsWith('__') || column === 'name') {
        warningDetails.systemProperties.push(column);
      } else if (!validatePropertyName(column)) {
        warningDetails.invalidProperties.push(column);
      } else {
        const property = lowercaseProperties.get(column.toLowerCase());
        if (property == null)
          warningDetails.extraProperties.push(column);
        else if (column !== property)
          warningDetails.caseMismatch.push({ column, property });
      }
    }
  }

  // Normalize detail objects, adding a `count` property.
  for (const details of [errorDetails, warningDetails]) {
    let count = 0;
    for (const [name, value] of Object.entries(details)) {
      if (value === true || value === false) { // Boolean value
        if (value) count += 1;
      } else if (Array.isArray(value)) {
        if (value.length !== 0)
          count += 1;
        else
          // Remove empty arrays from the object. EntityUploadErrors and
          // EntityUploadWarnings expect nullish values rather than empty arrays
          // for nonapplicable errors/warnings.
          delete details[name];
      } else {
        throw new Error('unexpected detail value');
      }
    }
    details.count = count;
  }

  const result = {};
  if (errorDetails.count !== 0) result.errors = errorDetails;
  if (warningDetails.count !== 0) result.warnings = warningDetails;
  return result;
};

// PARSING CSV DATA BELOW COLUMN HEADER
// noPropertyData is used to minimize the JSON sent to Backend: the JSON won't
// specify a `data` property for an entity without property data.
const noPropertyData = { toJSON: () => undefined };
const extractUUID = (values, index) => {
  if (index === -1) return null;
  const value = values[index];
  if (/^\s*$/.test(value)) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
    throw new Error(t('alert.invalidUUID', { value }));
  return value.toLowerCase();
};
const extractLabel = (values, index) => {
  if (index === -1) return null;
  const label = values[index];
  if (/^\s*$/.test(label)) throw new Error(t('alert.blankLabel'));
  return label;
};
const rowToEntity = (uuidIndex, labelIndex, extraProperties) => (values, columns) => {
  const uuid = extractUUID(values, uuidIndex);
  const label = extractLabel(values, labelIndex);

  const data = dataset.properties.length !== 0 ? Object.create(null) : null;
  let hasProperty = false;
  const extraData = extraProperties.size !== 0 ? Object.create(null) : null;
  let hasExtra = false;
  // Iterate over property data.
  for (const [i, value] of values.entries()) {
    // If it's a new entity (if uuid == null), skip empty property values; leave
    // them missing. Since it's a CSV, we can't distinguish between an empty
    // value and a missing one. Sending empty values would increase the size of
    // the payload. For an entity update, we need to include empty values in
    // order to overwrite existing values.
    if (uuid == null && value === '') continue; // eslint-disable-line no-continue

    const column = columns[i];
    if (dataset.propertyMap.has(column)) {
      data[column] = value;
      hasProperty = true;
    } else if (extraProperties.has(column)) {
      extraData[column] = value;
      hasExtra = true;
    }
  }

  const result = {};
  if (uuid != null) result.uuid = uuid;
  if (label != null) result.label = label;
  result.data = hasProperty ? data : noPropertyData;
  if (hasExtra) result.extra = extraData;
  return result;
};
const parseEntities = async (file, headerResults, extraProperties, signal) => {
  const { columns } = headerResults;
  const results = await parseCSV(globalI18n, file, columns, {
    delimiter: headerResults.meta.delimiter,
    transformRow: rowToEntity(
      columns.indexOf('__id'),
      columns.indexOf('label'),
      new Set(extraProperties ?? [])
    ),
    signal
  });
  if (results.data.length === 0) throw new Error(t('alert.noData'));
  return results;
};

// FILE SELECTION
// Entities from the CSV file
const csvEntities = shallowRef(null);
// Metadata about the CSV file
const fileMetadata = shallowRef(null);
const errors = shallowRef(null);
const warnings = shallowRef(null);
const parsing = ref(false);
// Function to abort parsing in progress
let abortParse = noop;
const selectFile = (file) => {
  redAlert.hide();
  csvEntities.value = null;
  fileMetadata.value = null;
  errors.value = null;
  warnings.value = null;

  const abortController = new AbortController();
  abortParse = () => { abortController.abort(); };
  const { signal } = abortController;

  parsing.value = true;
  return parseCSVHeader(globalI18n, file, signal)
    .catch(error => {
      if (!signal.aborted) redAlert.show(error.message);
      throw error;
    })
    .then(headerResults => {
      fileMetadata.value = {
        name: file.name,
        size: file.size,
        delimiter: headerResults.meta.delimiter
      };

      const validation = validateHeader(headerResults);
      if (validation.errors != null) {
        errors.value = validation.errors;
        warnings.value = validation.warnings;
        return Promise.resolve();
      }

      const extraProperties = validation.warnings?.extraProperties;
      return parseEntities(file, headerResults, extraProperties, signal)
        .then(results => {
          csvEntities.value = results.data;

          if (validation.warnings != null || results.warnings.count !== 0) {
            warnings.value = {
              ...validation.warnings,
              ...results.warnings.details,
              count: (validation.warnings?.count ?? 0) + results.warnings.count
            };
          }
        })
        .catch(error => {
          if (!signal.aborted) {
            errors.value = { dataError: error.message, count: 1 };
            warnings.value = validation.warnings;
          }

          throw error;
        });
    })
    .finally(() => {
      parsing.value = false;
      abortParse = noop;
    })
    .catch(noop);
};
onBeforeUnmount(() => { abortParse(); });

const csvPage = reactive({ page: 0, size: defaultPageSize });
const csvRow = computed(() =>
  (csvEntities.value != null ? csvPage.page * csvPage.size : -1));
const csvSlice = computed(() => (csvEntities.value != null
  ? csvEntities.value.slice(csvRow.value, csvRow.value + csvPage.size)
  : null));
watch(csvEntities, (value) => {
  if (value == null) Object.assign(csvPage, { page: 0, size: defaultPageSize });
});

// Rows of a warning that the user has selected to see
const warningRows = shallowRef(null);
const showWarningRows = (range) => {
  csvPage.page = Math.floor(range[0] / csvPage.size);
  warningRows.value = range;
};
watch(csvEntities, (value) => { if (value == null) warningRows.value = null; });

// CREATING NEW PROPERTIES
const selectedProperties = reactive(new Set());
const toggleExtraProperty = (name, selected) => {
  if (selected)
    selectedProperties.add(name);
  else
    selectedProperties.delete(name);
};
// Because selectedProperties persists from one file selection to the next, it
// is not necessarily a subset of warnings.value.extraProperties. Either list
// may include properties that the other does not. propertiesToCreate represents
// the intersection of the two lists.
const propertiesToCreate = computed(() => {
  const result = warnings.value?.extraProperties?.filter(name =>
    selectedProperties.has(name));
  return result != null && result.length !== 0 ? result : null;
});
const propertyCreator = usePropertyCreator(request);
const _mergeDataWithExtra = (data, extraData) => {
  if (propertiesToCreate.value == null) return data;

  if (propertiesToCreate.value.length === warnings.value.extraProperties.length &&
    data === noPropertyData)
    return extraData;

  // `merged` combines `data` and `extraData`.
  const merged = Object.create(null);
  let hasExtra = false;
  for (const name of propertiesToCreate.value) {
    const value = extraData[name];
    if (value != null) {
      merged[name] = value;
      hasExtra = true;
    }
  }
  if (!hasExtra) return data;
  if (data !== noPropertyData) Object.assign(merged, data);
  return merged;
};
const mergeDataWithExtra = (entity) => (entity.extra == null
  ? entity
  : {
    ...pick(['uuid', 'label'], entity),
    data: _mergeDataWithExtra(entity.data, entity.extra)
  });

// UPLOAD REQUEST
const uploadProgress = ref(null);
// Separates new entities from entity updates before sending the upload request.
const entitiesByAction = () => {
  const entities = [];
  const updates = [];
  const transform = warnings.value?.extraProperties == null
    ? identity
    : mergeDataWithExtra;
  for (const entity of csvEntities.value)
    (entity.uuid == null ? entities : updates).push(transform(entity));

  const result = {};
  if (entities.length !== 0) result.entities = entities;
  if (updates.length !== 0) result.updates = updates;
  return result;
};
const upload = () => {
  propertyCreator.request(
    apiPaths.datasetProperties(dataset.projectId, dataset.name),
    propertiesToCreate.value,
    ['name', 'datasetId']
  )
    .then(() => {
      const data = {
        source: pick(['name', 'size'], fileMetadata.value),
        ...entitiesByAction()
      };
      uploadProgress.value = 0;
      return request({
        method: 'POST',
        url: apiPaths.entities(dataset.projectId, dataset.name),
        data,
        onUploadProgress: (event) => { uploadProgress.value = event.progress ?? 0; }
      })
        .finally(() => { uploadProgress.value = null; })
        .then(() => {
          emit('success', data.entities?.length ?? 0, propertyCreator.created.size !== 0);
        });
    })
    .catch(noop);
};

// Resize the last column of the tables.
const tables = [null, null];
const setTable = (i) => (el) => { tables[i] = el; };
const resizeLastColumn = () => {
  for (const table of tables) table.resizeLastColumn();
};
watch(() => props.state, (state) => { if (!state) nextTick(resizeLastColumn); });
const resizeColumnIfShown = () => { if (props.state) resizeLastColumn(); };
useEventListener(window, 'resize', resizeColumnIfShown);

const actions = ref(null);
watch([errors, warnings, csvEntities], () => {
  if (errors.value == null && warnings.value == null && csvEntities.value != null)
    nextTick(() => { actions.value.scrollIntoView(); });
});

const hide = () => { emit('hide', propertyCreator.created.size !== 0); };
watch(() => props.state, (state) => {
  if (state) return;
  abortParse();
  csvEntities.value = null;
  fileMetadata.value = null;
  errors.value = null;
  warnings.value = null;
  selectedProperties.clear();
  propertyCreator.clear();
  for (const table of tables) table.resetScroll();
});
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-upload {
  .backdrop {
    opacity: 0.27;
    pointer-events: none;
  }

  .panel-simple {
    .panel-heading {
      background-color: $color-action-background;
      border-bottom: none;
      color: #fff;
    }

    .panel-body { padding: 0; }
    thead { background-color: #c5dfe7; }
  }

  .pagination { margin-left: $padding-left-table-data; }

  .entity-upload-table-container { margin-block: 10px 20px; }
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

  .modal-actions { border-top: 1px solid $central-grey-2; }
}

.entity-upload-section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;

  // Explanatory/descriptive text that immediately follows the title
  + p, + p + p {
    margin-bottom: 10px;
    &:last-of-type { margin-bottom: 20px; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "currentEntities": "Your current Entities",
    "newEntities": "New Entities",
    "table": {
      "file": "Data to import"
    },
    // @transifexKey component.EntityList.noEntities
    "noEntities": "There are no Entities to show.",
    "action": {
      "append": "Append Entities"
    },
    "alert": {
      "invalidUUID": "Invalid UUID “{value}”.",
      "blankLabel": "Missing label.",
      "noData": "Your file does not contain any data."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "noEntities": "Nejsou zde žádné subjekty, které by bylo možné zobrazit."
  },
  "de": {
    "table": {
      "file": "Zu importierende Daten"
    },
    "alert": {
      "blankLabel": "Fehlende Etikett.",
      "noData": "Ihre Datei enthält keine Daten."
    },
    "noEntities": "Es gibt keine Objekte zum Anzeigen."
  },
  "es": {
    "table": {
      "file": "Datos a importar"
    },
    "alert": {
      "blankLabel": "Falta la etiqueta.",
      "noData": "Su archivo no contiene ningún dato."
    },
    "noEntities": "No hay Entidades para mostrar."
  },
  "fr": {
    "currentEntities": "Vos entités actuelles",
    "newEntities": "Nouvelles entités",
    "table": {
      "file": "Données à importer"
    },
    "action": {
      "append": "Ajouter entités"
    },
    "alert": {
      "blankLabel": "Étiquette manquante.",
      "noData": "Votre fichier ne contient aucune donnée"
    },
    "noEntities": "Pas d'entités à montrer."
  },
  "it": {
    "newEntities": "Nuove Entità",
    "table": {
      "file": "Dati da importare"
    },
    "alert": {
      "blankLabel": "Etichetta mancante",
      "noData": "Il tuo file non contiene alcun dato."
    },
    "noEntities": "Non ci sono entità da mostrare."
  },
  "pt": {
    "table": {
      "file": "Dados para importar"
    },
    "alert": {
      "blankLabel": "Rótulo faltando.",
      "noData": "Seu arquivo não contém dados."
    },
    "noEntities": "Não há Entidades para mostrar."
  },
  "sw": {
    "noEntities": "Hakuna Fomu za kuonyesha."
  },
  "zh": {
    "table": {
      "file": "要导入的数据"
    },
    "alert": {
      "blankLabel": "无标签",
      "noData": "您的文件不包含任何数据。"
    },
    "noEntities": "暂无实体可显示。"
  },
  "zh-Hant": {
    "table": {
      "file": "要導入的資料"
    },
    "alert": {
      "blankLabel": "標籤遺失。",
      "noData": "您的文件不包含任何資料。"
    },
    "noEntities": "沒有可顯示的實體。"
  }
}
</i18n>
