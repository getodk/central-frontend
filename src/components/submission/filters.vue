<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <span id="submission-filters">
    <div class="form-group">
      <span class="icon-filter"></span><span>{{ $t('common.filter') }}</span>
    </div>
    <submission-filters-submitter :value="submitterId"
      @input="$emit('update:submitterId', $event)"/>
    <date-range-picker :value="submissionDate"
      :placeholder="$t('field.submissionDate')"
      @input="$emit('update:submissionDate', $event)"/>
  </span>
</template>

<script>
import DateRangePicker from '../date-range-picker.vue';
import SubmissionFiltersSubmitter from './filters/submitter.vue';

export default {
  name: 'SubmissionFilters',
  components: { DateRangePicker, SubmissionFiltersSubmitter },
  props: {
    submitterId: {
      type: String,
      required: true
    },
    submissionDate: {
      type: Array,
      required: true
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "field": {
      // This is the text of a form field that allows the user to filter by a
      // date range.
      "submissionDate": "Submitted at"
    }
  }
}
</i18n>
