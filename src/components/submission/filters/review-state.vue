<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <label id="submission-filters-review-state" class="form-group">
    <select v-model="selectValue" class="form-control" multiple size="2">
      <option value="null">{{ $t('reviewState.null') }}</option>
      <option value="'approved'">{{ $t('reviewState.approved') }}</option>
      <option value="'hasIssues'">{{ $t('reviewState.hasIssues') }}</option>
      <option value="'edited'">{{ $t('reviewState.edited') }}</option>
      <option value="'rejected'">{{ $t('reviewState.rejected') }}</option>
    </select>
    <span class="form-label">{{ $t('field.reviewState') }}</span>
  </label>
</template>

<script>
export default {
  name: 'SubmissionFiltersReviewState',
  props: {
    value: {
      type: Array,
      required: true
    }
  },
  computed: {
    selectValue: {
      get() {
        return this.value;
      },
      set(value) {
        this.$emit('input', value);
      }
    }
  }
};
</script>
