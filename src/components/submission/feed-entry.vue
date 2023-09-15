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
  <feed-entry :iso="entry.loggedAt ?? entry.createdAt"
    :wrap-title="entry.action === 'entity.create'"
    class="submission-feed-entry">
    <template #title>
      <template v-if="entry.action === 'submission.create'">
        <span class="icon-cloud-upload"></span>
        <i18n-t keypath="title.create">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="updateOrEdit">
        <i18n-t :keypath="`title.updateReviewState.${reviewState}.full`">
          <template #reviewState>
            <span class="review-state" :class="reviewState">
              <span :class="reviewStateIcon(reviewState)"></span>
              <span>{{ $t(`title.updateReviewState.${reviewState}.reviewState`) }}</span>
            </span>
          </template>
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'entity.create'">
        <span class="icon-magic-wand entity-icon"></span>
        <i18n-t keypath="title.entity.create">
          <template #label>
            <router-link v-if="entry.details?.entity?.currentVersion?.label != null" :to="entityPath(projectId, entry.details?.entity?.dataset, entry.details?.entity?.uuid)">
              {{ entry.details?.entity?.currentVersion?.label }}
            </router-link>
            <template v-else>
              <span class="entity-label">{{ entry.details?.entity?.uuid }}</span>
            </template>
          </template>
          <template #dataset>
            <router-link :to="datasetPath(projectId, entry.details?.entity?.dataset)">
              {{ entry.details?.entity?.dataset }}
            </router-link>
          </template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'entity.create.error'">
        <span class="icon-warning"></span>
        <span class="submission-feed-entry-entity-error">{{ $t('title.entity.error') }}</span>
        <span class="entity-error-message" v-tooltip.text>{{ entityProblem(entry) }}</span>
      </template>
      <template v-else>
        <span class="icon-comment"></span>
        <i18n-t keypath="title.comment">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
    </template>
    <template #body>
      <markdown-view v-if="comment != null" :raw-markdown="comment"/>
      <template v-else-if="entryDiffs != null">
        <submission-diff-item v-for="(diff, index) in entryDiffs" :key="index" :entry="diff"
          :project-id="projectId" :xml-form-id="xmlFormId" :instance-id="instanceId"
          :old-version-id="oldVersionId" :new-version-id="newVersionId"/>
      </template>
    </template>
  </feed-entry>
</template>

<script>
import { last } from 'ramda';

import ActorLink from '../actor-link.vue';
import FeedEntry from '../feed-entry.vue';
import MarkdownView from '../markdown/view.vue';
import SubmissionDiffItem from './diff-item.vue';

import useReviewState from '../../composables/review-state';
import useRoutes from '../../composables/routes';
import { useRequestData } from '../../request-data';

