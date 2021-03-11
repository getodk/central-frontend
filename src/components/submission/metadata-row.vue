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
  <!-- SubmissionTable assumes that this element does not have a class
  binding. -->
  <tr class="submission-metadata-row">
    <td class="row-number">{{ $n(rowNumber, 'noGrouping') }}</td>
    <td v-if="!draft" class="submitter-name"
      :title="submission.__system.submitterName">
      {{ submission.__system.submitterName }}
    </td>
    <td><date-time :iso="submission.__system.submissionDate"/></td>
    <td v-if="!draft" class="state-and-actions">
      <span class="state"><span :class="stateIcon"></span>{{ stateText }}</span>
      <span v-if="submission.__system.edits !== 0" class="edits">
        <span class="icon-pencil"></span>
        <span>{{ $n(submission.__system.edits, 'default') }}</span>
      </span>
      <span class="icon-angle-right"></span>
      <div class="btn-group">
        <template v-if="canUpdate">
          <a v-if="submission.__system.status == null" class="btn btn-primary"
            :href="editPath" target="_blank">
            <span class="icon-pencil"></span><span>{{ editText }}</span>
          </a>
          <button v-else type="button" class="btn btn-primary" disabled
            :title="$t('submission.editDisabled')">
            <span class="icon-pencil"></span><span>{{ editText }}</span>
          </button>
        </template>
        <router-link v-slot="{ href }" :to="submissionPath" custom>
          <a class="btn btn-default" :href="href" target="_blank">
            <span class="icon-chevron-right"></span>
            <span>{{ $t('action.more') }}</span>
          </a>
        </router-link>
      </div>
    </td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';

import { apiPaths } from '../../util/request';

const iconsByReviewState = {
  hasIssues: 'icon-comments',
  needsReview: 'icon-comments',
  approved: 'icon-check-circle',
  rejected: 'icon-times-circle'
};

export default {
  name: 'SubmissionMetadataRow',
  components: { DateTime },
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    draft: Boolean,
    submission: {
      type: Object,
      required: true
    },
    rowNumber: {
      type: Number,
      required: true
    },
    canUpdate: Boolean
  },
  computed: {
    stateIcon() {
      const { reviewState } = this.submission.__system;
      if (reviewState == null) {
        const { attachmentsPresent, attachmentsExpected } = this.submission.__system;
        return attachmentsPresent !== attachmentsExpected
          ? 'icon-circle-o'
          : 'icon-dot-circle-o';
      }
      return iconsByReviewState[reviewState];
    },
    stateText() {
      const { reviewState } = this.submission.__system;
      if (reviewState == null) {
        const { attachmentsPresent, attachmentsExpected } = this.submission.__system;
        return attachmentsPresent !== attachmentsExpected
          ? this.$t('submission.missingMedia')
          : this.$t('reviewState.received');
      }
      return this.$t(`reviewState.${reviewState}`);
    },
    submissionPath() {
      const encodedFormId = encodeURIComponent(this.xmlFormId);
      const encodedInstanceId = encodeURIComponent(this.submission.__id);
      return `/projects/${this.projectId}/forms/${encodedFormId}/submissions/${encodedInstanceId}`;
    },
    editPath() {
      return apiPaths.editSubmission(
        this.projectId,
        this.xmlFormId,
        this.submission.__id
      );
    },
    editText() {
      return this.$t('submission.action.edit', {
        count: this.$n(this.submission.__system.edits, 'default')
      });
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.submission-metadata-row {
  .row-number {
    color: #999;
    font-size: 11px;
    padding-top: 11px;
    text-align: right;
    vertical-align: middle;
  }

  .submitter-name {
    @include text-overflow-ellipsis;
    max-width: 250px;
  }

  .state-and-actions {
    min-width: 205px;
    position: relative;
  }

  $edits-and-angle-width: 48px;
  .state {
    // Ensure that there is space for the edit count and angle icon if the
    // column exceeds its min width.
    margin-right: #{$edits-and-angle-width + 15px};
  }

  .icon-comments { margin-right: $margin-right-icon; }
  .icon-circle-o, .icon-dot-circle-o, .icon-check-circle, .icon-times-circle {
    margin-left: 1px;
    margin-right: #{$margin-right-icon + 1px};
  }

  .icon-circle-o { color: $color-warning; }
  .icon-dot-circle-o { color: #999; }
  .icon-comments { color: $color-warning; }
  .icon-check-circle { color: $color-success; }
  .icon-times-circle { color: $color-danger; }

  .edits {
    color: #777;
    // Positioning from the left rather than the right so that the icon is
    // aligned across rows.
    left: calc(100% - #{$edits-and-angle-width + $padding-right-table-data});
    position: absolute;
  }
  .icon-pencil { margin-right: 5px; }

  .icon-angle-right {
    bottom: #{$padding-right-table-data + 1px};
    color: $color-accent-primary;
    font-size: 20px;
    // Using `position: absolute` rather than `float: right` so that the icon
    // does not increase the row's height.
    position: absolute;
    right: $padding-right-table-data;
  }

  .btn-group {
    left: -1000px;
    position: absolute;
    top: 4px;
  }
  &:hover .btn-group, .btn-group:focus-within, &.actions-shown .btn-group {
    left: auto;
    right: $padding-right-table-data;
  }
}
</style>
