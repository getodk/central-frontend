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
  <dl id="entity-upload-header-errors" class="dl-horizontal">
    <div>
      <dt>{{ $t('expectedHeader') }}</dt>
      <dd :ref="setHeaderElement(0)" class="csv-header" @scroll="scrollHeader">
        {{ expectedHeader }}
      </dd>
    </div>
    <div>
      <dt v-tooltip.text>{{ filename }}</dt>
      <dd :ref="setHeaderElement(1)" class="csv-header" @scroll="scrollHeader">
        {{ header }}
      </dd>
    </div>
    <div v-if="hasSuggestion" id="entity-upload-header-errors-suggestions">
      <dt>{{ $t('suggestions.title') }}</dt>
      <dd>
        <p v-if="invalidQuotes">{{ $t('suggestions.invalidQuotes') }}</p>
        <i18n-t v-if="missingLabel" tag="p" keypath="suggestions.missingLabel">
          <template #label>
            <span class="text-monospace">label</span>
          </template>
        </i18n-t>
        <p v-if="unknownProperty">{{ $t('suggestions.unknownProperty') }}</p>
        <p v-if="duplicateColumn">{{ $t('suggestions.duplicateColumn') }}</p>
        <p v-if="emptyColumn">{{ $t('suggestions.emptyColumn') }}</p>
        <i18n-t v-if="delimiter !== ','" tag="p"
          keypath="suggestions.delimiterNotComma">
          <template #delimiter>
            <code>{{ formattedDelimiter }}</code>
          </template>
        </i18n-t>
      </dd>
    </div>
  </dl>
</template>

<script setup>
import { computed } from 'vue';

import { formatCSVDelimiter, formatCSVRow } from '../../../util/csv';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityUploadHeaderErrors'
});
const props = defineProps({
  filename: {
    type: String,
    required: true
  },
  header: {
    type: String,
    required: true
  },
  delimiter: {
    type: String,
    required: true
  },
  // Props for specific errors
  invalidQuotes: Boolean,
  missingLabel: Boolean,
  missingProperty: Boolean,
  unknownProperty: Boolean,
  duplicateColumn: Boolean,
  emptyColumn: Boolean
});

// The component assumes that this data will exist when the component is
// created.
const { dataset } = useRequestData();
const expectedHeader = computed(() => {
  const columns = dataset.properties.map(({ name }) => name);
  columns.unshift('label');
  return formatCSVRow(columns, { delimiter: props.delimiter });
});

const headerElements = [];
const setHeaderElement = (i) => (el) => { headerElements[i] = el; };
const scrollHeader = (event) => {
  const { target } = event;
  for (const header of headerElements) {
    if (header !== target) header.scroll(target.scrollLeft, 0);
  }
};

const hasSuggestion = computed(() => props.delimiter !== ',' ||
  Object.entries(props).some(([name, value]) =>
    // There isn't a suggestion for missing properties.
    value === true && name !== 'missingProperty'));
const formattedDelimiter = computed(() => formatCSVDelimiter(props.delimiter));
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

#entity-upload-header-errors {
  margin-bottom: 0;

  div {
    padding-left: $padding-panel-body;
    padding-right: $padding-panel-body;
  }

  .csv-header {
    @include line-clamp(3);
    font-family: $font-family-monospace;
    overflow-x: auto;
    white-space: break-spaces;
  }
}

#entity-upload-header-errors-suggestions {
  color: $color-danger;

  p:last-child { margin-bottom: 0; }

  code { border: 1px solid $color-danger; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This refers to the header row of a spreadsheet.
    "expectedHeader": "Expected header",
    "suggestions": {
      // Suggestions to fix an error
      "title": "Suggestions",
      "invalidQuotes": "A quoted field is invalid. Check the header row of your file to see if there are any unusual values.",
      // {label} will have the text "label" and refers to the "label" property.
      // The name of the property is not translated.
      "missingLabel": "A {label} property is required. The label indicates the name to use for each Entity throughout Central and elsewhere.",
      "unknownProperty": "If you want to add properties to this Entity List, you can do so in the Entity Properties section on the Overview page of this Entity List, or you can upload and publish a Form that references the property.",
      "duplicateColumn": "It looks like two or more columns have the same header. Please make sure column headers are unique.",
      "emptyColumn": "It looks like you have an empty cell in the header. Please remove any empty columns in your file.",
      "delimiterNotComma": "This might be because we got the cell delimiter wrong. We used {delimiter}."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "fr": {
    "expectedHeader": "Entête attendu",
    "suggestions": {
      "title": "Suggestions",
      "invalidQuotes": "Un champ entre guillemets est invalide. Vérifiez que l'entête de votre fichier ne contient pas une valeur inhabituelle.",
      "missingLabel": "Une propriété {label} est requise. Le label indique le nom à utiliser pour chaque entité dans Central et ailleurs.",
      "unknownProperty": "Si vous souhaitez ajouter des propriétés à cette liste d'entités, vous pouvez le faire dans la section Propriétés d'Entités de la page d'aperçu de cette liste d'entités, ou vous pouvez charger et publier un formulaire qui référence ces propriétés.",
      "duplicateColumn": "Il semblerait que deux colonnes ou plus aient le même entête. Assurez vous que les entêtes de colonnes sont uniques.",
      "emptyColumn": "Il semblerait que vous ayez une cellule vide dans la ligne d'entête. Merci de supprimer toutes les colonnes vides de votre fichier.",
      "delimiterNotComma": "Ça pourrait être parce que nous avons mal déterminé le délimiteur. Nous avons utilisé {delimiter}."
    }
  }
}
</i18n>
