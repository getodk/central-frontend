<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <feed-entry :iso="entry.loggedAt" :wrap-title="wrapTitle"
    class="entity-feed-entry">
    <template #title>
      <template v-if="entry.action === 'submission.create'">
        <span class="icon-cloud-upload"></span>
        <i18n-t v-if="submission.currentVersion != null"
          keypath="title.submission.create.notDeleted">
          <template #instanceName>
            <submission-link :project-id="projectId"
              :xml-form-id="submission.xmlFormId" :submission="submission"/>
          </template>
          <template #submitter><actor-link :actor="submission.submitter"/></template>
        </i18n-t>
        <i18n-t v-else keypath="title.submission.create.deleted.full">
          <template #deletedSubmission>
            <span class="deleted-submission">
              {{ deletedSubmission('title.submission.create.deleted.deletedSubmission') }}
            </span>
          </template>
          <template #name><actor-link :actor="submission.submitter"/></template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'submission.update'">
        <i18n-t keypath="title.submission.approval.full">
          <template #reviewState>
            <submission-review-state value="approved" color-text>
              {{ $t('title.submission.approval.reviewState') }}
            </submission-review-state>
          </template>
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'entity.create'">
        <span class="icon-magic"></span>
        <i18n-t v-if="entry.details.source?.submission != null"
          keypath="title.entity.create.submission">
          <template #label>
            <span class="entity-label">{{ entity.currentVersion.label }}</span>
          </template>
          <template #dataset>
            <dataset-link :project-id="projectId" :name="datasetName"/>
          </template>
        </i18n-t>
        <i18n-t v-else keypath="title.entity.create.api">
          <template #label>
            <span class="entity-label">{{ entity.currentVersion.label }}</span>
          </template>
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
        <span class="entity-version-tag">
          <router-link :to="versionAnchor(1)">
            {{ $t('common.versionShort', entityVersion) }}
          </router-link>
        </span>
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
        <span v-if="entityVersion.branch != null" class="offline-update"
          @click="showBranchData">
          {{ $t('offlineUpdate') }}
        </span>
      </template>
      <template v-else-if="entry.action === 'entity.bulk.create'">
        <span class="icon-cloud-upload"></span>
        <div class="bulk-event">
          <i18n-t keypath="title.entity.create.submission">
            <template #label>
              <span class="entity-label">{{ entity.currentVersion.label }}</span>
            </template>
            <template #dataset>
              <dataset-link :project-id="projectId" :name="datasetName"/>
            </template>
          </i18n-t>
        </div>
        <div class="bulk-source">
          <i18n-t keypath="title.entity.create.bulkSource">
            <template #name>
              <span class="source-name">{{ entry.details.source.name }}</span>
            </template>
            <template #actor><actor-link :actor="entry.actor"/></template>
          </i18n-t>
        </div>
      </template>
      <template v-else-if="entry.action === 'entity.update.version'">
        <span class="icon-pencil"></span>
        <template v-if="submission != null">
          <i18n-t v-if="submission.currentVersion != null"
            keypath="title.entity.update_version.submission.notDeleted">
            <template #instanceName>
              <submission-link :project-id="projectId"
                :xml-form-id="submission.xmlFormId" :submission="submission"/>
            </template>
          </i18n-t>
          <i18n-t v-else keypath="title.entity.update_version.submission.deleted.full">
            <template #deletedSubmission>
              <span class="deleted-submission">
                {{ deletedSubmission('title.entity.update_version.submission.deleted.deletedSubmission') }}
              </span>
            </template>
          </i18n-t>
        </template>
        <i18n-t v-else keypath="title.entity.update_version.api">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
        <span class="entity-version-tag">
          <router-link :to="versionAnchor(entityVersion.version)">
            {{ $t('common.versionShort', entityVersion) }}
          </router-link>
        </span>
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
        <span v-if="entityVersion.branch != null" class="offline-update"
          @click="showBranchData">
          {{ $t('offlineUpdate') }}
        </span>
      </template>
      <template v-else-if="entry.action === 'entity.update.resolve'">
        <span class="icon-random"></span>
        <i18n-t keypath="title.entity.update_resolve">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="(entry.action === 'entity.delete' || entry.action === 'entity.bulk.delete')">
        <span class="icon-trash"></span>
        <i18n-t keypath="title.entity.delete">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="(entry.action === 'entity.restore' || entry.action === 'entity.bulk.restore')">
        <span class="icon-recycle"></span>
        <i18n-t keypath="title.entity.restore">
          <template #label>
            <span class="entity-label">{{ entity.currentVersion.label }}</span>
          </template>
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
    </template>
    <template #body>
      <entity-diff v-if="entityVersion != null && entityVersion.version !== 1"/>
    </template>
  </feed-entry>
