<template>
  <div id="entity-upload-errors">
    <p class="entity-upload-section-title">{{ $t('title') }}</p>
    <p>{{ $t('introduction') }}</p>
    <i18n-t v-if="delimiter !== ','" tag="p" keypath="delimiterNotComma">
      <template #delimiter>
        <code>{{ formattedDelimiter }}</code>
      </template>
    </i18n-t>

    <entity-upload-alert v-if="invalidQuotes" type="danger">
      <template #title>{{ $t('invalidQuotes.title') }}</template>
      <template #body>
        <p>{{ $t('invalidQuotes.description') }}</p>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="missingLabel" type="danger">
      <template #title>
        <i18n-t keypath="missingLabel.title">
          <template #label>
            <span class="text-monospace">label</span>
          </template>
        </i18n-t>
      </template>
      <template #body>
        <p>{{ $t('missingLabel.description') }}</p>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="unknownProperty" type="danger">
      <template #title>Unknown property found in header row</template>
      <template #body>
        <p>{{ $t('unknownProperty') }}</p>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="duplicateColumns != null" type="danger">
      <template #title>{{ $t('duplicateColumn.title') }}</template>
      <template #body>
        <p>
          <span>{{ $t('duplicateColumn.description') }}</span>
          <sentence-separator/>
          <span>{{ $tc('duplicateColumn.headersReused', duplicateColumns.length) }}</span>
        </p>
        <p><i18n-list :list="duplicateColumns"/></p>
      </template>
    </entity-upload-alert>
    <entity-upload-alert v-if="emptyColumn" type="danger">
      <template #title>{{ $t('emptyColumn.title') }}</template>
      <template #body>
        <p>{{ $t('emptyColumn.description') }}</p>
      </template>
    </entity-upload-alert>

    <entity-upload-alert v-if="dataError != null" type="danger">
      <template #title>{{ $t('dataError') }}</template>
      <template #body>
        <p>{{ dataError }}</p>
      </template>
    </entity-upload-alert>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import EntityUploadAlert from './alert.vue';
import I18nList from '../../i18n/list.vue';
import SentenceSeparator from '../../sentence-separator.vue';

import { formatCSVDelimiter } from '../../../util/csv';

defineOptions({
  name: 'EntityUploadErrors'
});
const props = defineProps({
  delimiter: {
    type: String,
    required: true
  },

  // Errors about the column header
  invalidQuotes: Boolean,
  missingLabel: Boolean,
  unknownProperty: Boolean,
  duplicateColumns: Array,
  emptyColumn: Boolean,

  // Error in the data below the column header
  dataError: String
});

const formattedDelimiter = computed(() => formatCSVDelimiter(props.delimiter));
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#entity-upload-errors {
  margin-top: 20px;

  code { border: 1px solid $color-danger; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown above a section that lists errors in the user's data.
    "title": "Review errors",
    "introduction": "Errors must be fixed before you can upload Entities.",
    "delimiterNotComma": "These errors may be because we got the cell delimiter wrong. We used {delimiter}.",

    "invalidQuotes": {
      "title": "A quoted field is invalid in the header row",
      "description": "Check the header row of your file to see if there are any unusual values."
    },
    "missingLabel": {
      // {label} will have the text "label" and refers to the "label" property.
      // The name of the property is not translated.
      "title": "A {label} property is required",
      "description": "The label indicates the name to use for each Entity throughout Central and elsewhere."
    },
    // @transifexKey component.EntityUploadHeaderErrors.suggestions.unknownProperty
    "unknownProperty": "If you want to add properties to this Entity List, you can do so in the Entity Properties section on the Overview page of this Entity List, or you can upload and publish a Form that references the property.",
    "duplicateColumn": {
      "title": "Duplicate column headers",
      "description": "Each column must have a unique header.",
      // This text is followed by a list of column headers.
      "headersReused": "This header is used more than once: | These headers are used more than once:"
    },
    "emptyColumn": {
      "title": "Empty cell in header row",
      "description": "Please remove any empty columns in your file."
    },

    // @transifexKey component.EntityUploadDataError.title
    "dataError": "Data error"
  }
}
</i18n>
