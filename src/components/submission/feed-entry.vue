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
    :wrap-title="entry.action === 'entity.create' || entry.action === 'entity.update.version' || entry.action?.startsWith('submission.backlog')"
    class="submission-feed-entry">
    <template #title>
      <template v-if="entry.action === 'submission.create'">
        <span class="icon-cloud-upload"></span>
        <i18n-t keypath="title.create">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'submission.delete'">
        <span class="icon-trash"></span>
        <i18n-t keypath="title.delete">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'submission.restore'">
        <span class="icon-recycle"></span>
        <i18n-t keypath="title.undelete">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="updateOrEdit">
        <i18n-t :keypath="`title.updateReviewState.${reviewState}.full`">
          <template #reviewState>
            <submission-review-state :value="reviewState" color-text>
              {{ $t(`title.updateReviewState.${reviewState}.reviewState`) }}
            </submission-review-state>
          </template>
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'entity.create'">
        <span class="icon-magic entity-icon"></span>
        <i18n-t keypath="title.entity.create">
          <template #label>
            <entity-link v-if="entityDetails?.currentVersion?.label != null"
              :project-id="projectId" :dataset="entityDetails.dataset"
              :entity="entityDetails"/>
            <span v-else class="entity-label">{{ entityDetails.uuid }}</span>
          </template>
          <template #dataset>
            <dataset-link :project-id="projectId" :name="entityDetails.dataset"/>
          </template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'entity.update.version'">
        <span class="icon-magic entity-icon"></span>
        <i18n-t keypath="title.entity.update">
          <template #label>
            <entity-link v-if="entityDetails?.currentVersion?.label != null"
              :project-id="projectId" :dataset="entityDetails.dataset"
              :entity="entityDetails"/>
            <span v-else class="entity-label">{{ entityDetails.uuid }}</span>
          </template>
          <template #dataset>
            <dataset-link :project-id="projectId" :name="entityDetails.dataset"/>
          </template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'entity.error'">
        <span class="icon-warning"></span>
        <span class="submission-feed-entry-entity-error">{{ $t('title.entity.error') }}</span>
        <span class="entity-error-message" v-tooltip.text>{{ entry.details.problem?.problemDetails?.reason ?? entry.details.errorMessage ?? '' }}</span>
      </template>
      <template v-else-if="entry.action?.startsWith('submission.backlog')">
        <span class="icon-clock-o"></span>
        <span>{{ $t(`title.submissionBacklog.${entry.action.replace('submission.backlog.', '')}`) }}</span>
      </template>
      <template v-else-if="comment">
        <span class="icon-comment"></span>
        <i18n-t keypath="title.comment">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else>
        <span class="icon-question-circle-o"></span>
        {{ entry.action }}
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
import DatasetLink from '../dataset/link.vue';
import EntityLink from '../entity/link.vue';
import FeedEntry from '../feed-entry.vue';
import MarkdownView from '../markdown/view.vue';
import SubmissionDiffItem from './diff-item.vue';
import SubmissionReviewState from './review-state.vue';

import { useRequestData } from '../../request-data';

