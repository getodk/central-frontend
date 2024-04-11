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
  <div id="entity-upload-header-help"
    :class="{ panel: hasError, 'panel-danger': hasError }">
    <div :class="{ 'panel-heading': hasError }">
      <span>{{ $t('headersNote') }}</span>
      <sentence-separator/>
      <entity-upload-data-template :error="hasError"/>
    </div>
    <div v-if="hasError" class="panel-body">
      <entity-upload-header-errors v-bind="errors"/>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import EntityUploadDataTemplate from './data-template.vue';
import EntityUploadHeaderErrors from './header-errors.vue';
import SentenceSeparator from '../../sentence-separator.vue';

defineOptions({
  name: 'EntityUploadHeaderHelp'
});
const props = defineProps({
  errors: Object
});

const hasError = computed(() => props.errors != null);
</script>

<style lang="scss">
$border-radius: 3px;

#entity-upload-header-help {
  margin-top: 1px;

  &.panel-danger {
    box-shadow: none;
    margin-bottom: 0;
    margin-top: 10px;
  }

  .panel-heading {
    border-top-left-radius: $border-radius;
    border-top-right-radius: $border-radius;
    padding-bottom: 4px;
    padding-top: 6px;
  }

  .panel-body {
    border: none;
    border-bottom-left-radius: $border-radius;
    border-bottom-right-radius: $border-radius;
    padding-left: 0;
    padding-right: 0;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.EntityUpload.headersNote
    "headersNote": "The first row in your data file must exactly match the table header you see above."
  }
}
</i18n>
