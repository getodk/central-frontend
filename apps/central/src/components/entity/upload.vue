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
            <entity-upload-warnings v-if="warnings != null && warnings.count !== 0"
              v-bind="warnings.details" @rows="showWarningRows"/>
            <entity-upload-table :ref="setTable(1)" :entities="csvSlice"
              :row-index="csvRow" :page-size="csvPage.size"
              :highlighted="warningRows"/>
            <pagination v-if="csvEntities != null" v-model:page="csvPage.page"
              v-model:size="csvPage.size" :count="csvEntities.length"
              :size-options="pageSizeOptions"/>
          </div>
        </div>
        <entity-upload-file-select v-show="csvEntities == null"
          :parsing="parsing" @change="selectFile">
          <entity-upload-header-help :errors="headerErrors"/>
          <entity-upload-data-error v-if="dataError != null"
            :message="dataError"/>
        </entity-upload-file-select>
      </div>
      <entity-upload-popup v-if="csvEntities != null"
        :filename="fileMetadata.name" :count="csvEntities.length"
        :warnings="warnings.count" :awaiting-response="uploading"
        :progress="uploadProgress" @clear="clearFile"
        @animationstart="animatePopup(true)"
        @animationend="animatePopup(false)"/>
      <div ref="actions" class="modal-actions">
        <button type="button" class="btn btn-link" :aria-disabled="uploading"
          @click="$emit('hide')">
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
import { useI18n } from 'vue-i18n';

import EntityUploadDataError from './upload/data-error.vue';
import EntityUploadFileSelect from './upload/file-select.vue';
import EntityUploadHeaderHelp from './upload/header-help.vue';
import EntityUploadPopup from './upload/popup.vue';
import EntityUploadTable from './upload/table.vue';
import EntityUploadWarnings from './upload/warnings.vue';
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import Pagination from '../pagination.vue';

