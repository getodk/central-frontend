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
          <span class="icon-cloud-upload submission-feed-entry-icon"></span>
          <i18n :tag="false" path="title.create">
            <template #name><actor-link :actor="entry.actor"/></template>
          </i18n>
        </template>
        <template v-else-if="updateOrEdit">
          <i18n :tag="false"
            :path="`title.updateReviewState.${reviewState}.full`">
            <template #reviewState>
              <span class="review-state" :class="reviewState">
                <span :class="updateOrEditIcon(reviewState)"></span>
                <span>{{ $t(`title.updateReviewState.${reviewState}.reviewState`) }}</span>
              </span>
            </template>
            <template #name><actor-link :actor="entry.actor"/></template>
          </i18n>
        </template>
        <template v-else>
          <span class="icon-comment submission-feed-entry-icon"></span>
          <i18n :tag="false" path="title.comment">
            <template #name><actor-link :actor="entry.actor"/></template>
          </i18n>
        </template>
      </div>
    </div>
    <markdown-view v-if="comment != null" class="body" :raw-markdown="comment"/>
    <div v-if="entryDiffs != null">
      <submission-diff-item v-for="(diff, index) in entryDiffs" :key="index" :entry="diff"
        :project-id="projectId" :xml-form-id="xmlFormId" :instance-id="instanceId"
        :old-version-id="oldVersionId" :new-version-id="newVersionId"/>
    </div>
  </div>
</template>

<script>
import { last } from 'ramda';

import ActorLink from '../actor-link.vue';
import DateTime from '../date-time.vue';
import MarkdownView from '../markdown/view.vue';

import reviewState from '../../mixins/review-state';
import SubmissionDiffItem from './diff-item.vue';

