<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <form class="form-inline" @submit.prevent>
    <audit-filters-action :model-value="action"
      @update:model-value="$emit('update:action', $event)"/>
    <date-range-picker :model-value="dateRange"
      :label="$t('field.dateRange')" required
      :placeholder="$t('noLogDateSelected')"
      @update:model-value="$emit('update:dateRange', $event)"/>
  </form>
</template>

<script>
import AuditFiltersAction from './filters/action.vue';
import DateRangePicker from '../date-range-picker.vue';

export default {
  name: 'AuditFilters',
  components: { AuditFiltersAction, DateRangePicker },
  props: {
    action: {
      type: String,
      required: true
    },
    dateRange: {
      type: Array,
      required: true
    }
  },
  emits: ['update:action', 'update:dateRange']
};
</script>

<i18n lang="json5">
  {
    "en": {
      // Text shown when no Audit log date is selected in the filter
      "noLogDateSelected": "(none)"
    }
  }
  </i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "noLogDateSelected": "(keine)"
  },
  "es": {
    "noLogDateSelected": "(ninguno)"
  },
  "fr": {
    "noLogDateSelected": "(Aucune)"
  },
  "it": {
    "noLogDateSelected": "(nessuno)"
  },
  "pt": {
    "noLogDateSelected": "(nenhum)"
  },
  "zh-Hant": {
    "noLogDateSelected": "(無)"
  }
}
</i18n>
