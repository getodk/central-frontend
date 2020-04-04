<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <!-- The frozen columns of the table -->
  <tr v-if="fieldColumns == null">
    <td class="row-number">{{ rowNumber }}</td>
    <td v-if="showsSubmitter" class="submitter-name"
      :title="submission.__system.submitterName">
      {{ submission.__system.submitterName }}
    </td>
    <td>{{ submissionDate }}</td>
  </tr>
  <!-- The rest of the table -->
  <tr v-else
    :class="{ 'encrypted-submission': submission.__system.status != null }">
    <template v-if="submission.__system.status == null">
      <submission-cell v-for="column of fieldColumns" :key="column.path"
        :base-url="baseUrl" :submission="submission" :column="column"/>
    </template>
    <template v-else-if="fieldColumns.length !== 0">
      <td class="encrypted-data" :colspan="fieldColumns.length">
        <span class="icon-lock"></span>
        <span class="encryption-message">Data preview is not available due to
          encryption.</span>
        <span class="encryption-overlay"></span>
      </td>
    </template>
    <td>{{ submission.__id.replace(/^uuid:/, '') }}</td>
  </tr>
</template>

<script>
import SubmissionCell from './cell.vue';
import { formatDate } from '../../util/date-time';

export default {
  name: 'SubmissionRow',
  components: { SubmissionCell },
  props: {
    baseUrl: {
      type: String,
      default: ''
    },
    submission: {
      type: Object,
      required: true
    },
    rowNumber: {
      type: Number,
      default: 0
    },
    fieldColumns: Array, // eslint-disable-line vue/require-default-prop
    showsSubmitter: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    submissionDate() {
      return formatDate(this.submission.__system.submissionDate);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

$icon-lock-margin-left: 3px;
$icon-lock-margin-right: 12px;

#submission-table1 td {
  &.row-number {
    color: #999;
    font-size: 11px;
    // Adding min-width so that the table's width does not increase as the row
    // numbers increase.
    min-width: 42px;
    padding-top: 11px;
    text-align: right;
    vertical-align: middle;
  }

  &.submitter-name {
    max-width: 250px;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

#submission-table2 .encrypted-submission {
  .icon-lock {
    font-size: 16px;
    color: #666;
    margin-left: $icon-lock-margin-left;
    margin-right: $icon-lock-margin-right;
    vertical-align: -2px;
  }

  .encryption-message {
    font-style: italic;
  }

  ~ .encrypted-submission {
    .encrypted-data {
      position: relative;
    }

    .encryption-message {
      display: none;
    }

    .encryption-overlay {
      background-color: #ddd;
      display: inline-block;
      height: 12px;
      position: absolute;
      // Adding 4px in order to vertically center the overlay.
      top: $padding-top-table-data + 4px;
      // 12px is the width of the .icon-lock (plus a pixel or two for good
      // measure).
      width: calc(100% - #{$padding-left-table-data + $icon-lock-margin-left} -
        12px - #{$icon-lock-margin-right + $padding-right-table-data});
    }
  }
}
</style>