import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionFeedEntry',
  components: { ActorLink, DateTime, MarkdownView, SubmissionDiffItem },
  mixins: [reviewState()],
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    instanceId: {
      type: String,
      required: true
    },
    entry: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...requestData(['diffs']),
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
    },
    allDiffs() {
      // Audit feed entries that represent a submission version change
      // will have a field called details with an instance ID
      // that can be used to look up the corresponding diff from
      // diffs api response.
      const { details } = this.entry;
      if (details == null) return null;
      const { instanceId } = details;
      const allDiffs = (instanceId != null)
        ? this.diffs[instanceId]
        : null;
      return allDiffs;
    },
    entryDiffs() {
      const { allDiffs } = this;
      if (!allDiffs)
        return null;
      // Filters out diffs about instanceID and deprecatedID
      return allDiffs.filter((entry) =>
        last(entry.path) !== 'instanceID' &&
        last(entry.path) !== 'deprecatedID');
    },
    newVersionId() {
      const { details } = this.entry;
      if (details == null) return null;
      const { instanceId } = details;
      return instanceId;
    },
    oldVersionId() {
      const deprecatedIdDiff = this.allDiffs.find((entry) => last(entry.path) === 'deprecatedID');
      if (deprecatedIdDiff == null) return null;
      return deprecatedIdDiff.new;
    }
  },
  methods: {
    updateOrEditIcon(state) {
      return `${this.reviewStateIcon(state)} submission-feed-entry-icon`;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.submission-feed-entry {
  box-shadow: 0 7px 18px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;

  .heading, .body { padding: 10px 15px; }
  .heading { background-color: #fff; }
  .body { background-color: #f9f9f9; }

  time {
    float: right;
    font-size: 13px;
    color: #666;
    line-height: 25px;
  }

  .title {
    @include text-overflow-ellipsis;
    font-size: 17px;
    font-weight: bold;
    letter-spacing: -0.02em;
    width: 70%;

    .submission-feed-entry-icon {
      display: block;
      float: left;
      margin-right: 7px;
      padding-top: 3px;
      text-align: center;
      width: 18px;
    }
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
  }

  .body > p:last-child { margin: 0 0 0px; }
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

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": {
      "create": "Odesláno od {name}",
      "updateReviewState": {
        "null": {
          "full": "{reviewState} u {name}",
          "reviewState": "Přijato"
        },
        "hasIssues": {
          "full": "{reviewState} u {name}",
          "reviewState": "Má problémy"
        },
        "edited": {
          "full": "{reviewState} u {name}",
          "reviewState": "Upraveno"
        },
        "approved": {
          "full": "{reviewState} u {name}",
          "reviewState": "Schváleno"
        },
        "rejected": {
          "full": "{reviewState} u {name}",
          "reviewState": "Odmítnuto"
        }
      },
      "comment": "Komentář od {name}"
    }
  },
  "de": {
    "title": {
      "create": "Übermittelt von {name}",
      "updateReviewState": {
        "null": {
          "full": "{reviewState} • {name}",
          "reviewState": "Empfangen"
        },
        "hasIssues": {
          "full": "{reviewState} • {name}",
          "reviewState": "Hat Probleme"
        },
        "edited": {
          "full": "{reviewState} • {name}",
          "reviewState": "Bearbeitet"
        },
        "approved": {
          "full": "{reviewState} • {name}",
          "reviewState": "Bestätigt"
        },
        "rejected": {
          "full": "{reviewState} • {name}",
          "reviewState": "Abgelehnt"
        }
      },
      "comment": "Kommentiert von {name}"
    }
  },
  "es": {
    "title": {
      "create": "Enviado por {name}",
      "updateReviewState": {
        "null": {
          "full": "{reviewState} por {name}",
          "reviewState": "Recibido"
        },
        "hasIssues": {
          "full": "{reviewState} por {name}",
          "reviewState": "Tiene problemas"
        },
        "edited": {
          "full": "{reviewState} por {name}",
          "reviewState": "Editado"
        },
        "approved": {
          "full": "{reviewState} por {name}",
          "reviewState": "Aprobado"
        },
        "rejected": {
          "full": "{reviewState} por {name}",
          "reviewState": "Rechazado"
        }
      },
      "comment": "Comentario por {name}"
    }
  },
  "fr": {
    "title": {
      "create": "Soumis par {name}",
      "updateReviewState": {
        "null": {
          "full": "{reviewState} d'un envoi de {name}",
          "reviewState": "Reçue"
        },
        "hasIssues": {
          "full": "{reviewState} selon {name}",
          "reviewState": "Comporte des erreurs"
        },
        "edited": {
          "full": "{reviewState} par {name}",
          "reviewState": "Éditée"
        },
        "approved": {
          "full": "{reviewState} par {name}",
          "reviewState": "Approuvée"
        },
        "rejected": {
          "full": "{reviewState} par {name}",
          "reviewState": "Rejetée"
        }
      },
      "comment": "Commentaire de {name}"
    }
  },
  "id": {
    "title": {
      "create": "Terkirim oleh {name}"
    }
  },
  "it": {
    "title": {
      "create": "Inviato da {name}",
      "updateReviewState": {
        "null": {
          "full": "{reviewState} per {name}",
          "reviewState": "Ricevuto"
        },
        "hasIssues": {
          "full": "{reviewState} per {name}",
          "reviewState": "Ha problemi"
        },
        "edited": {
          "full": "{reviewState} per {name}",
          "reviewState": "Modificato"
        },
        "approved": {
          "full": "{reviewState} per {name}",
          "reviewState": "Approvato"
        },
        "rejected": {
          "full": "{reviewState} per {name}",
          "reviewState": "Respinto"
        }
      },
      "comment": "Commenti di {name}"
    }
  },
  "ja": {
    "title": {
      "create": "{name}による提出済フォーム",
      "updateReviewState": {
        "null": {
          "full": "{name}による{reviewState}報告",
          "reviewState": "受信済み"
        },
        "hasIssues": {
          "full": "{name}による{reviewState}報告",
          "reviewState": "問題有り"
        },
        "edited": {
          "full": "{name}による{reviewState}",
          "reviewState": "編集済み"
        },
        "approved": {
          "full": "{name}による{reviewState}",
          "reviewState": "承認済み"
        },
        "rejected": {
          "full": "{name}による{reviewState}",
          "reviewState": "リジェクト済み"
        }
      },
      "comment": "{name}によるコメント"
    }
  }
}
</i18n>
