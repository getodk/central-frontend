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
    <entity-upload-warning v-if="raggedRows != null" :ranges="raggedRows"
      @rows="$emit('rows', $event)">
      {{ $t('row.raggedRows') }}
    </entity-upload-warning>
    <entity-upload-warning v-if="largeCell != null" :ranges="[[largeCell, largeCell]]"
      @rows="$emit('rows', $event)">
      {{ $t('row.largeCell') }}
    </entity-upload-warning>
    <entity-upload-warning v-if="delimiter != null">
      <i18n-t keypath="delimiterNotComma">
        <template #delimiter>
          <code>{{ formattedDelimiter }}</code>
        </template>
      </i18n-t>
    </entity-upload-warning>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import EntityUploadWarning from './warning.vue';

import { formatCSVDelimiter } from '../../../util/csv';

defineOptions({
  name: 'EntityUploadWarnings'
});
const props = defineProps({
  delimiter: String,
  raggedRows: Array,
  largeCell: Number
});
defineEmits(['rows']);

const formattedDelimiter = computed(() => formatCSVDelimiter(props.delimiter));
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#entity-upload-warnings {
  background-color: #deedf3;
  padding: 9px 6px;

  code { border: 1px solid $color-text; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is a warning that is followed by a list of rows.
    "row": {
      "raggedRows": "Fewer columns were found than expected in some rows:",
      "largeCell": "Some cells are abnormally large, which can indicate difficulties reading your file:"
    },
    // @transifexKey component.EntityUploadHeaderErrors.suggestions.delimiterNotComma
    "delimiterNotComma": "It’s not clear what delimiter separates cells in a row from each other in your file. Based on analysis, {delimiter} was used as the best guess."
  }
}
</i18n>