export default {
  name: 'SubmissionFeedEntry',
  components: {
    ActorLink,
    DatasetLink,
    EntityLink,
    FeedEntry,
    MarkdownView,
    SubmissionDiffItem,
    SubmissionReviewState
  },
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
    return { diffs };
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
    entityDetails() {
      return this.entry.details.entity;
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

  .icon-cloud-upload, .icon-comment, .icon-trash, .icon-recycle, .icon-clock-o {
    color: #bbb;
  }
  .entity-icon { color: $color-action-foreground; }
  .icon-warning { color: $color-danger; }
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
        "update": "Updated Entity {label} in {dataset} Entity List",
        "error": "Problem processing Entity",
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
      "comment": "Comment by {name}",
      /*
      This text is shown in the list of actions performed on a Submission.
      There is an icon before the text that corresponds to the word "Deleted",
      so it is essential for "Deleted" to also come first in the translation. If
      that is unnatural in your language, you can also split the text into two
      parts. For example, instead of:

      Deleted by {name}

      you could split it into:

      Deleted • {name}
      */
      "delete": "Deleted by {name}",
      /*
      This text is shown in the list of actions performed on a Submission.
      There is an icon before the text that corresponds to the word "Restored",
      so it is essential for "Restored" to also come first in the translation. If
      that is unnatural in your language, you can also split the text into two
      parts. For example, instead of:

      Restored by {name}

      you could split it into:

      Restored • {name}
      */
      "undelete": "Restored by {name}",
      /*
      This text is shown in the list of actions performed on a Submission.
      */
      "submissionBacklog": {
        "hold": "Waiting for previous Submission in offline update chain before updating Entity",
        "force": "Processed Submission from backlog without previous Submission in offline update chain",
        "reprocess": "Previous Submission in offline update chain was received"
      }
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
      "entity": {
        "create": "Objekt {label} in {dataset} Objektliste erzeugt",
        "update": "Objekt {label} in {dataset} Objektliste aktualisiert",
        "error": "Problem beim Erstellen eines Objekts"
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
      "comment": "Kommentiert von {name}",
      "delete": "Gelöscht von {name}",
      "undelete": "Wiederhergestellt von {name}",
      "submissionBacklog": {
        "hold": "Warten auf die vorherige Übermittlung in der Offline-Aktualisierungskette vor der Aktualisierung des Objekts",
        "force": "Bearbeitete Übermittlung aus dem Rückstand ohne vorherige Übermittlung in der Offline-Verbuchungskette",
        "reprocess": "Die vorherige Übermittlung in der Offline-Aktualisierungskette wurde empfangen"
      }
    }
  },
  "es": {
    "title": {
      "create": "Enviado por {name}",
      "entity": {
        "create": "Entidad creada {label} en {dataset} Lista de entidades",
        "update": "Entidad Actualizada {label} en {dataset} Lista de entidades",
        "error": "Problema procesando la Entidad"
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
      "comment": "Comentario por {name}",
      "delete": "Eliminado por {name}",
      "undelete": "Restablecido por {name}",
      "submissionBacklog": {
        "hold": "Esperar al envío anterior en la cadena de actualización offline antes de actualizar la entidad",
        "force": "Presentación procesada desde la cartera de pedidos sin presentación previa en la cadena de actualización offline",
        "reprocess": "Se ha recibido el envío anterior en la cadena de actualización offline"
      }
    }
  },
  "fr": {
    "title": {
      "create": "Soumis par {name}",
      "entity": {
        "create": "Création de l'entité {label} dans la liste {dataset}",
        "update": "{label} Entité mise à jour dans {dataset} Listes d'Entités",
        "error": "Problème lors du traitement de l'Entité"
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
      "comment": "Commentaire de {name}",
      "delete": "Supprimée par {name}",
      "undelete": "Restauré par {name}",
      "submissionBacklog": {
        "hold": "En attente d'une soumission précédente dans une série de mises à jour effectuées hors ligne avant de mettre l'Entité à jour",
        "force": "Soumission retenue et puis traitée sans la soumission qui la précéderait dans la série de mises à jour effectuées hors ligne",
        "reprocess": "Soumission précédente dans une série de mises à jours hors ligne à été reçue"
      }
    }
  },
  "id": {
    "title": {
      "create": "Terkirim oleh {name}",
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
        "update": "Entità aggiornata {label} in {dataset} Lista Entità",
        "error": "Problema durante la elaborazione dell'Entità"
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
      "comment": "Commenti di {name}",
      "delete": "Eliminato da {name}",
      "undelete": "Ripristinato da {name}",
      "submissionBacklog": {
        "hold": "Attesa di un invio precedente nella catena di aggiornamento offline prima di aggiornare l'entità",
        "force": "Invio elaborato dall'arretrato senza un invio precedente nella catena di aggiornamento offline",
        "reprocess": "È stato ricevuto l'invio precedente nella catena di aggiornamento offline"
      }
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
  "pt": {
    "title": {
      "create": "Enviado por {name}",
      "entity": {
        "create": "Entidade {label} criada na Lista de Entidades {dataset}",
        "update": "Entidade {label} atualizada na Lista de Entidades {dataset}",
        "error": "Problema ao processar a Entidade"
      },
      "updateReviewState": {
        "null": {
          "full": "{reviewState} por {name}",
          "reviewState": "Recebido"
        },
        "hasIssues": {
          "full": "{reviewState} por {name}",
          "reviewState": "Contém erros"
        },
        "edited": {
          "full": "{reviewState} por {name}",
          "reviewState": "Editado"
        },
        "approved": {
          "full": "{reviewState} por {name}",
          "reviewState": "Aprovado"
        },
        "rejected": {
          "full": "{reviewState} por {name}",
          "reviewState": "Rejeitado"
        }
      },
      "comment": "Comentado por {name}",
      "delete": "Deletado por {name}",
      "undelete": "Recuperado por {name}",
      "submissionBacklog": {
        "hold": "Aguardando Resposta anterior na cadeia de atualização offline antes de atualizar a Entidade",
        "force": "Resposta processada do backlog sem Resposta anterior na cadeia de atualização offline",
        "reprocess": "Resposta anterior na cadeia de atualização offline foi recebida"
      }
    }
  },
  "sw": {
    "title": {
      "create": "Imewasilishwa na {name}",
      "entity": {
        "create": "Imeunda Huluki {label} katika {dataset} Orodha ya Huluki",
        "update": "Imesasisha Huluki {label} katika {dataset} Orodha ya Huluki",
        "error": "Tatizo la kuchakata Huluki"
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
  },
  "zh": {
    "title": {
      "create": "由{name}提交",
      "entity": {
        "create": "在{dataset}实体清单中建立了实体{label}",
        "update": "在{dataset}实体清单中更新了实体{label}",
        "error": "实体处理异常"
      },
      "updateReviewState": {
        "null": {
          "full": "{name}{reviewState}",
          "reviewState": "已接收"
        },
        "hasIssues": {
          "full": "{name}{reviewState}",
          "reviewState": "存在异常"
        },
        "edited": {
          "full": "{name}{reviewState}",
          "reviewState": "已编辑"
        },
        "approved": {
          "full": "{name}{reviewState}",
          "reviewState": "已批准"
        },
        "rejected": {
          "full": "{name}{reviewState}",
          "reviewState": "已拒绝"
        }
      },
      "comment": "由{name}评论",
      "delete": "由{name}删除",
      "undelete": "由{name}复原",
      "submissionBacklog": {
        "hold": "正在等待离线更新链中的前序提交，随后将更新实体",
        "force": "已处理积压队列中的提交（离线更新链中无前序提交）",
        "reprocess": "离线更新链中的前序提交已接收"
      }
    }
  },
  "zh-Hant": {
    "title": {
      "create": "由{name}提交",
      "entity": {
        "create": "在 {dataset} 實體清單中建立了實體 {label}",
        "update": "更新了 {dataset} 實體清單中的實體 {label}",
        "error": "問題處理實體"
      },
      "updateReviewState": {
        "null": {
          "full": "每個{name}的{reviewState}",
          "reviewState": "已收到"
        },
        "hasIssues": {
          "full": "每個{name}的{reviewState}",
          "reviewState": "有問題"
        },
        "edited": {
          "full": "{reviewState} 按照{name}",
          "reviewState": "已編輯"
        },
        "approved": {
          "full": "{reviewState} 按照{name}",
          "reviewState": "已認可"
        },
        "rejected": {
          "full": "{reviewState} 按照{name}",
          "reviewState": "拒絕"
        }
      },
      "comment": "由{name}評論",
      "delete": "已由 {name} 刪除",
      "undelete": "已由{name}恢復",
      "submissionBacklog": {
        "hold": "在更新實體之前等待離線更新鏈中的先前提交",
        "force": "已處理來自積壓的提交，而離線更新鏈中沒有先前的提交",
        "reprocess": "前次離線更新鏈提交已收到"
      }
    }
  }
}
</i18n>
