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
    <td v-if="!draft && !deleted" class="state-and-actions">
      <div class="col-content">
        <span class="state">
          <template v-if="missingAttachment">
            <span class="icon-circle-o"></span>
            <span>{{ $t('submission.missingAttachment') }}</span>
          </template>
          <submission-review-state v-else
            :value="submission.__system.reviewState" align/>
        </span>
        <span class="edits">
          <template v-if="submission.__system.edits !== 0">
            <span class="icon-pencil"></span>
            <span>{{ $n(submission.__system.edits, 'default') }}</span>
          </template>
        </span>
        <span class="icon-angle-right"></span>
      </div>
      <submission-actions :submission="submission"
        :awaiting-response="awaitingResponse"/>
    </td>
    <td v-if="!draft && deleted" class="state-and-actions">
      <div class="col-content col-deleted-at">
        <date-time :iso="submission.__system.deletedAt"/>
      </div>
      <div v-if="verbs.has('submission.restore')" class="btn-group">
        <button type="button"
          class="restore-button btn btn-default"
          :aria-disabled="awaitingResponse"
          :aria-label="$t('action.restore')" v-tooltip.aria-label>
          <span class="icon-recycle"></span><spinner :state="awaitingResponse"/>
        </button>
      </div>
    </td>
  </tr>
</template>

<script>
import DateTime from '../date-time.vue';
import Spinner from '../spinner.vue';
import SubmissionActions from './actions.vue';
import SubmissionReviewState from './review-state.vue';

export default {
  name: 'SubmissionMetadataRow',
  components: { DateTime, Spinner, SubmissionActions, SubmissionReviewState },
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
    deleted: {
      type: Boolean,
      default: false
    },
    verbs: {
      type: Set,
      required: true
    },
    awaitingResponse: Boolean
  },
  computed: {
    missingAttachment() {
      const { __system } = this.submission;
      return __system.reviewState == null &&
        __system.attachmentsPresent !== __system.attachmentsExpected;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.submission-metadata-row {
  .submitter-name {
    @include text-overflow-ellipsis;
    max-width: 250px;
  }

  .state-and-actions {
    // Ensure that the column is wide enough that the .btn-group does not wrap.
    min-width: 205px;
    &:lang(id) { min-width: 221px; }
  }
  .col-content {
    align-items: flex-start;
    display: flex;
  }
  .state {
    margin-right: 15px;

    .icon-circle-o {
      color: $color-warning;
      margin-left: 1px;
      margin-right: #{$margin-right-icon + 1px};
    }

    .icon-pencil { color: #777; }
  }
  .edits {
    color: #777;
    margin-left: auto;
    width: 41px;

    .icon-pencil { margin-right: 5px; }
  }
  .col-deleted-at { color: $color-danger; }
  // The actions themselves are styled via the icon-btn-group mixin.
}
</style>