</template>

<script setup>
import { computed, inject, provide } from 'vue';
import { useI18n } from 'vue-i18n';

import ActorLink from '../actor-link.vue';
import DatasetLink from '../dataset/link.vue';
import EntityDiff from './diff.vue';
import FeedEntry from '../feed-entry.vue';
import SubmissionLink from '../submission/link.vue';
import SubmissionReviewState from '../submission/review-state.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityFeedEntry'
});
const props = defineProps({
  entry: {
    type: Object,
    required: true
  },
  submission: Object,
  entityVersion: Object
});
const emit = defineEmits(['branch-data']);
const projectId = inject('projectId');
const datasetName = inject('datasetName');
// The provided entityVersion won't be reactive, but that should be OK given how
// EntityFeedEntry is used in a v-for: props.entityVersion should never change.
provide('entityVersion', props.entityVersion);

// The component assumes that this data will exist when the component is
// created.
const { entity } = useRequestData();

// Allow titles that contain more than one string to wrap.
const wrapTitle = computed(() => {
  const { action } = props.entry;
  return action === 'submission.create' || action === 'entity.create' || action === 'entity.bulk.create' || action === 'entity.update.version';
});

// submission.create, entity.update.version
const { t } = useI18n();
const deletedSubmission = (key) => t(key, { id: props.submission.instanceId });

