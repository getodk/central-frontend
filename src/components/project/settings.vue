<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="project-settings">
    <div v-if="project.dataExists" class="row">
      <div class="col-xs-8">
        <project-edit/>
      </div>
      <div class="col-xs-4">
        <div class="panel panel-simple">
          <div class="panel-heading">
            <h1 class="panel-title">{{ $t('encryption.title') }}</h1>
          </div>
          <div class="panel-body">
            <template v-if="project.keyId == null">
              <p>
                <span>{{ $t('encryption.body.unencrypted[0]') }}</span>
                <sentence-separator/>
                <doc-link to="central-encryption/">{{ $t('moreInfo.learnMore') }}</doc-link>
              </p>
              <p>
                <button id="project-settings-enable-encryption-button"
                  type="button" class="btn btn-primary"
                  @click="showModal('enableEncryption')">
                  {{ $t('encryption.action.enableEncryption') }}&hellip;
                </button>
              </p>
            </template>
            <template v-else>
              <p>
                <i18n-t keypath="encryption.body.encrypted[0].full">
                  <template #enabled>
                    <strong>{{ $t('encryption.body.encrypted[0].enabled') }}</strong>
                  </template>
                </i18n-t>
                <sentence-separator/>
                <doc-link to="central-encryption/">{{ $t('moreInfo.learnMore') }}</doc-link>
              </p>
              <p>{{ $t('encryption.body.encrypted[1]') }}</p>
            </template>
          </div>
        </div>
        <div class="panel panel-simple-danger">
          <div class="panel-heading">
            <h1 class="panel-title">{{ $t('common.dangerZone') }}</h1>
          </div>
          <div class="panel-body">
            <template v-if="!project.archived">
              <p>
                <button id="project-settings-archive-button" type="button"
                  class="btn btn-danger" @click="showModal('archive')">
                  {{ $t('dangerZone.action.archive') }}&hellip;
                </button>
              </p>
            </template>
            <template v-else>
              <p>{{ $t('dangerZone.archived[0]') }}</p>
              <p>{{ $t('dangerZone.archived[1]') }}</p>
            </template>
          </div>
        </div>
      </div>
    </div>

    <project-enable-encryption v-bind="enableEncryption"
      @hide="hideModal('enableEncryption')" @success="afterEnableEncryption"/>
    <project-archive v-bind="archive" @hide="hideModal('archive')"
      @success="afterArchive"/>
  </div>
</template>

<script>
import DocLink from '../doc-link.vue';
import ProjectArchive from './archive.vue';
import ProjectEdit from './edit.vue';
import ProjectEnableEncryption from './enable-encryption.vue';
import SentenceSeparator from '../sentence-separator.vue';

import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import { useRequestData } from '../../request-data';

export default {
  name: 'ProjectSettings',
  components: {
    DocLink,
    ProjectArchive,
    ProjectEdit,
    ProjectEnableEncryption,
    SentenceSeparator
  },
  mixins: [modal(), routes()],
  inject: ['alert'],
  emits: ['fetch-project'],
  setup() {
    const { project } = useRequestData();
    return { project };
  },
  data() {
    return {
      enableEncryption: {
        state: false
      },
      archive: {
        state: false
      }
    };
  },
  methods: {
    afterEnableEncryption() {
      this.hideModal('enableEncryption');
      this.$emit('fetch-project', true);
    },
    afterArchive() {
      const message = this.$t('alert.archive', this.project);
      this.$router.push(this.projectPath())
        .then(() => { this.alert.success(message); });
    }
  }
};
</script>

<style lang="scss">
#project-settings .panel-simple-danger p {
  margin-bottom: 5px;
}
</style>

