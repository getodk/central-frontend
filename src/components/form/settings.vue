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
            <form id="web-form-settings-form">
              <div class="radio">
                <label>
                  <input v-model="webformsEnabled" name="webformsEnabled" type="radio" :value="false"
                    @change="confirmationModal.show({ webformsEnabled: false })">
                  {{ $t('webFormsSetting.enketoDefault') }}
                </label>
              </div>
              <div class="radio">
                <label>
                  <input v-model="webformsEnabled" name="webformsEnabled" type="radio" :value="true"
                    @change="confirmationModal.show({ webformsEnabled: true })">
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
    <form-web-forms-settings-confirmation v-bind="confirmationModal" @hide="hideAndReset" @success="afterSettingChanged"/>
  </div>
</template>

<script setup>
import { inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import FormDelete from './delete.vue';
import FormWebFormsSettingsConfirmation from './web-forms-settings-confirmation.vue';

import useRoutes from '../../composables/routes';
import { modalData } from '../../util/reactivity';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'FormSettings'
});

const alert = inject('alert');
const toast = inject('toast');

const { t } = useI18n();
const router = useRouter();
const { form } = useRequestData();
const { projectPath } = useRoutes();

const deleteModal = modalData();
const confirmationModal = modalData();

const afterDelete = () => {
  const message = t('alert.delete', { name: form.nameOrId });
  router.push(projectPath())
    .then(() => { alert.success(message); });
};


const webformsEnabled = ref(form.webformsEnabled);
watch(() => form.dataExists, () => {
  webformsEnabled.value = form.webformsEnabled;
});

const afterSettingChanged = () => {
  const message = webformsEnabled.value
    ? t('webFormsSetting.owfSelected', { formName: form.nameOrId })
    : t('webFormsSetting.enketoSelected', { formName: form.nameOrId });
  toast.show(message);
  confirmationModal.hide();
};

const hideAndReset = () => {
  webformsEnabled.value = form.webformsEnabled;
  confirmationModal.hide();
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
      "delete": "The Form “{name}” has been successfully deleted."
    },
    "webFormsSetting": {
      // Title of a section on Forms settings page, that allows users to opt-in for ODK Web Forms
      "webForms": "Web Forms",
      // Description of a section. {formName} is replaced with the name of the Form
      "description": "Fill out, preview and edit your “{formName}” Form using",
      // The word "Enketo" should not be translated
      "enketoDefault": "Enketo (default)",
      // Success message when Enketo is selected as web form technology. {formName} is replaced with the name of the Form
      "enketoSelected": "You’re now using Enketo to fill out, preview and edit your “{formName}” form.",
      // Success message when ODK Web Forms is selected as web form technology. {formName} is replaced with the name of the Form
      "owfSelected": "You’re now using ODK Web Forms to fill out, preview and edit your “{formName}” form."
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
      "delete": "Das Formular \"{name}\" wurde erfolgreich gelöscht."
    },
    "webFormsSetting": {
      "webForms": "Web-Formulare",
      "description": "Ausfüllen, anschauen und bearbeiten des Formulars \"{formName}\" mit",
      "enketoDefault": "Enketo (default)",
      "enketoSelected": "Sie verwenden jetzt Enketo, um Ihr Formular \"{formName}“ auszufüllen, in der Vorschau anzuzeigen und zu bearbeiten.",
      "owfSelected": "Sie verwenden jetzt ODK Web Forms, um Ihr Formular \"{formName}“ auszufüllen, in der Vorschau anzuzeigen und zu bearbeiten."
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
      "delete": "El formulario {name} fue eliminado correctamente."
    },
    "webFormsSetting": {
      "webForms": "Formularios web",
      "description": "Rellene, previsualice y edite su Formulario “{formName}” utilizando",
      "enketoDefault": "Enketo (default)",
      "enketoSelected": "Ahora estás utilizando Enketo para rellenar, previsualizar y editar tu formulario \"{formName}\".",
      "owfSelected": "Ahora estás utilizando ODK Web Forms para rellenar, previsualizar y editar tu formulario \"{formName}\"."
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
      "delete": "Le formulaire \"{name}\" a été supprimé."
    },
    "webFormsSetting": {
      "webForms": "Web Forms",
      "description": "Remplissez, prévisualisez et éditez votre Formulaire \"{formName}\" en utilisant",
      "enketoDefault": "Enketo (par défaut)",
      "enketoSelected": "Vous utilisez maintenant Enketo pour remplir, prévisualiser et éditer votre formulaire \"{formName}\".",
      "owfSelected": "Vous utilisez maintenant ODK Web Forms pour remplir, prévisualiser et éditer votre formulaire \"{formName}\"."
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
      "delete": "Il formulario “{name}” è stato eliminato con successo."
    },
    "webFormsSetting": {
      "webForms": "Formulari Web",
      "description": "Compilate, visualizzate in anteprima e modificate il vostro “{formName}” Formulario usando",
      "enketoDefault": "Enketo (default)",
      "enketoSelected": "Ora stai utilizzando Enketo per compilare, visualizzare in anteprima e modificare il tuo formulario “{formName}\".",
      "owfSelected": "Ora stai utilizzando ODK Web Forms per compilare, visualizzare in anteprima e modificare il tuo formulario “{formName}\"."
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
    }
  },
  "pt": {
    "state": {
      "title": "Status do formulário",
      "body": {
        "full": "Para definir o status desse formulário, visite as {formAccessSettings} aos formulários do projeto.",
        "formAccessSettings": "Configurações de acesso ao formulário"
      }
    },
    "action": {
      "delete": "Excluir esse formulário"
    },
    "webFormsSetting": {
      "webForms": "Web Forms",
      "enketoDefault": "Enketo (padrão)"
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
    }
  },
  "zh": {
    "state": {
      "title": "表单状态",
      "body": {
        "full": "请前往项目{formAccessSettings}以调整此表单状态。",
        "formAccessSettings": "表单访问设置"
      }
    },
    "action": {
      "delete": "删除此表单"
    },
    "alert": {
      "delete": "表单“{name}”已成功删除。"
    },
    "webFormsSetting": {
      "webForms": "Web表单",
      "description": "填写、预览和编辑您的“{formName}”表单，请使用",
      "enketoDefault": "Enketo（默认）",
      "enketoSelected": "您当前正在使用Enketo填写、预览和编辑“{formName}”表单。",
      "owfSelected": "您当前正在使用ODK Web表单填写、预览和编辑“{formName}”表单。"
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
      "delete": "表單 「{name}」 已成功刪除。"
    },
    "webFormsSetting": {
      "webForms": "網頁表單",
      "description": "使用以下功能填寫、預覽和編輯您的表單 「{formName}」",
      "enketoDefault": "Enketo (預設)",
      "enketoSelected": "您目前正在使用 Enketo 填寫、預覽及編輯「{formName}」表單。",
      "owfSelected": "您目前正在使用 ODK 網頁表單填寫、預覽及編輯「{formName}」表單。"
    }
  }
}
</i18n>