// entity.create, entity.update.version
const versionAnchor = (v) => `#v${v}`;
const config = inject('config');
const showBranchData = () => {
  if (config.devTools) emit('branch-data', props.entityVersion.version);
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.entity-feed-entry {
  .icon-cloud-upload { color: #bbb; }
  .icon-magic { color: $color-action-foreground; }
  .icon-pencil { color: #666; }
  .icon-random {
    color: #bbb;
    vertical-align: -2px;
  }
  .icon-trash { color: #bbb; }
  .icon-recycle {color: #bbb; }

  .deleted-submission, .entity-label, .source-name { font-weight: normal; }
  .deleted-submission { color: $color-danger; }

  .entity-version-tag, .feed-entry-title .offline-update {
    font-size: 12px;
    padding: 3px;
    border-radius: 2px;
  }
  .entity-version-tag {
    background-color: #ddd;
    margin-left: 5px;

    a {
      @include text-link;
      font-weight: bold;
    }
  }
  .feed-entry-title .offline-update {
    background-color: #eee;
    font-weight: normal;
    margin-left: 5px;
  }

  .bulk-event {
    display: inline;
  }
  .bulk-source {
    text-indent: 0px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": {
      "submission": {
        "create": {
          // This text is shown in a list of events. {submitter} is the name of
          // a user, a team of users, or a Public Access Link.
          "notDeleted": "Submission {instanceName} uploaded by {submitter}",
          "deleted": {
            // This text is shown in a list of events. {name} is the name of a
            // user, a team of users, or a Public Access Link.
            "full": "{deletedSubmission} uploaded by {name}",
            // This text is shown in a list of events. {id} is the Submission
            // instance ID.
            "deletedSubmission": "(deleted Submission {id})",
          }
        },
        // @transifexKey component.SubmissionFeedEntry.title.updateReviewState.approved
        "approval": {
          "full": "{reviewState} by {name}",
          "reviewState": "Approved"
        }
      },
      "entity": {
        "create": {
          // @transifexKey component.SubmissionFeedEntry.title.entity.create
          "submission": "Created Entity {label} in {dataset} Entity List",
          // This text is shown in a list of events. {name} is the name of a Web
          // User.
          "api": "Entity {label} created by {name}",
          // This text is shown in a list of events. {name} is a filename, e.g.
          // myfile.csv, and {actor} is a name/link to a Web User.
          "bulkSource": "File {name} uploaded by {actor}"
        },
        "update_version": {
          "submission": {
            "notDeleted": "Data updated by Submission {instanceName}",
            "deleted": {
              "full": "Data updated by {deletedSubmission}",
              "deletedSubmission": "(deleted Submission {id})",
            }
          },
          // This text is shown in a list of events. {name} is the name of a Web
          // User.
          "api": "Data updated by {name}"
        },
        // This text is shown in a list of events. {name} is the name of a Web
        // User.
        "update_resolve": "Conflict warning resolved by {name}",
        // This text is shown in a list of events. {name} is the name of a Web
        // User.
        "delete": "Entity {label} deleted by {name}",
        // This text is shown in a list of events. {name} is the name of a Web
        // User.
        "restore": "Entity {label} restored by {name}"
      }
    },
    // This is shown for an update to an Entity when the update was made offline
    // as part of a chain of updates.
    "offlineUpdate": "Offline update"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Podání {instanceName} nahrané {submitter}",
          "deleted": {
            "full": "{deletedSubmission} nahráno od {name}",
            "deletedSubmission": "(smazané podání {id})"
          }
        },
        "approval": {
          "full": "{reviewState} u {name}",
          "reviewState": "Schváleno"
        }
      },
      "entity": {
        "create": {
          "api": "Entita {label} vytvořena od {name}"
        },
        "update_version": {
          "submission": {
            "notDeleted": "Data aktualizována prostřednictvím odeslání {instanceName}",
            "deleted": {
              "full": "Data aktualizována pomocí {deletedSubmission}",
              "deletedSubmission": "(smazáno Odeslání {id})"
            }
          },
          "api": "Data aktualizovaná od {name}"
        },
        "update_resolve": "Varování konfliktu vyřešeno {name}"
      }
    }
  },
  "de": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Übermittlung {instanceName} hochgeladen von {submitter}",
          "deleted": {
            "full": "{deletedSubmission} hochgeladen von {name}",
            "deletedSubmission": "(Gelöschte Übermittlungen {id})"
          }
        },
        "approval": {
          "full": "{reviewState} • {name}",
          "reviewState": "Bestätigt"
        }
      },
      "entity": {
        "create": {
          "api": "Objekt {label} erstellt von {name}",
          "bulkSource": "Datei {name} hochgeladen von {actor}",
          "submission": "Objekt {label} in {dataset} Objektliste erzeugt"
        },
        "update_version": {
          "submission": {
            "notDeleted": "Daten aktualisiert durch Übermittlung {instanceName}",
            "deleted": {
              "full": "Daten aktualisiert durch {deletedSubmission}",
              "deletedSubmission": "(gelöschte Übermittlung {id})"
            }
          },
          "api": "Daten aktualisiert von {name}"
        },
        "update_resolve": "Konfliktwarnung gelöst von {name}",
        "delete": "Objekt {label} gelöscht von {name}",
        "restore": "Objekt {label} wiederhergestellt von {name}"
      }
    },
    "offlineUpdate": "Offline-Aktualisierung"
  },
  "es": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Envío {instanceName} subido por {submitter}",
          "deleted": {
            "full": "{deletedSubmission} subido por {name}",
            "deletedSubmission": "(envío eliminado {id})"
          }
        },
        "approval": {
          "full": "{reviewState} por {name}",
          "reviewState": "Aprobado"
        }
      },
      "entity": {
        "create": {
          "api": "Entidad {label} creada por {name}",
          "bulkSource": "Archivo {name} subido por {actor}",
          "submission": "Entidad creada {label} en {dataset} Lista de entidades"
        },
        "update_version": {
          "submission": {
            "notDeleted": "Datos actualizados por el envío {instanceName}",
            "deleted": {
              "full": "Datos actualizados por {deletedSubmission}",
              "deletedSubmission": "(envío eliminado {id})"
            }
          },
          "api": "Datos actualizados por {name}"
        },
        "update_resolve": "Advertencia de conflicto resuelto por {name}",
        "delete": "Entidad {label} eliminada por {name}",
        "restore": "Entidad {label} restablecida por {name}"
      }
    },
    "offlineUpdate": "Actualización offline"
  },
  "fr": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Soumission {instanceName} téléversée par {submitter}",
          "deleted": {
            "full": "{deletedSubmission} téléversée par {name}",
            "deletedSubmission": "(Soumission {id} supprimée)"
          }
        },
        "approval": {
          "full": "{reviewState} par {name}",
          "reviewState": "Approuvée"
        }
      },
      "entity": {
        "create": {
          "api": "Entité {label} créée par {name}",
          "bulkSource": "Fichier {name} envoyé par {actor}",
          "submission": "Création de l'entité {label} dans la liste {dataset}"
        },
        "update_version": {
          "submission": {
            "notDeleted": "Données mises à jour par la Soumission {instanceName}",
            "deleted": {
              "full": "Données mises à jour par {deletedSubmission}",
              "deletedSubmission": "(Soumission supprimée {id})"
            }
          },
          "api": "Donnée mise à jour par {name}"
        },
        "update_resolve": "Avertissement de conflit résolu par {name}",
        "delete": "Entité {label} supprimée par {name}",
        "restore": "l'Entité {label} a été restaurée par {name}"
      }
    },
    "offlineUpdate": "Mise à jour Hors Ligne"
  },
  "id": {
    "title": {
      "submission": {
        "approval": {
          "full": "{reviewState} oleh {name}",
          "reviewState": "Disetujui"
        }
      },
      "entity": {
        "create": {
          "api": "Entitas {label} dibuat oleh {name}"
        },
        "update_version": {
          "api": "Data diperbarui oleh {name}"
        }
      }
    }
  },
  "it": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Invio {instanceName} caricato da {submitter}",
          "deleted": {
            "full": "{deletedSubmission} caricata da {name}",
            "deletedSubmission": "(Invio cancellato {id})"
          }
        },
        "approval": {
          "full": "{reviewState} per {name}",
          "reviewState": "Approvato"
        }
      },
      "entity": {
        "create": {
          "api": "Entità {label} creata da {name}",
          "bulkSource": "File {name} caricato da {actor}",
          "submission": "Entità creata {label} in {dataset} Lista Entità"
        },
        "update_version": {
          "submission": {
            "notDeleted": "Dati aggiornati tramite invio {instanceName}",
            "deleted": {
              "full": "Dati aggiornati da {deletedSubmission}",
              "deletedSubmission": "(Invio cancellato {id})"
            }
          },
          "api": "Dati aggiornati da {name}"
        },
        "update_resolve": "Avviso di conflitto risolto da {name}",
        "delete": "Entità {label} eliminata da {name}",
        "restore": "Entità {label} ripristinata da {name}"
      }
    },
    "offlineUpdate": "Aggiornamento offline"
  },
  "ja": {
    "title": {
      "submission": {
        "approval": {
          "full": "{name}による{reviewState}",
          "reviewState": "承認済み"
        }
      }
    }
  },
  "pt": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Resposta {instanceName} carregada por {submitter}",
          "deleted": {
            "full": "{deletedSubmission} carregada por {name}",
            "deletedSubmission": "(Resposta {id} excluída)"
          }
        },
        "approval": {
          "full": "{reviewState} por {name}",
          "reviewState": "Aprovado"
        }
      },
      "entity": {
        "create": {
          "api": "{label} da Entidade criada por {name}",
          "bulkSource": "Arquivo {name} carregado por {actor}",
          "submission": "Entidade {label} criada na Lista de Entidades {dataset}"
        },
        "update_version": {
          "submission": {
            "notDeleted": "Dados atualizados pela Resposta {instanceName}",
            "deleted": {
              "full": "Dados atualizados por {deletedSubmission}",
              "deletedSubmission": "(Resposta {id} excluída)"
            }
          },
          "api": "Dados atualizados por {name}"
        },
        "update_resolve": "Aviso de conflito resolvido por {name}",
        "delete": "Entidade {label} excluída por {name}",
        "restore": "Entidade {label} recuperada por {name}"
      }
    },
    "offlineUpdate": "Atualização offline"
  },
  "sw": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Wasilisho {instanceName} limepakiwa na {submitter}",
          "deleted": {
            "full": "{deletedSubmission} imepakiwa na {name}",
            "deletedSubmission": "(Wasilisho limefutwa {id})"
          }
        },
        "approval": {
          "full": "{reviewState} kwa {name}",
          "reviewState": "Imeidhinishwa"
        }
      },
      "entity": {
        "create": {
          "api": "Huluki {label} iliyoundwa na {name}",
          "submission": "Imeunda Huluki {label} katika {dataset} Orodha ya Huluki"
        },
        "update_version": {
          "submission": {
            "notDeleted": "Data imesasishwa na Uwasilishaji {instanceName}",
            "deleted": {
              "full": "Data imesasishwa na {deletedSubmission}",
              "deletedSubmission": "(Wasilisho limefutwa {id})"
            }
          },
          "api": "Data iliyosasishwa na {name}"
        },
        "update_resolve": "Onyo la migogoro limetatuliwa kwa {name}"
      }
    }
  },
  "zh": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "由{submitter}上传的提交{instanceName}",
          "deleted": {
            "full": "{deletedSubmission}由{name}上传",
            "deletedSubmission": "（已删除的提交{id}）"
          }
        },
        "approval": {
          "full": "{name}{reviewState}",
          "reviewState": "已批准"
        }
      },
      "entity": {
        "create": {
          "api": "由{name}创建实体{label}",
          "bulkSource": "由{actor}上传档案{name}",
          "submission": "在{dataset}实体清单中建立了实体{label}"
        },
        "update_version": {
          "submission": {
            "notDeleted": "通过提交{instanceName}更新的数据",
            "deleted": {
              "full": "已由{deletedSubmission}更新数据",
              "deletedSubmission": "（已删除的提交{id}）"
            }
          },
          "api": "数据已被{name}更新"
        },
        "update_resolve": "冲突警告已被{name}解决",
        "delete": "实体{label}已被{name}删除",
        "restore": "实体{label}已被{name}复原"
      }
    },
    "offlineUpdate": "离线更新"
  },
  "zh-Hant": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "由 {submitter} 上傳的投稿內容 {instanceName}",
          "deleted": {
            "full": "{deletedSubmission} 由 {name}上傳",
            "deletedSubmission": "(已刪除的提交 {id})"
          }
        },
        "approval": {
          "full": "{reviewState} 按照{name}",
          "reviewState": "已認可"
        }
      },
      "entity": {
        "create": {
          "api": "由 {name}建立的{label}實體",
          "bulkSource": "由 {actor}上傳的{name}檔案",
          "submission": "在 {dataset} 實體清單中建立了實體 {label}"
        },
        "update_version": {
          "submission": {
            "notDeleted": "提交{instanceName}更新的數據",
            "deleted": {
              "full": "已由{deletedSubmission}更新資料",
              "deletedSubmission": "(已刪除提交{id})"
            }
          },
          "api": "由{name}更親資料"
        },
        "update_resolve": "衝突警告已由{name}解決",
        "delete": "由{name}刪除的實體{label}",
        "restore": "由{name}恢復的實體{label}"
      }
    },
    "offlineUpdate": "離線更新"
  }
}
</i18n>
