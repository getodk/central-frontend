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
    class="entity-feed-entry"
    :class="{ 'submission-entry': entry.action.startsWith('submission.') }">
    <template #title>
      <template v-if="entry.action === 'submission.create'">
        <span class="icon-cloud-upload"></span>
        <i18n-t v-if="submission != null"
          keypath="title.submission.create.notDeleted">
          <template #instanceName>
            <router-link :to="creatingSubmissionPath">
              {{ submission.currentVersion.instanceName ?? submission.instanceId }}
            </router-link>
          </template>
          <template #submitter><actor-link :actor="entry.actor"/></template>
        </i18n-t>
        <i18n-t v-else keypath="title.submission.create.deleted.full">
          <template #deletedSubmission>
            <span class="deleted-submission">{{ deletedSubmission }}</span>
          </template>
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-if="entry.action === 'submission.update'">
        <i18n-t keypath="title.submission.approval.full">
          <template #reviewState>
            <span class="approval">
              <span :class="reviewStateIcon('approved')"></span>
              <span>{{ $t('title.submission.approval.reviewState') }}</span>
            </span>
          </template>
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-if="entry.action === 'entity.create'">
        <span class="icon-magic-wand"></span>
        <i18n-t v-if="entry.details.submissionCreate != null"
          keypath="title.entity.create.submission">
          <template #label>
            <span class="entity-label">{{ entity.currentVersion.label }}</span>
          </template>
          <template #dataset>
            <router-link :to="datasetPath()">{{ datasetName }}</router-link>
          </template>
        </i18n-t>
        <i18n-t v-else keypath="title.entity.create.api">
          <template #label>
            <span class="entity-label">{{ entity.currentVersion.label }}</span>
          </template>
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
      <template v-else-if="entry.action === 'entity.update.version'">
        <span class="icon-pencil"></span>
        <i18n-t keypath="title.entity.update_version.api">
          <template #name><actor-link :actor="entry.actor"/></template>
        </i18n-t>
      </template>
    </template>
    <template #body>
      <template v-if="diff != null">
        <diff-item v-for="change of diff" :key="change.propertyName"
          :path="[change.propertyName]" :old="change.old" :new="change.new"/>
      </template>
    </template>
  </feed-entry>
</template>

<script setup>
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';

import ActorLink from '../actor-link.vue';
import DiffItem from '../diff-item.vue';
import FeedEntry from '../feed-entry.vue';

import useReviewState from '../../composables/review-state';
import useRoutes from '../../composables/routes';
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
  diff: Array
});
const projectId = inject('projectId');
const datasetName = inject('datasetName');

// The component assumes that this data will exist when the component is
// created.
const { entity } = useRequestData();

// Allow titles that contain more than one string to wrap.
const wrapTitle = computed(() => {
  const { action } = props.entry;
  return action === 'submission.create' || action === 'entity.create';
});

const { submissionPath, datasetPath } = useRoutes();
const creatingSubmissionPath = computed(() => submissionPath(
  projectId,
  props.submission.xmlFormId,
  props.submission.instanceId
));
const { t } = useI18n();
const deletedSubmission = computed(() => {
  const id = props.entry.details.instanceId;
  return t('title.submission.create.deleted.deletedSubmission', { id });
});
const { reviewStateIcon } = useReviewState();
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.entity-feed-entry {
  &.submission-entry { margin-top: -19px; }

  .icon-cloud-upload { color: #bbb; }
  .icon-magic-wand { color: $color-action-foreground; }
  .icon-pencil { color: #666; }

  .deleted-submission, .entity-label { font-weight: normal; }
  .deleted-submission { color: $color-danger; }
  .approval { color: $color-success; }
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
          // user.
          "api": "Entity {label} created by {name}"
        },
        "update_version": {
          // This text is shown in a list of events. {name} is the name of a Web
          // User.
          "api": "Data updated by {name}"
        }
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
          "api": "Data aktualizovaná od {name}"
        }
      }
    }
  },
  "de": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Übermittlung {instanceName}hochgeladen von{submitter}",
          "deleted": {
            "full": "{deletedSubmission} hochgeladen von{name}",
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
          "api": "Entität {label} erstellt von {name}"
        },
        "update_version": {
          "api": "Daten aktualisiert von{name}"
        }
      }
    }
  },
  "es": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Envío {instanceName}subido por{submitter}",
          "deleted": {
            "full": "{deletedSubmission}subido por{name}",
            "deletedSubmission": "(envío eliminado{id})"
          }
        },
        "approval": {
          "full": "{reviewState} por {name}",
          "reviewState": "Aprobado"
        }
      },
      "entity": {
        "create": {
          "api": "Entidad {label}creada por{name}"
        },
        "update_version": {
          "api": "Datos actualizados por {name}"
        }
      }
    }
  },
  "fr": {
    "title": {
      "submission": {
        "create": {
          "notDeleted": "Soumission {instanceName} téléversée par {submitter}",
          "deleted": {
            "full": "{deletedSubmission} téléversée par {name}",
            "deletedSubmission": "(Soumission {id}supprimée)"
          }
        },
        "approval": {
          "full": "{reviewState} par {name}",
          "reviewState": "Approuvée"
        }
      },
      "entity": {
        "create": {
          "api": "Entité {label}créée par {name}",
          "submission": "Création de l'entité {label} dans la liste {dataset}"
        },
        "update_version": {
          "api": "Donnée mise à jour par {name}"
        }
      }
    }
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
          "submission": "Entità creata {label} in {dataset} Lista Entità"
        },
        "update_version": {
          "api": "Dati aggiornati da {name}"
        }
      }
    }
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
  "sw": {
    "title": {
      "submission": {
        "approval": {
          "full": "{reviewState} kwa {name}",
          "reviewState": "Imeidhinishwa"
        }
      }
    }
  }
}
</i18n>
