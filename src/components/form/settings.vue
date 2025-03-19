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
        <div class="panel panel-simple panel-web-forms">
          <div class="panel-heading">
            <h1 class="panel-title">
              <span class="badge beta">
                {{ $t('common.beta') }}
              </span>
              {{ $t('webFormsSetting.webForms') }}
            </h1>
          </div>
          <div class="panel-body">
            <i18n-t tag="p" keypath="webFormsSetting.description">
              <template #formName>
                <strong>{{ form.nameOrId }}</strong>
              </template>
            </i18n-t>
            <form id="dataset-settings-form">
              <div class="radio">
                <label>
                  <input v-model="webformsEnabled" name="webformsEnabled" type="radio" :value="false"
                    aria-describedby="dataset-setting-on-receipt" :disabled="form.awaitingResponse" @change="showConfirmation()">
                  {{ $t('webFormsSetting.enketoDefault') }}
                </label>
              </div>
              <div class="radio">
                <label>
                  <input v-model="webformsEnabled" name="webformsEnabled" type="radio" :value="true"
                    aria-describedby="dataset-setting-on-approval" :disabled="form.awaitingResponse" @change="showConfirmation()">
                  ODK Web Forms
                </label>
              </div>
            </form>
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
    <!-- TODO: for ODK Web Forms, we need to show modal with an image. Reuse "what's new" modal,
          once it is done in getodk/central#801 -->
    <confirmation v-bind="confirm" @hide="hideAndReset" @success="setWebformsEnabled">
      <template v-if="webformsEnabled" #body>
        <p>
          {{ $t('webFormsSetting.webformsConfirmation.intro') }}
        </p>
        <i18n-t tag="p" keypath="webFormsSetting.webformsConfirmation.description.full">
          <template #seeSupportedFeatures>
            <a href="https://github.com/getodk/web-forms?tab=readme-ov-file#feature-matrix" target="_blank">{{ $t('webFormsSetting.webformsConfirmation.description.seeSupportedFeatures') }}</a>
          </template>
          <template #previewYourForm>
            <router-link :to="previewPath" target="_blank">
              {{ $t('webFormsSetting.webformsConfirmation.description.previewYourForm') }}
            </router-link>
          </template>
        </i18n-t>
      </template>
      <template v-else #body>
        <p>
          {{ $t('webFormsSetting.enketoConfirmation.description') }}
        </p>
      </template>
    </confirmation>
  </div>
</template>

<script setup>
import { inject, computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import FormDelete from './delete.vue';
import Confirmation from '../confirmation.vue';

import useRoutes from '../../composables/routes';
import { modalData } from '../../util/reactivity';
import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';

defineOptions({
  name: 'FormSettings'
});

const alert = inject('alert');

const { t } = useI18n();
const router = useRouter();
const { form } = useRequestData();
const { projectPath, formPath } = useRoutes();

const deleteModal = modalData();

const afterDelete = () => {
  const message = t('alert.delete', { name: form.nameOrId });
  router.push(projectPath())
    .then(() => { alert.success(message); });
};

const webformsEnabled = ref(form.webformsEnabled);
watch(() => form.dataExists, () => {
  webformsEnabled.value = form.webformsEnabled;
});

const previewPath = computed(() => formPath(
  form.projectId,
  form.xmlFormId,
  'preview'
));

const confirmModalState = ref(false);

const confirm = computed(() => {
  const result = {
    state: confirmModalState.value,
    noText: t('action.cancel'),
    awaitingResponse: form.awaitingResponse
  };
  if (webformsEnabled.value) {
    result.title = 'ODK Web Forms';
    result.yesText = t('webFormsSetting.webformsConfirmation.useOdkWebForms');
  } else {
    result.title = 'Enketo';
    result.yesText = t('webFormsSetting.enketoConfirmation.useEnketo');
  }
  return result;
});

const showConfirmation = () => {
  confirmModalState.value = true;
};

const hideAndReset = () => {
  webformsEnabled.value = form.webformsEnabled;
  confirmModalState.value = false;
};

const setWebformsEnabled = () => {
  form.request({
    method: 'PATCH',
    url: apiPaths.form(form.projectId, form.xmlFormId),
    data: { webformsEnabled: webformsEnabled.value },
    patch: ({ data }) => {
      form.updatedAt = data.updatedAt;
      form.webformsEnabled = data.webformsEnabled;
    }
  })
    .catch(() => {
      webformsEnabled.value = form.webformsEnabled;
    })
    .finally(() => {
      confirmModalState.value = false;
    });
};
</script>

<style lang="scss">
@import '../../assets/scss/_variables.scss';

#form-settings {
  .panel-simple-danger .panel-body p {
    margin-bottom: 15px;
    margin-top: 10px;
    text-align: center;
  }
  .panel-web-forms {
    .panel-body > p {
      margin-bottom: 20px;
    }
    .beta {
      text-transform: uppercase;
      background: #F1DEE7;
      padding: 5px 10px;
      color: $color-accent-primary;
      font-family: Helvetica;
      font-weight: 400;
      vertical-align: baseline;
    }
    .radio {
      min-height: 48px;
      margin-bottom: 0;
      label {
        cursor: pointer;
        padding-left: 30px;
      }
    }
  }
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
    },
    "webFormsSetting": {
      // Title of a section on Forms settings page, that allows users to opt-in for ODK Web Forms
      "webForms": "Web Forms",
      // Description of a section. {formName} is replaced with the name of the Form
      "description": "Fill out, preview and edit your “{formName}“ Form using",
      // The word "Enketo" should not be translated
      "enketoDefault": "Enketo (default)",
      "webformsConfirmation": {
        // The words "ODK Web Forms" should not be translated
        "useOdkWebForms": "Use ODK Web Forms",
        "intro": "We’re building a new web-forms experience designed to be fast and user-friendly!",
        "description": {
          "full": "Some functionality might be lost; {seeSupportedFeatures} for details and {previewYourForm} before opting in.",
          "seeSupportedFeatures": "see supported features",
          "previewYourForm": "preview your form"
        }
      },
      "enketoConfirmation": {
        // The words "Enketo" and "ODK Web Forms" should not be translated
        "description": "Are you sure you want to switch from ODK Web Forms to Enketo?",
        // The word "Enketo" should not be translated
        "useEnketo": "Use Enketo"
      }
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
