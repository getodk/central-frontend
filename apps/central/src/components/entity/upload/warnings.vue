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
  <div id="entity-upload-warnings">
    <p class="entity-upload-section-title">{{ $t('title') }}</p>
    <p>{{ $t('introduction') }}</p>

    <!-- Column header warnings -->
    <entity-upload-alert v-if="systemProperties != null" type="warning">
      <template #title>{{ $t('systemProperties') }}</template>
      <template #body>
        <p>{{ $tc('propertiesIgnored', systemProperties.length) }}</p>
        <p><i18n-list :list="systemProperties"/></p>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="caseMismatch != null"
      id="entity-upload-warnings-case-mismatch" type="warning">
      <template #title>{{ $t('caseMismatch.title') }}</template>
      <template #body>
        <p>
          <span>{{ $t('caseMismatch.description') }}</span>
          <sentence-separator/>
          <span>{{ $tc('columnsIgnored', caseMismatch.length) }}</span>
        </p>
        <div>
          <table class="table">
            <thead>
              <tr>
                <th>{{ $t('header.existingProperty') }}</th>
                <th v-tooltip.text>{{ filename }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="{ column, property } of caseMismatch" :key="column">
                <td v-tooltip.text>{{ property }}</td>
                <td v-tooltip.text>{{ column }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="invalidProperties != null" type="warning">
      <template #title>{{ $tc('invalidProperties', invalidProperties.length) }}</template>
      <template #body>
        <p>{{ $tc('propertiesIgnored', invalidProperties.length) }}</p>
        <p><i18n-list :list="invalidProperties"/></p>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="missingProperties != null" type="warning">
      <template #title>
        {{ $tc('missingProperties', missingProperties.length) }}
      </template>
      <template #body>
        <p><i18n-list :list="missingProperties"/></p>
      </template>
    </entity-upload-alert>

    <!-- Data warnings -->
    <entity-upload-alert v-if="raggedRows != null" type="warning"
      :ranges="raggedRows" @rows="$emit('rows', $event)">
      <template #title>{{ $t('row.raggedRows') }}</template>
    </entity-upload-alert>
    <entity-upload-alert v-if="largeCell != null" type="warning"
      :ranges="[[largeCell, largeCell]]" @rows="$emit('rows', $event)">
      <template #title>{{ $t('row.largeCell') }}</template>
    </entity-upload-alert>
  </div>
</template>

<script setup>
import EntityUploadAlert from './alert.vue';
import I18nList from '../../i18n/list.vue';
import SentenceSeparator from '../../sentence-separator.vue';

defineOptions({
  name: 'EntityUploadWarnings'
});
defineProps({
  filename: {
    type: String,
    required: true
  },

  // Column header warnings
  systemProperties: Array,
  caseMismatch: Array,
  invalidProperties: Array,
  missingProperties: Array,

  // Data warnings (below the column header)
  raggedRows: Array,
  largeCell: Number
});
defineEmits(['rows']);
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

#entity-upload-warnings {
  margin-top: 20px;
}

#entity-upload-warnings-case-mismatch {
  div:has(> table) {
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 10px;
    padding: 6px;
  }

  table {
    margin-bottom: 0;
    table-layout: fixed;
  }

  thead { background-color: transparent; }
  th, td { @include text-overflow-ellipsis; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.EntityUploadHeaderReview.title
    // This text is shown above a section where the user can review warnings
    // about their data.
    "title": "Review warnings",
    "introduction": "Some rows contain warnings that may affect upload results.",

    "systemProperties": "System properties can’t be set by .csv upload",
    "caseMismatch": {
      "title": "Column is similar to an existing property but does not match",
      "description": "Column names are case-sensitive. Check the spelling and capitalization."
    },
    "invalidProperties": "This column is not a valid property name | These columns are not valid property names",
    // @transifexKey component.EntityUploadHeaderReview.missingProperties
    // This text is followed by a list of Entity property names.
    "missingProperties": "This property is not included in your file and will be left empty: | These properties are not included in your file and will be left empty:",
    "propertiesIgnored": "This property will be ignored. | These properties will be ignored.",
    "columnsIgnored": "This column will be ignored. | These columns will be ignored.",

    // This is a warning that is followed by a list of rows.
    "row": {
      "raggedRows": "Fewer columns were found than expected in some rows:",
      "largeCell": "Some cells are abnormally large, which can indicate difficulties reading your file:"
    },

    "header": {
      "existingProperty": "Existing property"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "row": {
      "raggedRows": "In einigen Zeilen wurden weniger Spalten als erwartet gefunden:",
      "largeCell": "Einige Zellen sind ungewöhnlich groß, was auf Schwierigkeiten beim Lesen Ihrer Datei hinweisen kann:"
    }
  },
  "es": {
    "row": {
      "raggedRows": "Se encontraron menos columnas de las esperadas en algunas filas:",
      "largeCell": "Algunas celdas son anormalmente grandes, lo que puede indicar dificultades para leer su archivo:"
    }
  },
  "fr": {
    "row": {
      "raggedRows": "Dans certaines lignes, il y a eu moins de colonnes détectées que prévu:",
      "largeCell": "Certaines cellules sont anormalement larges, ce qui peut indiquer des difficultés à lire votre fichier:"
    }
  },
  "it": {
    "row": {
      "raggedRows": "In alcune righe sono state trovate meno colonne del previsto:",
      "largeCell": "Alcune celle sono eccessivamente grandi, il che può indicare difficoltà nella lettura del file:"
    }
  },
  "pt": {
    "row": {
      "raggedRows": "Menos colunas foram encontradas do que o esperado em algumas linhas:",
      "largeCell": "Algumas células são anormalmente grandes, o que pode indicar dificuldades na leitura do seu arquivo:"
    }
  },
  "zh": {
    "row": {
      "raggedRows": "部分行包含的纵列数少于预期：",
      "largeCell": "部分单元格异常过大，这可能会使文件读取失败："
    }
  },
  "zh-Hant": {
    "row": {
      "raggedRows": "在某些行中發現的列數少於預期：",
      "largeCell": "有些儲存格異常大，這可能表示讀取檔案有困難："
    }
  }
}
</i18n>
