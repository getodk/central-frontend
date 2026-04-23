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
  <modal id="field-key-new" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="hideOrComplete" @shown="focusInput">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <template v-if="step === 0">
        <p class="modal-introduction">{{ $t('introduction[0]') }}</p>
        <form @submit.prevent="submit">
          <form-group ref="displayName" v-model.trim="displayName"
            :placeholder="$t('field.displayName')" required autocomplete="off"/>
          <div class="modal-actions">
            <button type="button" class="btn btn-link"
              :aria-disabled="awaitingResponse" @click="hideOrComplete">
              {{ $t('action.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary"
              :aria-disabled="awaitingResponse">
              {{ $t('action.create') }} <spinner :state="awaitingResponse"/>
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <div class="modal-introduction">
          <div id="field-key-new-success">
            <span class="icon-check-circle"></span>
            <p>
              <strong>{{ $t('common.success') }}</strong>
              <sentence-separator/>
              <span>{{ $t('success[0]', created) }}</span>
            </p>
          </div>
          <field-key-qr-panel :field-key="created" :managed="managed" :show-close="false"/>
          <p>{{ $t('success[1]', created) }}</p>
          <i18n-t tag="p" keypath="success[2].full">
            <template #formAccessSettings>
              <router-link v-slot="{ href, navigate }"
                :to="projectPath('form-access')" custom>
                <a :href="href" @click="navigateToFormAccess(navigate, $event)">{{ $t('success[2].formAccessSettings') }}</a>
              </router-link>
            </template>
          </i18n-t>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-link" @click="createAnother">
            {{ $t('action.createAnother') }}
          </button>
          <button type="button" class="btn btn-primary" @click="complete">
            {{ $t('action.done') }}
          </button>
        </div>
      </template>
    </template>
  </modal>
</template>

<script>
import FormGroup from '../form-group.vue';
import Spinner from '../spinner.vue';
import Modal from '../modal.vue';
import FieldKeyQrPanel from './qr-panel.vue';
import SentenceSeparator from '../sentence-separator.vue';

import useRequest from '../../composables/request';
import useRoutes from '../../composables/routes';
import { afterNextNavigation } from '../../util/router';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FieldKeyNew',
  components: { FormGroup, Spinner, Modal, FieldKeyQrPanel, SentenceSeparator },
  inject: ['redAlert'],
  props: {
    state: {
      type: Boolean,
      default: false
    },
    managed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hide', 'success'],
  setup() {
    // The modal assumes that this data will exist when the modal is shown.
    const { project, fieldKeys } = useRequestData();
    const { request, awaitingResponse } = useRequest();
    const { projectPath } = useRoutes();
    return { project, fieldKeys, request, awaitingResponse, projectPath };
  },
  data() {
    return {
      // There are two steps/screens in the app user creation process. `step`
      // indicates the current step.
      step: 0,
      displayName: '',
      created: null
    };
  },
  watch: {
    state(state) {
      if (!state) {
        this.step = 0;
        this.displayName = '';
        this.created = null;
      }
    }
  },
  methods: {
    focusInput() {
      this.$refs.displayName.focus();
    },
    submit() {
      this.request({
        method: 'POST',
        url: apiPaths.fieldKeys(this.project.id),
        data: { displayName: this.displayName }
      })
        .then(({ data }) => {
          // Reset the form.
          this.redAlert.hide();
          this.displayName = '';

          this.step = 1;
          this.created = data;
        })
        .catch(noop);
    },
    complete() {
      this.$emit('success', this.created);
    },
    hideOrComplete() {
      if (this.created == null)
        this.$emit('hide');
      else
        this.complete();
    },
    navigateToFormAccess(navigate, event) {
      afterNextNavigation(this.$router, () => {
        // Clear this.fieldKeys so that the Form Access tab will fetch it again.
        this.fieldKeys.data = null;
      });
      navigate(event);
    },
    createAnother() {
      this.step = 0;
      // We do not reset this.created, because it will still be used once the
      // modal is hidden.
      this.$nextTick(this.focusInput);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#field-key-new-success {
  display: flex;
  align-items: center;

  .icon-check-circle {
    color: $color-success;
    font-size: 32px;
    margin-right: 10px;
  }

  > p {
    width: 80%;
    margin-bottom: 0px;
  }

  + .field-key-qr-panel {
    margin: 15px auto 30px;
    box-shadow: $box-shadow-popover;
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Create App User",
    "introduction": [
      "This user will not have access to any Forms at first. You will be able to assign Forms after the user is created."
    ],
    "success": [
      "The App User “{displayName}” has been created.",
      // Clicking "See code" displays a QR code.
      "You can configure a mobile device for “{displayName}” right now, or you can do it later from the App Users table by clicking “See code.”",
      {
        "full": "You may wish to visit this Project’s {formAccessSettings} to give this user access to Forms.",
        "formAccessSettings": "Form Access settings"
      }
    ],
    "action": {
      // This is the text of a button that is used to create another App User.
      "createAnother": "Create another"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Vytvořit uživatele aplikace",
    "introduction": [
      "Tento uživatel nebude mít nejprve přístup k žádným formulářům. Po vytvoření uživatele budete moci přiřadit formuláře."
    ],
    "success": [
      "Uživatel aplikace “{displayName}” byl vytvořen.",
      "Mobilní zařízení pro “{displayName}“ můžete nakonfigurovat právě teď, nebo to můžete udělat později z tabulky Uživatelé aplikace kliknutím na “Zobrazit kód“.",
      {
        "full": "Možná budete chtít navštívit toto {formAccessSettings} projektu a dát tomuto uživateli přístup k formulářům.",
        "formAccessSettings": "Nastavení přístupu k formuláři"
      }
    ],
    "action": {
      "createAnother": "Vytvořit jiného"
    }
  },
  "de": {
    "title": "App-Benutzer erstellen",
    "introduction": [
      "Der Benutzer hat zunächst keinen Zugriff auf Formulare. Sie können seinen Zugriff auf Formulare später erstellen."
    ],
    "success": [
      "Der App-Benutzer \"{displayName}\" ist erstellt worden.",
      "Sie können jetzt ein mobiles Gerät für \"{displayName}\" konfigurieren oder Sie können es später in der App-Benutzer-Tabelle durch Klick auf \"Code anzeigen.\"",
      {
        "full": "Sie können dem Benutzer jetzt auf der Seite {formAccessSettings} Zugriff zu den Formularen geben.",
        "formAccessSettings": "Einstellungen Formular-Zugriff"
      }
    ],
    "action": {
      "createAnother": "Noch einen erstellen"
    }
  },
  "es": {
    "title": "Crear usuario móvil",
    "introduction": [
      "Este usuario no tendrá acceso a ningún formulario al principio. Podrá asignar formularios después de crear el usuario."
    ],
    "success": [
      "Se ha creado el usuario móvil {displayName}",
      "Puede configurar un dispositivo móvil para \"{displayName}\" ahora mismo, o puede hacerlo más tarde desde la tabla de Usuarios móviles de la aplicación haciendo clic en \"Ver código\".",
      {
        "full": "Es posible que desee visitar la {formAccessSettings} de este proyecto para dar acceso a este usuario a los formularios.",
        "formAccessSettings": "Configuración de acceso a Formulario"
      }
    ],
    "action": {
      "createAnother": "Crear otro"
    }
  },
  "fr": {
    "title": "Créer un utilisateur mobile",
    "introduction": [
      "Cet utilisateur n'aura accès à aucun formulaire dans un premier temps. Vous pourrez lui en assigner quand il aura été créé."
    ],
    "success": [
      "L'utilisateur mobile “{displayName}” a été créé.",
      "Vous pouvez configurer un appareil mobile pour “{displayName}” dés maintenant, ou vous pouvez le faire plus tard depuis le tableau des \"Utilisateurs mobiles\" en cliquant sur \"Voir le code\".",
      {
        "full": "Vous pourriez vouloir visiter les {formAccessSettings} de ce projet pour donner accès aux formulaires à cet utilisateur.",
        "formAccessSettings": "Paramètres d'accès aux formulaires"
      }
    ],
    "action": {
      "createAnother": "En créer un autre"
    }
  },
  "id": {
    "title": "Buat Pengguna Aplikasi",
    "introduction": [
      "Pengguna ini belum bisa mengakses formulir apapun. Anda bisa membagikan formulir setelah akun Pengguna dibuat."
    ],
    "success": [
      "Pengguna Aplikasi \"{displayName}\" telah dibuat.",
      "Kamu bisa mengkonfigurasi peranti seluler untuk “{displayName}” saat ini juga, atau bisa lain waktu melalui tabel Pengguna Apl dengan mengklik “Lihat kode.”",
      {
        "full": "Anda mungkin ingin mengunjungi {formAccessSettings} proyek ini untuk memberikan Pengguna ini akses formulir.",
        "formAccessSettings": "pengaturan Akses Formulir"
      }
    ],
    "action": {
      "createAnother": "Buat baru"
    }
  },
  "it": {
    "title": "Crea un Utente App",
    "introduction": [
      "Inizialmente questo utente non avrà accesso ad alcun formulario. Potrai assegnare i formulari solo dopo la creazione dell'utente."
    ],
    "success": [
      "L'Utente App \"{displayName}\" è stato creato.",
      "Puoi configurare un dispositivo mobile per \"{displayName}\" in questo momento, oppure puoi farlo in un secondo momento dalla tabella Utenti App facendo clic su \"Vedi codice\".",
      {
        "full": "Potresti voler visitare questo progetto {formAccessSettings} per dare a questo utente l'accesso ai formulari.",
        "formAccessSettings": "Configurazioni di accesso al form"
      }
    ],
    "action": {
      "createAnother": "Creare un altro"
    }
  },
  "ja": {
    "title": "アプリユーザーの作成",
    "introduction": [
      "作成されるユーザーは、初期状態ではいずれのフォームにもアクセスできません。ユーザー作成後に、フォームを割り当てることができます。"
    ],
    "success": [
      "アプリユーザー\"{displayName}\"が、作成されました。",
      "「{displayName}」に対するモバイル端末を今すぐ設定できます。もしくは、アプリユーザーの一覧から「QRコードを表示」をクリックすることで後で設定も可能です。",
      {
        "full": "このプロジェクトの\"{formAccessSettings}\"にて、フォームに対するユーザーのアクセス権限を付与できます。",
        "formAccessSettings": "フォームアクセスの設定"
      }
    ],
    "action": {
      "createAnother": "別のものを作成"
    }
  },
  "pt": {
    "title": "Criar usuário de aplicativo",
    "introduction": [
      "Esse usuário não terá acesso a nenhum formulário inicialmente. Você poderá atribuir acesso a formulários após a criação do usuário."
    ],
    "success": [
      "O usuário de aplicativo \"{displayName}\" foi criado.",
      "Você pode configurar um dispositivo móvel para \"{displayName}\" agora, ou você pode fazer isso mais tarde clicando na opção \"Exibir código\" da tabela de usuários de aplicativo.",
      {
        "full": "Você pode querer visitar a página de {formAccessSettings} desse projeto para dar acesso a formulários para esse usuário.",
        "formAccessSettings": "Configurações de acesso ao formulário"
      }
    ],
    "action": {
      "createAnother": "Criar outro"
    }
  },
  "sw": {
    "title": "Unda Mtumiaji wa Programu",
    "introduction": [
      "Mtumiaji huyu hatakuwa na ufikiaji wa Fomu zozote mwanzoni. Utaweza kukabidhi Fomu baada ya mtumiaji kuunda."
    ],
    "success": [
      "Mtumiaji wa Programu \"{displayName}\" ameundwa.",
      "Unaweza kusanidi kifaa cha mkononi kwa ajili ya \"{displayName}\" sasa hivi, au unaweza kuifanya baadaye kwenye jedwali la Watumiaji wa Programu kwa kubofya \"Angalia nambari ya kuthibitisha.\"",
      {
        "full": "Unaweza kutaka kutembelea {formAccessSettings} za Mradi huu ili kumpa mtumiaji huyu idhini ya kufikia Fomu.",
        "formAccessSettings": "Mipangilio ya Ufikiaji wa Fomu"
      }
    ],
    "action": {
      "createAnother": "Unda nyingine"
    }
  },
  "zh": {
    "title": "新建App用户",
    "introduction": [
      "此用户最初将没有访问任何表单的权限。您能够在用户建立后分配权限。"
    ],
    "success": [
      "App用户“{displayName}”已建立。",
      "您可以立即为“{displayName}”配置移动设备，也可以稍后通过在“App用户”表格中点击“查看代码”来完成配置。",
      {
        "full": "您可能需要访问此项目的{formAccessSettings}，以便为该用户设置表单访问权限。",
        "formAccessSettings": "表单权限设置"
      }
    ],
    "action": {
      "createAnother": "新建另一个"
    }
  },
  "zh-Hant": {
    "title": "建立App使用者",
    "introduction": [
      "使用者剛開始無存取任何表單的權限。建立使用者後，您才能夠分配表單權限。"
    ],
    "success": [
      "APP使用者「{displayName}」已建立。",
      "您可以立即為「{displayName}」設定行動裝置，也可以稍後透過點選「檢視代碼」從APP使用者表格中進行設定。",
      {
        "full": "您可能想要存取此專案的 {formAccessSettings} 以授予此使用者對表單的存取權限。",
        "formAccessSettings": "表格存取設定"
      }
    ],
    "action": {
      "createAnother": "建立另一個"
    }
  }
}
</i18n>