export default {
  name: 'SubmissionFeedEntry',
  components: { ActorLink, FeedEntry, MarkdownView, SubmissionDiffItem },
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
  setup() {
    const { diffs } = useRequestData();
    const { reviewStateIcon } = useReviewState();
    const { datasetPath, entityPath } = useRoutes();
    return { diffs, reviewStateIcon, datasetPath, entityPath };
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
    entityProblem(entry) {
      if ('problem' in entry.details &&
        'problemDetails' in entry.details.problem &&
        'reason' in entry.details.problem.problemDetails)
        return entry.details.problem.problemDetails.reason;
      if ('problem' in entry.details &&
        'errorMessage' in entry.details)
        return entry.details.errorMessage;
      return '';
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.submission-feed-entry {
  .entity-error-message{
    font-size: 12px;
    margin-left: 10px;
    font-weight: normal;
  }

  .icon-cloud-upload, .icon-comment { color: #bbb; }
  .entity-icon { color: $color-action-foreground; }
  .icon-warning { color: $color-danger; }
  .review-state {
    color: #999;
    &.hasIssues { color: $color-warning; }
    &.edited { color: #666; }
    &.approved { color: $color-success; }
    &.rejected { color: $color-danger; }
  }
  .entity-label { font-weight: normal; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": {
      /*
      This text is shown in the list of actions performed on a Submission. There
      is an icon before the text that corresponds to the word "Submitted", so it
      is essential for "Submitted" to also come first in the translation. If
      that is unnatural in your language, you can also split the text into two
      parts. For example, instead of:

      Submitted by {name}

      you could split it into:

      Submitted • {name}
      */
      "create": "Submitted by {name}",
      "entity": {
        "create": "Created Entity {label} in {dataset} Entity List",
        "error": "Problem creating Entity",
      },
      "updateReviewState": {
        "null": {
          /*
          This text is shown in the list of actions performed on a Submission.
          There is an icon before the text that corresponds to the Review State,
          so it is essential for the Review State to also come first in the
          translation. If that is unnatural in your language, you can also split
          the text into two parts. For example, instead of:

          {reviewState} per {name}

          you could split it into:

          {reviewState} • {name}
          */
          "full": "{reviewState} per {name}",
          "reviewState": "Received"
        },
        "hasIssues": {
          /*
          This text is shown in the list of actions performed on a Submission.
          There is an icon before the text that corresponds to the Review State,
          so it is essential for the Review State to also come first in the
          translation. If that is unnatural in your language, you can also split
          the text into two parts. For example, instead of:

          {reviewState} per {name}

          you could split it into:

          {reviewState} • {name}
          */
          "full": "{reviewState} per {name}",
          "reviewState": "Has Issues"
        },
        "edited": {
          /*
          This text is shown in the list of actions performed on a Submission.
          There is an icon before the text that corresponds to the Review State,
          so it is essential for the Review State to also come first in the
          translation. If that is unnatural in your language, you can also split
          the text into two parts. For example, instead of:

          {reviewState} by {name}

          you could split it into:

          {reviewState} • {name}
          */
          "full": "{reviewState} by {name}",
          "reviewState": "Edited"
        },
        "approved": {
          /*
          This text is shown in the list of actions performed on a Submission.
          There is an icon before the text that corresponds to the Review State,
          so it is essential for the Review State to also come first in the
          translation. If that is unnatural in your language, you can also split
          the text into two parts. For example, instead of:

          {reviewState} by {name}

          you could split it into:

          {reviewState} • {name}
          */
          "full": "{reviewState} by {name}",
          "reviewState": "Approved"
        },
        "rejected": {
          /*
          This text is shown in the list of actions performed on a Submission.
          There is an icon before the text that corresponds to the Review State,
          so it is essential for the Review State to also come first in the
          translation. If that is unnatural in your language, you can also split
          the text into two parts. For example, instead of:

          {reviewState} by {name}

          you could split it into:

          {reviewState} • {name}
          */
          "full": "{reviewState} by {name}",
          "reviewState": "Rejected"
        }
      },
      /*
      This text is shown in the list of actions performed on a Submission.
      There is an icon before the text that corresponds to the word "Comment",
      so it is essential for "Comment" to also come first in the translation. If
      that is unnatural in your language, you can also split the text into two
      parts. For example, instead of:

      Comment by {name}

      you could split it into:

      Comment • {name}
      */
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
      "entity": {
        "error": "Problém s vytvořením entity"
      },
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
      "entity": {
        "error": "Problem beim Erstellen einer Entität"
      },
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
      "entity": {
        "error": "Problema creando Entidad"
      },
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
      "entity": {
        "create": "Création de l'entité {label} dans la liste {dataset}",
        "error": "Problème lors de la création de l'entité"
      },
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
      "create": "Terkirim oleh {name}",
      "entity": {
        "error": "Masalah saat membuat Entitas"
      },
      "updateReviewState": {
        "null": {
          "full": "{reviewState} per {name}",
          "reviewState": "Diterima"
        },
        "hasIssues": {
          "full": "{reviewState} per {name}",
          "reviewState": "Memiliki masalah"
        },
        "edited": {
          "full": "{reviewState} oleh {name}",
          "reviewState": "Diubah"
        },
        "approved": {
          "full": "{reviewState} oleh {name}",
          "reviewState": "Disetujui"
        },
        "rejected": {
          "full": "{reviewState} oleh {name}",
          "reviewState": "Ditolak"
        }
      },
      "comment": "Komentar oleh {name}"
    }
  },
  "it": {
    "title": {
      "create": "Inviato da {name}",
      "entity": {
        "create": "Entità creata {label} in {dataset} Lista Entità",
        "error": "Problema durante la creazione dell'Entità"
      },
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
  },
  "sw": {
    "title": {
      "create": "Imewasilishwa na {name}",
      "entity": {
        "error": "Tatizo limetokea wakati wa kuunda Huluki"
      },
      "updateReviewState": {
        "null": {
          "full": "{reviewState} kwa {name}",
          "reviewState": "Imepokelewa"
        },
        "hasIssues": {
          "full": "{reviewState} kwa {name}",
          "reviewState": "Ina Masuala"
        },
        "edited": {
          "full": "{reviewState} kwa {name}",
          "reviewState": "Imehaririwa"
        },
        "approved": {
          "full": "{reviewState} kwa {name}",
          "reviewState": "Imeidhinishwa"
        },
        "rejected": {
          "full": "{reviewState} kwa {name}",
          "reviewState": "Imekataliwa"
        }
      },
      "comment": "Maoni kutoka kwa {name}"
    }
  }
}
</i18n>
