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
      <div class="btn-group">
        <button v-if="verbs.has('submission.delete')" type="button"
          class="delete-button btn btn-default"
          :aria-label="$t('action.delete')" v-tooltip.aria-label>
          <span class="icon-trash"></span><spinner :state="awaitingResponse"/>
        </button>
        <template v-if="verbs.has('submission.update')">
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
import SubmissionReviewState from './review-state.vue';

import useRoutes from '../../composables/routes';
import { apiPaths } from '../../util/request';

export default {
  name: 'SubmissionMetadataRow',
  components: { DateTime, Spinner, SubmissionReviewState },
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
  setup() {
    const { submissionPath } = useRoutes();
    return { submissionPath };
  },
  computed: {
    missingAttachment() {
      const { __system } = this.submission;
      return __system.reviewState == null &&
        __system.attachmentsPresent !== __system.attachmentsExpected;
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
  .col-content .icon-angle-right {
    color: $color-accent-primary;
    font-size: 20px;
    margin-top: -1px;
  }

  .delete-button .icon-trash { color: $color-danger; }

  .col-deleted-at { color: $color-danger; }
}
</style>
