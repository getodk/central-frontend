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
  <tr class="submission-metadata-row">
    <td class="row-number">{{ $n(rowNumber, 'noGrouping') }}</td>
    <td v-if="!draft" class="submitter-name">
      <span v-tooltip.text>{{ submission.__system.submitterName }}</span>
    </td>
    <td><date-time :iso="submission.__system.submissionDate"/></td>
    <td v-if="!draft" class="state-and-actions">
      <div class="col-content">
        <span class="state"><span :class="stateIcon"></span>{{ stateText }}</span>
        <span class="edits">
          <template v-if="submission.__system.edits !== 0">
            <span class="icon-pencil"></span>
            <span>{{ $n(submission.__system.edits, 'default') }}</span>
          </template>
        </span>
        <span class="icon-angle-right"></span>
      </div>
      <div class="btn-group">
        <template v-if="canUpdate">
          <button type="button" class="review-button btn btn-default"
            :aria-label="$t('action.review')" v-tooltip.aria-label>
            <span class="icon-check"></span>
          </button>
          <a v-if="submission.__system.status == null" class="btn btn-default"
            :href="editPath" target="_blank" :aria-label="editLabel"
            v-tooltip.aria-label>
            <span class="icon-pencil"></span>
          </a>
          <button v-else type="button" class="btn btn-default"
            :aria-label="editLabel" aria-disabled="true"
            v-tooltip.aria-describedby="$t('submission.editDisabled')">
            <span class="icon-pencil"></span>
          </button>
        </template>
        <router-link v-slot="{ href }"
          :to="submissionPath(projectId, xmlFormId, submission.__id)" custom>
          <a class="more-button btn btn-default" :href="href" target="_blank">
            <span>{{ $t('action.more') }}</span>
            <span class="icon-angle-right"></span>
          </a>
        </router-link>
      </div>
    </td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';

import useReviewState from '../../composables/review-state';
import useRoutes from '../../composables/routes';
import { apiPaths } from '../../util/request';

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
  setup() {
    const { reviewStateIcon } = useReviewState();
    const { submissionPath } = useRoutes();
    return { reviewStateIcon, submissionPath };
  },
  computed: {
    missingAttachment() {
      const { __system } = this.submission;
      return __system.reviewState == null &&
        __system.attachmentsPresent !== __system.attachmentsExpected;
    },
    stateIcon() {
      return this.missingAttachment
        ? 'icon-circle-o'
        : this.reviewStateIcon(this.submission.__system.reviewState);
    },
    stateText() {
      return this.missingAttachment
        ? this.$t('submission.missingAttachment')
        : this.$t(`reviewState.${this.submission.__system.reviewState}`);
    },
    editPath() {
      return apiPaths.editSubmission(
        this.projectId,
        this.xmlFormId,
        this.submission.__id
      );
    },
    editLabel() {
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

  .state-and-actions { min-width: 205px; }
  .col-content {
    align-items: flex-start;
    display: flex;
  }
  .state {
    margin-right: 15px;

    .icon-comments { margin-right: $margin-right-icon; }
    .icon-circle-o, .icon-dot-circle-o, .icon-pencil, .icon-check-circle, .icon-times-circle {
      margin-left: 1px;
      margin-right: #{$margin-right-icon + 1px};
    }

    .icon-circle-o, .icon-comments { color: $color-warning; }
    .icon-dot-circle-o { color: #999; }
    .icon-pencil { color: #777; }
    .icon-check-circle { color: $color-success; }
    .icon-times-circle { color: $color-danger; }
  }
  .edits {
    color: #777;
    margin-left: auto;
    width: 41px;

    .icon-pencil { margin-right: 5px; }
  }
  .col-content .icon-angle-right {
    color: $color-accent-primary;
    font-size: 20px;
    margin-top: -1px;
  }
}
</style>
