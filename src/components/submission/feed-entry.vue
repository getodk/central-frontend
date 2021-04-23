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
  <div class="submission-feed-entry">
    <div class="heading">
      <date-time :iso="entry.loggedAt != null ? entry.loggedAt : entry.createdAt"/>
      <div class="title">
        <template v-if="entry.action === 'submission.create'">
          <span class="icon-cloud-upload"></span>
          <i18n :tag="false" path="title.create">
            <template #name><actor-link :actor="entry.actor"/></template>
          </i18n>
        </template>
        <template v-else-if="updateOrEdit">
          <i18n :tag="false"
            :path="`title.updateReviewState.${reviewState}.full`">
            <template #reviewState>
              <span class="review-state" :class="reviewState">
                <span :class="reviewStateIcon(reviewState)"></span>
                <span>{{ $t(`title.updateReviewState.${reviewState}.reviewState`) }}</span>
              </span>
            </template>
            <template #name><actor-link :actor="entry.actor"/></template>
          </i18n>
        </template>
        <template v-else>
          <span class="icon-comment"></span>
          <i18n :tag="false" path="title.comment">
            <template #name><actor-link :actor="entry.actor"/></template>
          </i18n>
        </template>
      </div>
    </div>
    <div v-if="comment != null" class="body">{{ comment }}</div>
  </div>
</template>

<script>
import ActorLink from '../actor-link.vue';
import DateTime from '../date-time.vue';

import reviewState from '../../mixins/review-state';

export default {
  name: 'SubmissionFeedEntry',
  components: { ActorLink, DateTime },
  mixins: [reviewState()],
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  computed: {
    updateOrEdit() {
      return this.entry.action === 'submission.update' ||
        this.entry.action === 'submission.update.version';
    },
    reviewState() {
      return this.entry.action === 'submission.update'
        ? this.entry.details.reviewState
        : 'edited';
    },
    comment() {
      return this.entry.notes != null ? this.entry.notes : this.entry.body;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.submission-feed-entry {
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.09);
  margin-bottom: 20px;

  .heading, .body { padding: 10px; }
  .heading { background-color: #fff; }

  time {
    float: right;
    font-size: 16px;
    color: #666;
  }

  .title {
    @include text-overflow-ellipsis;
    font-size: 18px;
    font-weight: bold;
    letter-spacing: -0.02em;
    width: 70%;
  }

  .icon-comments, .icon-comment { margin-right: $margin-right-icon; }
  .icon-cloud-upload { margin-right: #{$margin-right-icon - 1px}; }
  .icon-dot-circle-o, .icon-pencil, .icon-check-circle, .icon-times-circle {
    margin-left: 1px;
    margin-right: #{$margin-right-icon + 2px};
  }

  .icon-cloud-upload, .icon-comment { color: #bbb; }
  .review-state {
    color: #999;
    &.hasIssues { color: $color-warning; }
    &.edited { color: #666; }
    &.approved { color: $color-success; }
    &.rejected { color: $color-danger; }
  }

  .actor-link { font-weight: normal; }

  .body {
    overflow-wrap: break-word;
    white-space: pre-line;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": {
      /* This text is shown in the list of actions performed on a Submission. There is an icon before the text that corresponds to the word "Submitted", so it is essential for "Submitted" to also come first in the translation. If that is unnatural in your language, you can also split the text into two parts. For example, instead of:

Submitted by {name}

you could split it into:

Submitted • {name} */
      "create": "Submitted by {name}",
      "updateReviewState": {
        "null": {
          /* This text is shown in the list of actions performed on a Submission. There is an icon before the text that corresponds to the Review State, so it is essential for the Review State to also come first in the translation. If that is unnatural in your language, you can also split the text into two parts. For example, instead of:

{reviewState} per {name}

you could split it into:

{reviewState} • {name} */
          "full": "{reviewState} per {name}",
          "reviewState": "Received"
        },
        "hasIssues": {
          /* This text is shown in the list of actions performed on a Submission. There is an icon before the text that corresponds to the Review State, so it is essential for the Review State to also come first in the translation. If that is unnatural in your language, you can also split the text into two parts. For example, instead of:

{reviewState} per {name}

you could split it into:

{reviewState} • {name} */
          "full": "{reviewState} per {name}",
          "reviewState": "Has Issues"
        },
        "edited": {
          /* This text is shown in the list of actions performed on a Submission. There is an icon before the text that corresponds to the Review State, so it is essential for the Review State to also come first in the translation. If that is unnatural in your language, you can also split the text into two parts. For example, instead of:

{reviewState} by {name}

you could split it into:

{reviewState} • {name} */
          "full": "{reviewState} by {name}",
          "reviewState": "Edited"
        },
        "approved": {
          /* This text is shown in the list of actions performed on a Submission. There is an icon before the text that corresponds to the Review State, so it is essential for the Review State to also come first in the translation. If that is unnatural in your language, you can also split the text into two parts. For example, instead of:

{reviewState} by {name}

you could split it into:

{reviewState} • {name} */
          "full": "{reviewState} by {name}",
          "reviewState": "Approved"
        },
        "rejected": {
          /* This text is shown in the list of actions performed on a Submission. There is an icon before the text that corresponds to the Review State, so it is essential for the Review State to also come first in the translation. If that is unnatural in your language, you can also split the text into two parts. For example, instead of:

{reviewState} by {name}

you could split it into:

{reviewState} • {name} */
          "full": "{reviewState} by {name}",
          "reviewState": "Rejected"
        }
      },
      /* This text is shown in the list of actions performed on a Submission. There is an icon before the text that corresponds to the word "Comment", so it is essential for "Comment" to also come first in the translation. If that is unnatural in your language, you can also split the text into two parts. For example, instead of:

Comment by {name}

you could split it into:

Comment • {name} */
      "comment": "Comment by {name}"
    }
  }
}
</i18n>