import useEventListener from '../../composables/event-listener';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { formatCSVRow, parseCSV, parseCSVHeader } from '../../util/csv';
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
const headerErrors = shallowRef(null);
const dataError = ref(null);
const warnings = shallowRef(null);
const parsing = ref(false);
// Function to abort parsing in progress
let abortParse = noop;
// Validates the column header of the CSV file, setting headerErrors if the
// header is invalid. Returns `true` if the header is valid and `false` if not.
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
  headerErrors.value = {
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
const { i18n: globalI18n, redAlert } = inject('container');
const parseEntities = async (file, headerResults, signal) => {
  const results = await parseCSV(globalI18n, file, headerResults.columns, {
    delimiter: headerResults.meta.delimiter,
    transformRow: rowToEntity,
    signal
  });
  if (results.data.length === 0) throw new Error(t('alert.noData'));
  csvEntities.value = results.data;
  fileMetadata.value = { name: file.name, size: file.size };
  warnings.value = results.warnings;
};
const selectFile = (file) => {
  redAlert.hide();
  headerErrors.value = null;
  dataError.value = null;

  const abortController = new AbortController();
  abortParse = () => { abortController.abort(); };
  const { signal } = abortController;

  parsing.value = true;
  return parseCSVHeader(globalI18n, file, signal)
    .catch(error => {
      if (!signal.aborted) redAlert.show(error.message);
      throw error;
    })
    .then(headerResults => (validateHeader(headerResults, file)
      ? parseEntities(file, headerResults, signal)
        .catch(error => {
          if (!signal.aborted) dataError.value = error.message;
          throw error;
        })
      : Promise.resolve()))
    .finally(() => {
      parsing.value = false;
      abortParse = noop;
    })
    .catch(noop);
};
const clearFile = () => {
  csvEntities.value = null;
  fileMetadata.value = null;
  warnings.value = null;
};
watch(() => props.state, (state) => {
  if (state) return;
  abortParse();
  csvEntities.value = null;
  fileMetadata.value = null;
  headerErrors.value = null;
  dataError.value = null;
  warnings.value = null;
});
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
const animatePopup = (animating) => { popupAnimating.value = animating; };
watch(csvEntities, (value) => {
  if (value == null) popupAnimating.value = false;
});

// Resize the last column of the tables.
const tables = [null, null];
const setTable = (i) => (el) => { tables[i] = el; };
const resizeLastColumn = () => {
  for (const table of tables) table.resizeLastColumn();
};
watch(popupAnimating, (animating) => { if (!animating) resizeLastColumn(); });
watch(() => props.state, (state) => { if (!state) nextTick(resizeLastColumn); });
const resizeColumnUnlessAnimating = () => {
  if (props.state && !popupAnimating.value) resizeLastColumn();
};
useEventListener(window, 'resize', resizeColumnUnlessAnimating);

const actions = ref(null);
watch(csvEntities, (value) => {
  if (value != null) nextTick(() => { actions.value.scrollIntoView(); });
});

watch(() => props.state, (state) => {
  if (!state) {
    for (const table of tables) table.resetScroll();
  }
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

  .panel-danger {
    box-shadow: none;
    margin-bottom: 0;

    $panel-danger-border-radius: 3px;
    .panel-heading {
      border-top-left-radius: $panel-danger-border-radius;
      border-top-right-radius: $panel-danger-border-radius;
    }
    .panel-body {
      border: none;
      border-bottom-left-radius: $panel-danger-border-radius;
      border-bottom-right-radius: $panel-danger-border-radius;
    }
  }
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
    "title": "Daten aus Datei importieren",
    "table": {
      "server": "{name} Serverdaten",
      "file": "Zu importierende Daten"
    },
    "action": {
      "append": "Daten hinzufügen"
    },
    "alert": {
      "blankLabel": "Fehlende Etikett.",
      "noData": "Ihre Datei enthält keine Daten."
    },
    "noEntities": "Es gibt keine Objekte zum Anzeigen."
  },
  "es": {
    "title": "Importar datos de un archivo",
    "table": {
      "server": "{name} datos del servidor",
      "file": "Datos a importar"
    },
    "action": {
      "append": "Añadir datos"
    },
    "alert": {
      "blankLabel": "Falta la etiqueta.",
      "noData": "Su archivo no contiene ningún dato."
    },
    "noEntities": "No hay Entidades para mostrar."
  },
  "fr": {
    "title": "Importer des données depuis un fichier",
    "table": {
      "server": "{name} : données du serveur",
      "file": "Données à importer"
    },
    "action": {
      "append": "Ajouter les données"
    },
    "alert": {
      "blankLabel": "Étiquette manquante.",
      "noData": "Votre fichier ne contient aucune donnée"
    },
    "noEntities": "Pas d'entités à montrer."
  },
  "it": {
    "title": "Importa Dati da File",
    "table": {
      "server": "{name} dati del server",
      "file": "Dati da importare"
    },
    "action": {
      "append": "Aggiungi dati"
    },
    "alert": {
      "blankLabel": "Etichetta mancante",
      "noData": "Il tuo file non contiene alcun dato."
    },
    "noEntities": "Non ci sono entità da mostrare."
  },
  "pt": {
    "title": "Importar dados de arquivo",
    "table": {
      "server": "Dados do servidor {name}",
      "file": "Dados para importar"
    },
    "action": {
      "append": "Anexar dados"
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
    "title": "从文件导入数据",
    "table": {
      "server": "{name}服务器数据",
      "file": "要导入的数据"
    },
    "action": {
      "append": "添加数据"
    },
    "alert": {
      "blankLabel": "无标签",
      "noData": "您的文件不包含任何数据。"
    },
    "noEntities": "暂无实体可显示。"
  },
  "zh-Hant": {
    "title": "從文件匯入數據",
    "table": {
      "server": "{name} 伺服器數據",
      "file": "要導入的資料"
    },
    "action": {
      "append": "追加資料"
    },
    "alert": {
      "blankLabel": "標籤遺失。",
      "noData": "您的文件不包含任何資料。"
    },
    "noEntities": "沒有可顯示的實體。"
  }
}
</i18n>
