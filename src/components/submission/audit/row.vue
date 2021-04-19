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
  <tr class="submission-audit-row">
    <td><date-time :iso="audit.loggedAt"/></td>
    <td class="actor">
      <span :title="audit.actor.displayName">{{ audit.actor.displayName }}</span>
    </td>
    <td class="action">
      <template v-if="audit.action === 'submission.create'">
        <span class="icon-cloud-upload"></span>{{ $t('created') }}
      </template>
      <template v-else-if="audit.action === 'submission.update'">
        <span :class="reviewStateIcon"></span>{{ reviewStateText }}
      </template>
      <template v-else>
        <span class="icon-pencil"></span>{{ $t('reviewState.edited') }}
      </template>
    </td>
    <td class="notes">{{ audit.notes }}</td>
  </tr>
</template>

<script>
import DateTime from '../../date-time.vue';

import Audit from '../../../presenters/audit';

const iconsByReviewState = {
  hasIssues: 'icon-comments',
  edited: 'icon-pencil',
  approved: 'icon-check-circle',
  rejected: 'icon-times-circle'
};

export default {
  name: 'SubmissionAuditRow',
  components: { DateTime },
  props: {
    audit: {
      type: Audit,
      required: true
    }
  },
  computed: {
    reviewStateIcon() {
      const { reviewState } = this.audit.details;
      return reviewState == null
        ? 'icon-dot-circle-o'
        : iconsByReviewState[reviewState];
    },
    reviewStateText() {
      const { reviewState } = this.audit.details;
      return reviewState == null
        ? this.$t('reviewState.received')
        : this.$t(`reviewState.${reviewState}`);
    }
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

.submission-audit-row {
  .table tbody & td { vertical-align: middle; }

  .actor { @include text-overflow-ellipsis; }

  .action {
    .icon-comments { margin-right: $margin-right-icon; }
    .icon-cloud-upload { margin-right: #{$margin-right-icon - 1px}; }
    .icon-dot-circle-o, .icon-pencil, .icon-check-circle, .icon-times-circle {
      margin-left: 1px;
      margin-right: #{$margin-right-icon + 1px};
    }

    .icon-cloud-upload, .icon-dot-circle-o { color: #999; }
    .icon-comments, .icon-pencil { color: $color-warning; }
    .icon-check-circle { color: $color-success; }
    .icon-times-circle { color: $color-danger; }
  }

  .notes {
    overflow-wrap: break-word;
    white-space: pre-line;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text indicates that a Submission was submitted.
    "created": "Submitted"
  }
}
</i18n>
