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
  <form id="audit-filters" class="form-inline" @submit.prevent>
    <span class="icon-filter"></span><span>{{ $t('filter') }}</span>
    <audit-filters-action :value="action"
      @input="$emit('update:action', $event)"/>
    <date-range-picker :value="dateRange" :placeholder="$t('field.dateRange')"
      @input="$emit('update:dateRange', $event)"/>
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
  }
};
</script>

<style lang="scss">
#audit-filters {
  .icon-filter {
    color: #999;
    margin-right: 6px;
  }

  .form-group {
    margin-left: 12px;
    // Align the .form-group elements with the text to their left.
    vertical-align: baseline;
  }

  .form-group + .form-group {
    margin-left: 21px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown next to options for filtering a table.
    "filter": "Filter by"
  }
}
</i18n>
