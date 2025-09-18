<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <span id="entity-filters">
    <entity-filters-creator :model-value="creatorId"
      :disabled="disabled" :disabled-message="disabledMessage"
      @update:model-value="$emit('update:creatorId', $event)"/>
    <date-range-picker :model-value="creationDate"
      :label="$t('field.creationDate')"
      :disabled="disabled" :disabled-message="disabledMessage"
      :placeholder="$t('allCreationDateSelected')"
      @update:model-value="$emit('update:creationDate', $event)"/>
    <entity-filters-conflict :model-value="conflict" :disabled="disabled"
      :disabled-message="disabledMessage" @update:model-value="$emit('update:conflict', $event)"/>
  </span>
</template>

<script setup>
import EntityFiltersConflict from './filters/conflict.vue';
import EntityFiltersCreator from './filters/creator.vue';
import DateRangePicker from '../date-range-picker.vue';

defineOptions({
  name: 'EntityFilters'
});
defineProps({
  conflict: {
    type: Array,
    required: true
  },
  disabled: {
    type: Boolean,
    required: true
  },
  disabledMessage: {
    type: String,
    required: false
  },
  creatorId: {
    type: Array,
    required: false
  },
  creationDate: {
    type: Array,
    required: true
  }
});
defineEmits(['update:conflict', 'update:creationDate', 'update:creatorId']);

</script>

<style lang="scss">
#entity-filters {
  margin-left: 10px;
}
</style>

<i18n lang="json5">
{
  "en": {
    "field": {
      // This is the text of a form field that allows the user to filter
      // Entities by a date range.
      "creationDate": "Created at"
    },
    // @transifexKey component.SubmissionFilters.allSubmissionDateSelected
    "allCreationDateSelected": "All time"
  }
}
</i18n>
