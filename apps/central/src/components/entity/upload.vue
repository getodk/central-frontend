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
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div :class="{ backdrop: uploading }" :inert="uploading">
        <div v-show="csvEntities != null">
          <p class="entity-upload-section-title">{{ $t('common.preview') }}</p>
          <entity-upload-row-counts v-if="csvEntities != null"
            v-bind="rowCounts"/>
          <div class="entity-upload-table-container">
            <entity-upload-table ref="table" :entities="csvSlice"
              :extra-properties="propertiesToCreate" :row-index="csvRow"
              :page-size="csvPage.size" :highlighted="alertRows"/>
            <loading v-if="csvSlice == null" :state="serverEntities.awaitingResponse"/>
            <pagination v-else v-model:page="csvPage.page"
              v-model:size="csvPage.size" :count="csvEntities.length"
              :size-options="pageSizeOptions"
              :spinner="serverEntities.awaitingResponse"/>
          </div>
        </div>

        <entity-upload-errors v-if="errors != null" v-bind="errors"
          :delimiter="fileMetadata.delimiter" @rows="showAlertRows"/>
        <entity-upload-warnings v-if="warnings != null" v-bind="warnings"
          :filename="fileMetadata.name" :has-error="errors != null"
          @rows="showAlertRows">
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
          {{ $t('action.import') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, inject, nextTick, onBeforeUnmount, reactive, ref, shallowRef, watch } from 'vue';
import { pick } from 'ramda';
import { useI18n } from 'vue-i18n';

import EntityUploadErrors from './upload/errors.vue';
import EntityUploadExtraProperties from './upload/extra-properties.vue';
import EntityUploadFileSelect from './upload/file-select.vue';
import EntityUploadPopup from './upload/popup.vue';
import EntityUploadRowCounts from './upload/row-counts.vue';
import EntityUploadTable from './upload/table.vue';
import EntityUploadWarnings from './upload/warnings.vue';
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import Pagination from '../pagination.vue';

import useEventListener from '../../composables/event-listener';
import usePropertyCreator from '../../composables/property-creator';
import useRequest from '../../composables/request';
import useUploadEntities from '../../request-data/upload-entities';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
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
const { dataset } = useRequestData();
const serverEntities = useUploadEntities();
const { request, awaitingResponse: uploading } = useRequest();

// Validates the column header of the CSV file, returning any errors or
// warnings.
const validateHeader = ({ columns, errors: papaErrors }) => {
  const errorDetails = {};
  const warningDetails = {};
  // missingProperties is separated from warningDetails even though it is shown
  // as a warning, because there are cases where we don't want to surface it at
  // all.
  const missingProperties = [];

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

    const lowercaseProperties = new Map();
    for (const { name } of dataset.properties) {
      if (!columnSet.has(name)) missingProperties.push(name);

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
  if (missingProperties.length !== 0) result.missingProperties = missingProperties;
  return result;
};

// PARSING CSV DATA BELOW COLUMN HEADER
// noPropertyData is used to minimize the JSON sent to Backend: the JSON won't
// specify a `data` property for an entity without property data.
const noPropertyData = { toJSON: () => undefined };
const extractUUID = (values, index, uuids) => {
  if (index === -1) return null;
  const value = values[index];
  if (/^\s*$/.test(value)) return null;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
    throw new Error(t('alert.invalidUUID', { value }));

  const uuid = value.toLowerCase();
  if (uuids.has(uuid)) throw new Error(t('alert.duplicateUUID', { uuid }));

  return uuid;
};
const extractLabel = (values, index) => {
  if (index === -1) return null;
  const label = values[index];
  if (/^\s*$/.test(label)) throw new Error(t('alert.blankLabel'));
  return label;
};
const rowToEntity = (uuidIndex, uuids, labelIndex, extraProperties) => (values, columns) => {
  const uuid = extractUUID(values, uuidIndex, uuids);
  if (uuid != null) uuids.add(uuid);

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
      new Set(),
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
const rowCounts = computed(() => {
  if (csvEntities.value == null) return null;
  let created = 0;
  let updated = 0;
  for (const entity of csvEntities.value) {
    if (entity.uuid == null)
      created += 1;
    else
      updated += 1;
  }
  return { created, updated };
});
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

          // Assemble warnings.
          warnings.value = { count: 0, ...validation.warnings };
          if (validation.missingProperties != null && rowCounts.value.created !== 0) {
            warnings.value.missingProperties = validation.missingProperties;
            warnings.value.count += 1;
          }
          if (results.warnings.count !== 0) {
            Object.assign(warnings.value, results.warnings.details);
            warnings.value.count += results.warnings.count;
          }
          if (warnings.value.count === 0) warnings.value = null;
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

// PAGINATION
const pageSizeOptions = [5, 10, 20, 50];
const defaultPageSize = pageSizeOptions[0];
const csvPage = reactive({ page: 0, size: defaultPageSize });
// The subset of csvEntities shown in the table
const csvSlice = ref(null);
// The CSV row number of the first entity in csvSlice (0-indexed)
const csvRow = ref(-1);
watch([csvEntities, () => csvPage.page, () => csvPage.size], async () => {
  if (csvEntities.value == null) {
    serverEntities.reset();
    Object.assign(csvPage, { page: 0, size: defaultPageSize });
    csvRow.value = -1;
    csvSlice.value = null;
    return;
  }

  // Wait to set csvRow and csvSlice to these values until the request has
  // completed.
  const newRow = csvPage.page * csvPage.size;
  const newSlice = csvEntities.value.slice(newRow, newRow + csvPage.size);

  const uuids = [];
  for (const { uuid } of newSlice) {
    if (uuid != null) uuids.push(uuid);
  }
  if (uuids.length === 0) {
    serverEntities.reset();
  } else {
    try {
      await serverEntities.request({
        url: apiPaths.odataEntities(dataset.projectId, dataset.name, {
          $filter: uuids.map(uuid => `__id eq '${uuid}'`).join(' or ')
        }),
        clear: false
      });
    } catch (error) { return; }
  }

  csvRow.value = newRow;
  csvSlice.value = newSlice;
});

// UNKNOWN ENTITIES
const unknownEntities = reactive(new Map());
watch(csvSlice, (entities) => {
  if (csvSlice.value == null) {
    unknownEntities.clear();
    return;
  }

  if (!serverEntities.dataExists) return;

  for (const [i, { uuid }] of entities.entries()) {
    if (uuid != null && !serverEntities.has(uuid) && !unknownEntities.has(uuid)) {
      const row = csvRow.value + i + 1;
      unknownEntities.set(uuid, [row, row]);
    }
  }

  if (unknownEntities.size !== 0 && errors.value?.unknownEntities == null) {
    errors.value ??= { count: 0 };
    errors.value = { ...errors.value, unknownEntities, count: errors.value.count + 1 };
  }
});

// Rows of an error or warning that the user has selected to see
const alertRows = shallowRef(null);
const showAlertRows = (range) => {
  csvPage.page = Math.floor(range[0] / csvPage.size);
  alertRows.value = range;
};
watch(csvEntities, (value) => { if (value == null) alertRows.value = null; });

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
  for (const entity of csvEntities.value)
    (entity.uuid == null ? entities : updates).push(mergeDataWithExtra(entity));

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

// Resize the last column of the table.
const table = ref(null);
watch(() => props.state, (state) => {
  if (!state) nextTick(() => { table.value.resizeLastColumn(); });
});
const resizeColumnIfShown = () => { if (props.state) table.value.resizeLastColumn(); };
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
  table.value.resetScroll();
});
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-upload {
  .backdrop {
    opacity: 0.27;
    pointer-events: none;
  }

  .entity-upload-table-container {
    margin-block: 10px 20px;

    &:has(.loading) .entity-upload-table { margin-bottom: 10px; }
  }

  .pagination { margin-left: $padding-left-table-data; }

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
    "title": "Import data from file",
    "alert": {
      "invalidUUID": "Invalid UUID “{value}”.",
      "duplicateUUID": "The Entity ID {uuid} appears more than once in the file. Each update row must have a unique ID.",
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
