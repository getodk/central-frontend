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
  <dl id="entity-upload-errors" class="dl-horizontal">
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
    <div v-if="hasSuggestion" id="entity-upload-errors-suggestions">
      <dt>{{ $t('suggestions.title') }}</dt>
      <dd>
        <p v-if="invalidQuotes">{{ $t('suggestions.invalidQuotes') }}</p>
        <i18n-t v-if="missingLabel" tag="p" keypath="suggestions.missingLabel">
          <template #label>
            <span id="entity-upload-errors-label">label</span>
          </template>
        </i18n-t>
        <p v-if="unknownProperty">{{ $t('suggestions.unknownProperty') }}</p>
        <p v-if="duplicateColumn">{{ $t('suggestions.duplicateColumn') }}</p>
        <p v-if="emptyColumn">{{ $t('suggestions.emptyColumn') }}</p>
      </dd>
    </div>
  </dl>
</template>

<script setup>
import { computed, ref } from 'vue';

import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'EntityUploadErrors'
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
  return columns.join(',');
});

const headerElements = ref([]);
const setHeaderElement = (i) => (el) => { headerElements.value[i] = el; };
const scrollHeader = (event) => {
  const { target } = event;
  for (const header of headerElements.value) {
    if (header !== target) header.scroll(target.scrollLeft, 0);
  }
};

// There isn't a suggestion for missing properties.
const hasSuggestion = computed(() =>
  Object.entries(props).some(([name, value]) =>
    value === true && name !== 'missingProperty'));
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#entity-upload-errors {
  margin-bottom: 0;

  div {
    padding-left: $padding-panel-body;
    padding-right: $padding-panel-body;
  }

  .csv-header {
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    display: -webkit-box;
    font-family: $font-family-monospace;
    overflow: auto hidden;
    white-space: break-spaces;
  }
}

#entity-upload-errors-suggestions {
  color: $color-danger;

  p:last-child { margin-bottom: 0; }
}

#entity-upload-errors-label { font-family: $font-family-monospace; }
</style>

<i18n lang="json5">
{
  "en": {
    "expectedHeader": "Expected header",
    "suggestions": {
      // Suggestions to fix an error
      "title": "Suggestions",
      "invalidQuotes": "A quoted field is invalid. Check the header row of your CSV file to see if there are any unusual values.",
      // {label} will have the text "label" and refers to the "label" property.
      // The name of the property is not translated.
      "missingLabel": "A {label} property is required. The label indicates the name to use for each Entity throughout Central and elsewhere.",
      "unknownProperty": "If you want to add properties to this Entity List, you can do so in the Entity Properties section on the Overview page of this Entity List, or you can upload and publish a Form that references the property.",
      "duplicateColumn": "It looks like two or more columns have the same header. Please make sure column headers are unique.",
      "emptyColumn": "It looks like you have an empty cell in the header. Please remove any empty columns in your CSV file."
    }
  }
}
</i18n>