<i18n lang="json5">
{
  "en": {
    "encryption": {
      // This is a title shown above a section of the page.
      "title": "Encryption",
      "body": {
        "unencrypted": [
          "Submission data encryption is not enabled for this Project."
        ],
        "encrypted": [
          {
            "full": "Submission data encryption is {enabled} for this Project.",
            "enabled": "enabled"
          },
          "In this version of ODK Central, you may not disable encryption once it is turned on."
        ]
      },
      "action": {
        "enableEncryption": "Enable encryption"
      }
    },
    "dangerZone": {
      "action": {
        "archive": "Archive this Project"
      },
      "archived": [
        "This Project has been archived.",
        "In this version of ODK Central, you may not unarchive a Project. However, the ability to unarchive a Project is planned for a future release."
      ]
    },
    "alert": {
      "archive": "The Project “{name}” was archived."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "encryption": {
      "title": "Šifrování",
      "body": {
        "unencrypted": [
          "Šifrování při odesílání dat není pro tento projekt povoleno."
        ],
        "encrypted": [
          {
            "full": "Šifrování dat příspěvků je {enabled} pro tento projekt.",
            "enabled": "povoleno"
          },
          "V této verzi ODK Central není možné šifrování zakázat, jakmile je zapnuto."
        ]
      },
      "action": {
        "enableEncryption": "Povolit šifrování"
      }
    },
    "dangerZone": {
      "action": {
        "archive": "Archivovat tento projekt"
      },
      "archived": [
        "Tento projekt byl archivován.",
        "V této verzi ODK Central nelze archivovat Projekt. Schopnost vyjmout projekt z archivu je však naplánována na budoucí vydání."
      ]
    },
    "alert": {
      "archive": "Projekt „{name}“ byl archivován."
    }
  },
  "de": {
    "encryption": {
      "title": "Verschlüsselung",
      "body": {
        "unencrypted": [
          "Übermittlungsdatenverschlüsselung ist für dieses Projekt nicht aktiviert."
        ],
        "encrypted": [
          {
            "full": "Übermittlungsdatenverschlüsselung ist für dieses Projekt {enabled}.",
            "enabled": "aktiviert"
          },
          "In dieser Version von ODK Central dürfen Sie die Verschlüsselung nicht mehr deaktivieren nachdem sie aktiviert wurde."
        ]
      },
      "action": {
        "enableEncryption": "Verschlüsselung aktivieren"
      }
    },
    "dangerZone": {
      "action": {
        "archive": "Dieses Projekt archivieren"
      },
      "archived": [
        "Dieses Projekt wurde archiviert.",
        "In dieser Version von ODK Central dürfen Sie ein Projekt nicht dearchivieren. Jedoch ist die Funktion zum Dearchivieren eines Projekts für eine zukünftige Version geplant."
      ]
    },
    "alert": {
      "archive": "Das Projekt \"{name}\" wurde archiviert."
    }
  },
  "es": {
    "encryption": {
      "title": "Cifrado",
      "body": {
        "unencrypted": [
          "El envío de datos cifrados no está activado para este proyecto."
        ],
        "encrypted": [
          {
            "full": "El cifrado de datos de los envíos está {enabled} para este proyecto.",
            "enabled": "activado"
          },
          "En esta versión de ODK Central, no podrá desactivar el cifrado una vez haya sido activada."
        ]
      },
      "action": {
        "enableEncryption": "Activar cifrado"
      }
    },
    "dangerZone": {
      "action": {
        "archive": "Archivar este proyecto"
      },
      "archived": [
        "Este proyecto ha sido archivado.",
        "En esta versión de ODK Central, no podrá desarchivar proyectos. No obstante, dicha funcionalidad está planeada para futuros desarrollos."
      ]
    },
    "alert": {
      "archive": "El proyecto \"{name}\" fue archivado."
    }
  },
  "fr": {
    "encryption": {
      "title": "Chiffrement",
      "body": {
        "unencrypted": [
          "Le chiffrement des données envoyées n'est pas activé pour ce projet."
        ],
        "encrypted": [
          {
            "full": "Le chiffrement des données de soumission est {enabled} pour ce projet.",
            "enabled": "Activé"
          },
          "Dans cette version d'ODK Central, vous ne pouvez pas désactiver le chiffrement une fois qu'il est activé."
        ]
      },
      "action": {
        "enableEncryption": "Activer le chiffrement"
      }
    },
    "dangerZone": {
      "action": {
        "archive": "Archiver ce projet"
      },
      "archived": [
        "Le projet a été archivé.",
        "Dans cette version d'ODK Central, vous ne pouvez pas désarchiver un projet. Cependant, la possibilité de désarchiver un projet est prévue pour une prochaine version."
      ]
    },
    "alert": {
      "archive": "Le projet \"{name}\" a été archivé."
    }
  },
  "id": {
    "encryption": {
      "title": "Enkripsi",
      "body": {
        "unencrypted": [
          "Enkripsi untuk kiriman data tidak diaktifkan di Proyek ini."
        ],
        "encrypted": [
          {
            "full": "Enkripsi kiriman data {enabled} di Proyek ini.",
            "enabled": "diaktifkan"
          },
          "Pada versi ODK Central sekarang, Anda tidak dapat menonaktifkan enkripsi setelah enkripsi diaktifkan."
        ]
      },
      "action": {
        "enableEncryption": "Aktifkan enkripsi"
      }
    },
    "dangerZone": {
      "action": {
        "archive": "Arsipkan Proyek ini"
      },
      "archived": [
        "Proyek ini telah diarsipkan.",
        "Pada versi ODK Central sekarang, Anda tidak dapat membatalkan pengarsipan sebuah Proyek. Namun, pilihan untuk membantalkan pengarsipan sebuah Proyek telah direncanakan untuk versi mendatang."
      ]
    },
    "alert": {
      "archive": "Proyek \"{name}\" telah diarsipkan."
    }
  },
  "it": {
    "encryption": {
      "title": "Crittografia",
      "body": {
        "unencrypted": [
          "La crittografia dei dati di invio non è abilitata per questo progetto."
        ],
        "encrypted": [
          {
            "full": "La crittografia dei dati di invio è {enabled} per questo progetto.",
            "enabled": "abilitato"
          },
          "In questa versione di ODK Central, non puoi disabilitare la crittografia una volta attivata."
        ]
      },
      "action": {
        "enableEncryption": "Abilita crittografia"
      }
    },
    "dangerZone": {
      "action": {
        "archive": "Archivia questo Progetto"
      },
      "archived": [
        "Il Progetto è stato archiviato",
        "In questa versione di ODK Central, non puoi annullare l'archiviazione di un progetto. Tuttavia, la possibilità di annullare l'archiviazione di un progetto è prevista per una versione futura."
      ]
    },
    "alert": {
      "archive": "Il Progetto \"{name}\" è stato archiviato"
    }
  },
  "ja": {
    "encryption": {
      "title": "暗号化",
      "body": {
        "unencrypted": [
          "このプロジェクトでは、提出フォームの暗号化は有効化されていません。"
        ],
        "encrypted": [
          {
            "full": "このプロジェクトの提出されたフォームの暗号化は、{enabled}",
            "enabled": "有効にされています。"
          },
          "このバージョンのODK Centralでは、一度有効にされた暗号化は無効にできません。"
        ]
      },
      "action": {
        "enableEncryption": "暗号化を有効にする"
      }
    },
    "dangerZone": {
      "action": {
        "archive": "このプロジェクトをアーカイブする"
      },
      "archived": [
        "このプロジェクトはアーカイブされました。",
        "このバージョンのODK Centralでは、プロジェクトの非アーカイブ化はできません。プロジェクトの非アーカイブ機能は将来的にリリースされる予定です。"
      ]
    },
    "alert": {
      "archive": "プロジェクト\"{name}\"はアーカイブされました。"
    }
  },
  "sw": {
    "encryption": {
      "title": "Usimbaji fiche",
      "body": {
        "unencrypted": [
          "Usimbaji fiche wa data ya uwasilishaji haujawezeshwa kwa Mradi huu."
        ],
        "encrypted": [
          {
            "full": "Usimbaji fiche wa data ya uwasilishaji {enabled} kwa Mradi huu.",
            "enabled": "imewezeshwa"
          },
          "Katika toleo hili la ODK Central, huwezi kuzima usimbaji fiche mara tu inapowashwa."
        ]
      },
      "action": {
        "enableEncryption": "Washa usimbaji fiche"
      }
    },
    "dangerZone": {
      "action": {
        "archive": "Hifadhi Mradi huu kwenye kumbukumbu"
      },
      "archived": [
        "Mradi huu umewekwa kwenye kumbukumbu.",
        "Katika toleo hili la ODK Central, unaweza usiondoe Mradi kwenye kumbukumbu. Hata hivyo, uwezo wa kufuta Mradi umepangwa kwa ajili ya kutolewa siku zijazo."
      ]
    },
    "alert": {
      "archive": "Mradi \"{name}\" uliwekwa kwenye kumbukumbu."
    }
  }
}
</i18n>
