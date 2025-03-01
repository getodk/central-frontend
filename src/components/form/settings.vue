<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-if="form.dataExists" id="form-settings">
    <div class="row">
      <div class="col-xs-6">
        <div class="panel panel-simple">
          <div class="panel-heading">
            <h1 class="panel-title">{{ $t('state.title') }}</h1>
          </div>
          <div class="panel-body">
            <i18n-t tag="p" keypath="state.body.full">
              <template #formAccessSettings>
                <router-link :to="projectPath('form-access')">{{ $t('state.body.formAccessSettings') }}</router-link>
              </template>
            </i18n-t>
          </div>
        </div>
      </div>
      <div class="col-xs-6">
        <div class="panel panel-simple-danger">
          <div class="panel-heading">
            <h1 class="panel-title">{{ $t('common.dangerZone') }}</h1>
          </div>
          <div class="panel-body">
            <p>
              <button type="button" class="btn btn-danger"
                @click="deleteModal.show()">
                {{ $t('action.delete') }}&hellip;
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
    <form-delete v-bind="deleteModal" @hide="deleteModal.hide()"
      @success="afterDelete"/>
  </div>
</template>

<script>
import FormDelete from './delete.vue';

import useRoutes from '../../composables/routes';
import { modalData } from '../../util/reactivity';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormSettings',
  components: { FormDelete },
  inject: ['alert'],
  setup() {
    const { form } = useRequestData();
    const { projectPath } = useRoutes();
    return { form, deleteModal: modalData(), projectPath };
  },
  methods: {
    afterDelete() {
      const message = this.$t('alert.delete', { name: this.form.nameOrId });
      this.$router.push(this.projectPath())
        .then(() => { this.alert.success(message); });
    }
  }
};
</script>

<style lang="scss">
#form-settings .panel-simple-danger .panel-body p {
  margin-bottom: 15px;
  margin-top: 10px;
  text-align: center;
}
</style>

<i18n lang="json5">
{
  "en": {
    "state": {
      // This is a title shown above a section of the page.
      "title": "Form State",
      "body": {
        "full": "To set this Form’s state, please visit the Project {formAccessSettings}.",
        "formAccessSettings": "Form Access settings"
      }
    },
    "action": {
      "delete": "Delete this Form"
    },
    "alert": {
      "delete": "The Form “{name}” was deleted."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "state": {
      "title": "Stav formuláře",
      "body": {
        "full": "Chcete-li nastavit stav tohoto formuláře, navštivte {formAccessSettings} Projektu.",
        "formAccessSettings": "Nastavení přístupu k formuláři"
      }
    },
    "action": {
      "delete": "Odstranit tento formulář"
    },
    "alert": {
      "delete": "Formulář „{name}“ byl odstraněn."
    }
  },
  "de": {
    "state": {
      "title": "Formular-Status",
      "body": {
        "full": "Die Zugriffsberechtigungen für diese Formular finden Sie in {formAccessSettings}.",
        "formAccessSettings": "Zugriffsberechtigungen"
      }
    },
    "action": {
      "delete": "Dieses Formular löschen"
    },
    "alert": {
      "delete": "Das Formular \"{name}\" wurde gelöscht."
    }
  },
  "es": {
    "state": {
      "title": "Estado del formulario",
      "body": {
        "full": "Para establecer el estado de este formulario, por favor visite la {formAccessSettings} de este proyecto.",
        "formAccessSettings": "configuración de acceso a formulario"
      }
    },
    "action": {
      "delete": "Borrar este formulario"
    },
    "alert": {
      "delete": "El formulario \"{name}\" fue borrado."
    }
  },
  "fr": {
    "state": {
      "title": "État du formulaire",
      "body": {
        "full": "Pour définir l'état de ce formulaire, veuillez consulter le {formAccessSettings} du projet.",
        "formAccessSettings": "Paramètres d'accès aux formulaires"
      }
    },
    "action": {
      "delete": "Supprimer ce formulaire"
    },
    "alert": {
      "delete": "Le formulaire {name} a été supprimé."
    }
  },
  "id": {
    "state": {
      "title": "Status Formulir",
      "body": {
        "full": "Untuk mengatur status formulir, silakan kunjungi {formAccessSettings} Proyek.",
        "formAccessSettings": "Pengaturan Akses Formulir"
      }
    },
    "action": {
      "delete": "Hapus formulir ini"
    },
    "alert": {
      "delete": "Formulir {name} telah dihapus."
    }
  },
  "it": {
    "state": {
      "title": "Stato del Formulario",
      "body": {
        "full": "Per impostare lo stato di questo formulario, visita il progetto {formAccessSettings}",
        "formAccessSettings": "Configurazioni di accesso al form"
      }
    },
    "action": {
      "delete": "Cancella questo formulario"
    },
    "alert": {
      "delete": "Il Formulario “{name}” è stato cancellato."
    }
  },
  "ja": {
    "state": {
      "title": "フォームの状態",
      "body": {
        "full": "このフォームの状態を設定するには、各プロジェクトの{formAccessSettings}を確認して下さい。",
        "formAccessSettings": "フォームアクセスの設定"
      }
    },
    "action": {
      "delete": "フォームを削除"
    },
    "alert": {
      "delete": "フォーム\"{name}\"は削除されました。"
    }
  },
  "pt": {
    "state": {
      "title": "Status do formulário",
      "body": {
        "full": "Para definir o estado desse formulário, por favor visite a {formAccessSettings}do projeto.",
        "formAccessSettings": "Configurações de acesso ao formulário"
      }
    },
    "action": {
      "delete": "Excluir esse formulário"
    },
    "alert": {
      "delete": "O formulário \"{name}\" foi excluído."
    }
  },
  "sw": {
    "state": {
      "title": "Jimbo la Fomu",
      "body": {
        "full": "Ili kuweka hali ya Fomu hii, tafadhali tembelea Project {formAccessSettings}.",
        "formAccessSettings": "Mipangilio ya Ufikiaji wa Fomu"
      }
    },
    "action": {
      "delete": "Futa Fomu hii"
    },
    "alert": {
      "delete": "Fomu \"{name}\" ilifutwa."
    }
  },
  "zh-Hant": {
    "state": {
      "title": "表單狀態",
      "body": {
        "full": "若要設定此表單的狀態，請存取專案 {formAccessSettings}。",
        "formAccessSettings": "表單存取設定"
      }
    },
    "action": {
      "delete": "刪除此表單"
    },
    "alert": {
      "delete": "表單「{name}」已刪除。"
    }
  }
}
</i18n>
