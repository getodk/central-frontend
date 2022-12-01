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
            <button type="submit" class="btn btn-primary"
              :disabled="awaitingResponse">
              {{ $t('action.create') }} <spinner :state="awaitingResponse"/>
            </button>
            <button type="button" class="btn btn-link"
              :disabled="awaitingResponse" @click="hideOrComplete">
              {{ $t('action.cancel') }}
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <div id="field-key-new-success" class="modal-introduction">
          <p>
            <span class="icon-check-circle"></span>
            <strong>{{ $t('common.success') }}</strong>
            <sentence-separator/>
            <span>{{ $t('success[0]', created) }}</span>
          </p>
          <field-key-qr-panel :field-key="created" :managed="managed"/>
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
          <button type="button" class="btn btn-primary" @click="complete">
            {{ $t('action.done') }}
          </button>
          <button type="button" class="btn btn-link" @click="createAnother">
            {{ $t('action.createAnother') }}
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

import request from '../../mixins/request';
import routes from '../../mixins/routes';
import { afterNextNavigation } from '../../util/router';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FieldKeyNew',
  components: { FormGroup, Spinner, Modal, FieldKeyQrPanel, SentenceSeparator },
  mixins: [request(), routes()],
  inject: ['alert'],
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
    return { project, fieldKeys };
  },
  data() {
    return {
      awaitingResponse: false,
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
          this.alert.blank();
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
  .icon-check-circle {
    color: $color-success;
    font-size: 32px;
    margin-right: 6px;
    vertical-align: middle;
  }

  .field-key-qr-panel {
    box-shadow: $box-shadow-popover;
    margin: 15px auto 30px;
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
  }
}
</i18n>
