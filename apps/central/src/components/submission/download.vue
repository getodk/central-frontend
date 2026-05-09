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
  <modal :state="state" hideable :size="managedKey == null ? 'normal' : 'large'"
    backdrop @hide="$emit('hide')"
    @shown="$refs.form.querySelector('input:not([disabled])').focus()">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div id="submission-download-container">
        <form ref="form" @submit.prevent>
          <p id="submission-download-options-title">
            {{ $t('exportOptions') }}
          </p>
          <div class="checkbox"
            :class="{ disabled: splitSelectMultiplesDescription != null }">
            <label v-tooltip.sr-only>
              <input v-model="splitSelectMultiples" type="checkbox"
                :disabled="splitSelectMultiplesDescription != null"
                :aria-describedby="splitSelectMultiplesDescribedBy">
              {{ $t('field.splitSelectMultiples') }}
            </label>
            <p v-if="splitSelectMultiplesDescription != null"
              id="submission-download-split-select-multiples-disabled"
              class="sr-only">
              {{ splitSelectMultiplesDescription }}
            </p>
          </div>
          <div class="checkbox">
            <label>
              <input v-model="removeGroupNames" type="checkbox">
              {{ $t('field.removeGroupNames') }}
            </label>
          </div>
          <div class="checkbox" :class="{ disabled: deletedFieldsDisabled }">
            <label v-tooltip.sr-only>
              <input v-model="deletedFields" type="checkbox"
                :disabled="deletedFieldsDisabled"
                :aria-describedby="deletedFieldsDescribedBy">
              {{ $t('field.deletedFields') }}
            </label>
            <p v-if="deletedFieldsDisabled"
              id="submission-download-deleted-fields-disabled" class="sr-only">
              {{ $t('deletedFieldsDisabledForDraft') }}
            </p>
            <p id="submission-download-deleted-fields-help" class="help-block">
              {{ $t('deletedFieldsHelp') }}
            </p>
          </div>
          <template v-if="managedKey != null">
            <p id="submission-download-passphrase-help"
              class="modal-introduction">
              {{ $t('introduction[0]') }}
            </p>
            <form-group v-model="passphrase" type="password"
              :placeholder="$t('field.passphrase')" required
              autocomplete="off"/>
            <p v-if="managedKey.hint != null"
              id="submission-download-passphrase-hint"
              class="modal-introduction">
              {{ $t('hint', managedKey) }}
            </p>
          </template>
        </form>
        <div id="submission-download-divider"></div>
        <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
        <div id="submission-download-actions" @click="download">
          <div class="submission-download-action">
            <span class="submission-download-action-label">
              <span class="icon-file-o"></span>{{ $t('action.download.mainTable') }}
            </span>
            <div>
              <a :href="href('.csv')" class="btn btn-primary">
                <span class="icon-download"></span>.csv
              </a>
            </div>
          </div>
          <div class="submission-download-action"
            :class="{ disabled: noRepeat }">
            <span class="submission-download-action-label">
              <span class="icon-files-o"></span>{{ $t('action.download.allTables') }}
            </span>
            <div>
              <a :href="href('.csv.zip', { attachments: false })"
                class="btn btn-primary" :class="{ disabled: noRepeat }"
                v-tooltip.aria-describedby="noRepeat ? $t('noRepeat') : null">
                <span class="icon-download"></span>.zip
              </a>
            </div>
          </div>
          <div class="submission-download-action">
            <span class="submission-download-action-label">
              <span class="icon-image"></span>{{ $t('action.download.withAttachments') }}
            </span>
            <div>
              <a :href="href('.csv.zip')" class="btn btn-primary">
                <span class="icon-download"></span>.zip
              </a>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
      <!-- We specify a Frontend page for src so that any cookies are sent when
      the iframe form is submitted. -->
      <!-- eslint-disable-next-line vuejs-accessibility/iframe-has-title -->
      <iframe v-show="false" ref="iframe" src="/blank.html"></iframe>
    </template>
  </modal>
</template>

<script>
import FormGroup from '../form-group.vue';
import Modal from '../modal.vue';

import useCallWait from '../../composables/call-wait';
import { apiPaths, isProblem } from '../../util/request';
import { useRequestData } from '../../request-data';
import { getCookieValue } from '../../util/util';

export default {
  name: 'SubmissionDownload',
  components: { FormGroup, Modal },
  inject: ['toast', 'redAlert', 'logger'],
  props: {
    state: Boolean,
    formVersion: Object,
    odataFilter: String
  },
  emits: ['hide'],
  setup() {
    const { session, keys, fields } = useRequestData();
    const { callWait, cancelCall } = useCallWait();
    return { session, keys, fields, callWait, cancelCall };
  },
  data() {
    return {
      splitSelectMultiples: false,
      removeGroupNames: false,
      deletedFields: false,
      passphrase: ''
    };
  },
  computed: {
    // At the moment, there can only be a single managed key at most: once
    // encrypted, a project cannot be decrypted.
    managedKey() {
      return this.keys.dataExists ? this.keys.find(key => key.managed) : null;
    },
    splitSelectMultiplesDescription() {
      if (this.fields.dataExists &&
        !this.fields.some(({ selectMultiple }) => selectMultiple === true))
        return this.$t('noSelectMultiple');
      return this.formVersion.dataExists && this.formVersion.keyId != null
        ? this.$t('encryptedForm')
        : null;
    },
    splitSelectMultiplesDescribedBy() {
      return this.splitSelectMultiplesDescription != null
        ? 'submission-download-split-select-multiples-disabled'
        : null;
    },
    deletedFieldsDisabled() {
      return this.formVersion.dataExists && this.formVersion.publishedAt == null;
    },
    deletedFieldsDescribedBy() {
      const ids = ['submission-download-deleted-fields-help'];
      if (this.deletedFieldsDisabled)
        ids.push(['submission-download-deleted-fields-disabled']);
      return ids.join(' ');
    },
    noRepeat() {
      return this.fields.dataExists &&
        !this.fields.some(({ type }) => type === 'repeat');
    }
  },
  watch: {
    state(state) {
      if (!state) {
        // Reset the passphrase, but don't reset the other form fields. If the
        // user reopens the modal, they won't want to have to re-select all the
        // same options. Preserving the form fields is also needed for the
        // "Try again" link to work.
        this.passphrase = '';
      }
    },
    'toast.state': function toastState(state) {
      if (!state) this.cancelCall('checkForProblem');
    }
  },
  methods: {
    href(extension, query = undefined) {
      if (!this.formVersion.dataExists) return '#';
      const fullQuery = {
        ...query,
        $filter: this.odataFilter,
        splitSelectMultiples: this.splitSelectMultiples,
        groupPaths: !this.removeGroupNames,
        deletedFields: this.deletedFields
      };
      return apiPaths.submissions(
        this.formVersion.projectId,
        this.formVersion.xmlFormId,
        this.formVersion.publishedAt == null,
        extension,
        fullQuery
      );
    },
    /*
    submitIframeForm() empties the iframe body, appends a form to it, then
    submits the form. We place a form in an iframe for a few reasons:

      - We want to have the browser handle everything about the download, which
        means that we cannot use an AJAX request.
      - Our two options are an <a> element and a <form> element. We use a form
        so that we can send a POST request. If we wish to securely pass the
        passphrase to Backend, then assuming that wire security is not an issue,
        we still need to ensure that the passphrase is not stored in the user's
        browser history. A POST request allows us to accomplish that.
      - However, submitting a form outside an iframe would navigate away from
        Frontend, at least if a Problem is returned. Thus, we place the form
        inside an iframe. The iframe may change pages, but that won't affect the
        rest of Frontend.

    Note that because the iframe may change pages after the form is submitted
    (if a Problem is returned), we recreate the form each time we submit it.
    */
    submitIframeForm(action) {
      const doc = this.$refs.iframe.contentWindow.document;
      doc.body.innerHTML = '';
      const form = doc.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', action);
      doc.body.appendChild(form);

      const passphraseInput = doc.createElement('input');
      // This might not be necessary (not sure).
      passphraseInput.setAttribute('type', 'password');
      passphraseInput.setAttribute('name', this.managedKey.id.toString());
      passphraseInput.setAttribute('autocomplete', 'off');
      form.appendChild(passphraseInput);

      const csrf = doc.createElement('input');
      csrf.setAttribute('type', 'password');
      csrf.setAttribute('name', '__csrf');
      csrf.setAttribute('autocomplete', 'off');
      form.appendChild(csrf);

      passphraseInput.value = this.passphrase;
      csrf.value = getCookieValue('__csrf');
      form.submit();
      // Ensure that the inputs' values are no longer in the DOM.
      form.reset();
    },
    checkForProblem() {
      const doc = this.$refs.iframe.contentWindow.document;
      // If Backend returns a Problem, the iframe changes pages. However, if the
      // form submission is successful, it seems that the iframe does not change
      // pages, and the form remains on the page.
      if (doc.querySelector('form') != null || doc.body == null) return false;
      let problem;
      try {
        // Note that the Problem may be wrapped in another element, for example,
        // a <pre> element.
        problem = JSON.parse(doc.body.textContent);
      } catch (e) {
        this.logger.log(doc.body.textContent);
        this.redAlert.show(this.$t('alert.parseError'));
      }
      if (isProblem(problem)) this.redAlert.show(problem.message);
      return true;
    },
    decrypt(action) {
      // Return immediately if the iframe is still loading. It would probably be
      // better to wait for the iframe to load, then continue the process then,
      // but there would be edge cases to consider in implementing that. (For
      // example, what if the user submits the form, but then closes the modal
      // before the iframe finishes loading?)
      if (this.$refs.iframe.contentWindow.document.readyState === 'loading') {
        this.redAlert.show('alert.unavailable');
        return;
      }

      this.submitIframeForm(action);

      this.cancelCall('checkForProblem');
      this.callWait('checkForProblem', this.checkForProblem, (tries) =>
        (tries < 300 ? 1000 : null));
    },
    download(event) {
      // Return early if triggered from the "Try again" link.
      if (!this.state) return;

      const a = event.target.closest('a');
      if (a == null) return;

      // `true` if the click will go through and the download will be attempted;
      // `false` if the form is invalid.
      const willDownload = this.managedKey == null ||
        this.$refs.form.reportValidity();

      if (this.managedKey != null) {
        event.preventDefault();
        if (willDownload) this.decrypt(a.getAttribute('href'));
      }

      if (willDownload) {
        this.$emit('hide');

        const { cta } = this.toast.show(this.$t('alert.submit'), { autoHide: false });
        if (this.managedKey == null)
          cta(this.$t('action.tryAgain'), () => { a.click(); });
      }
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-download-container {
  display: flex;
  justify-content: space-between;
}
#submission-download-options-title { font-weight: bold; }
#submission-download-container form, #submission-download-actions {
  margin-bottom: 1px;
  margin-top: 5px;
}
.modal-dialog:not(.modal-lg) #submission-download-container form {
  max-width: 305px;
}
#submission-download-passphrase-help { margin-top: 21px; }
#submission-download-passphrase-hint { overflow-wrap: break-word; }
#submission-download-container form :last-child { margin-bottom: 0; }
#submission-download-divider {
  border-left: 1px solid $color-subpanel-border-strong;
  margin: -1px 18px -5px 18px;
}
$label-icon-max-width: 15px;
$actions-padding-left: $label-icon-max-width + $margin-right-icon;
#submission-download-actions {
  margin-right: 12px;
  padding-left: $actions-padding-left;
}
.submission-download-action-label {
  // Instead of wrapping the element in a <div> and setting the margin on that,
  // we set `display` to inline-block: that way, the cursor will be shown as
  // not-allowed only over the text.
  display: inline-block;
  font-weight: bold;
  margin-bottom: 3px;
  text-indent: -$actions-padding-left;

  [class^="icon-"] {
    display: inline-block;
    margin-right: $margin-right-icon;
    min-width: $label-icon-max-width;
    text-indent: 0;
  }

  .submission-download-action.disabled & {
    color: $color-input-inactive;
    cursor: not-allowed;
  }
}
.submission-download-action + .submission-download-action { margin-top: 12px; }
</style>

<i18n lang="json5">
{
  // @transifexKey component.SubmissionDecrypt
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Download Submissions",
    // This text is shown above options for downloading Submissions.
    "exportOptions": "Export options",
    "field": {
      "splitSelectMultiples": "Split “select multiple” choices into columns",
      "removeGroupNames": "Remove group names",
      "deletedFields": "Include fields not in the published Form"
    },
    "deletedFieldsHelp": "Use this option if you need to see fields referenced in previous Form versions.",
    "noSelectMultiple": "This Form does not have any select multiple fields.",
    "encryptedForm": "Encrypted Forms cannot be processed in this way.",
    "deletedFieldsDisabledForDraft": "Draft Forms cannot be processed in this way.",
    "introduction": [
      "In order to download this data, you will need to provide your passphrase. Your passphrase will be used only to decrypt your data for download, after which the server will forget it again."
    ],
    // This text is shown if there is a passphrase hint. {hint} is the
    // passphrase hint.
    "hint": "Hint: {hint}",
    // "Repeats" refers to repeat groups.
    "noRepeat": "This Form does not have repeats.",
    "action": {
      "download": {
        // This is the text of a button. "Repeats" refers to repeat groups.
        "mainTable": "Main data table (no repeats)",
        "allTables": "All data tables",
        // "Attachments" refers to Submission Attachments.
        "withAttachments": "All data and Attachments"
      }
    },
    "alert": {
      "unavailable": "The data download is not yet available. Please try again in a moment.",
      "submit": "Data download should begin soon. Once it begins, you can close this message. If it hasn’t started in 20 seconds, please try again.",
      "parseError": "Something went wrong while requesting your data."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Stáhnout příspěvky",
    "exportOptions": "Možnosti exportu",
    "field": {
      "splitSelectMultiples": "Rozdělení možností \"vybrat více\" do sloupců",
      "removeGroupNames": "Odstranění názvů skupin",
      "deletedFields": "Zahrnout pole, která nejsou ve zveřejněném formuláři"
    },
    "deletedFieldsHelp": "Tuto možnost použijte, pokud potřebujete zobrazit pole odkazovaná v předchozích verzích formuláře.",
    "noSelectMultiple": "Tento formulář nemá žádná pole pro výběr více položek.",
    "encryptedForm": "Šifrované formuláře nelze tímto způsobem zpracovávat.",
    "deletedFieldsDisabledForDraft": "Návrhy formulářů nelze tímto způsobem zpracovávat.",
    "introduction": [
      "Abyste mohli tato data stáhnout, budete muset zadat vaše přístupové heslo. Vaše přístupové heslo bude použito pouze k dešifrování vašich dat ke stažení, a poté ho server znovu zapomene."
    ],
    "hint": "Nápověda: {hint}",
    "noRepeat": "Tento formulář nemá opakování.",
    "action": {
      "download": {
        "mainTable": "Hlavní datová tabulka (bez opakování)",
        "allTables": "Všechny datové tabulky",
        "withAttachments": "Všechna data a přílohy"
      }
    },
    "alert": {
      "unavailable": "Data ke stažení zatím nejsou k dispozici. Zkuste to prosím za chvíli znovu.",
      "parseError": "Při vyžádání vašich dat se něco pokazilo."
    }
  },
  "de": {
    "title": "Übermittlungen downloaden",
    "exportOptions": "Exportoptionen",
    "field": {
      "splitSelectMultiples": "Unterteilen Sie „mehrere auswählen“-Optionen in Spalten",
      "removeGroupNames": "Gruppennamen entfernen",
      "deletedFields": "Felder einschließen, die nicht in der veröffentlichten Version des Formulars enthalten sind"
    },
    "deletedFieldsHelp": "Verwenden Sie diese Option, um Felder aus früheren Versionen des Formulars anzuzeigen.",
    "noSelectMultiple": "Dieses Formular enthält keine Mehrfachauswahlfelder.",
    "encryptedForm": "Verschlüsselte Formulare können auf diese Weise nicht verarbeitet werden.",
    "deletedFieldsDisabledForDraft": "Formularentwürfe können auf diese Weise nicht bearbeitet werden.",
    "introduction": [
      "Um die Daten herunterzuladen wird Ihre Passphrase benötigt. Diese wird nur zum Entschlüsseln der Daten für den Download benutzt und nicht gespeichert."
    ],
    "hint": "Hinweis: {hint}",
    "noRepeat": "Diese Form hat keine repeats.",
    "action": {
      "download": {
        "mainTable": "Hauptdatentabelle (keine repeats)",
        "allTables": "Alle Datentabellen",
        "withAttachments": "Alle Daten und Anhänge"
      }
    },
    "alert": {
      "unavailable": "Der Datendownload ist noch nicht verfügbar. Bitte versuchen Sie es gleich noch einmal.",
      "submit": "Ihr Daten-Download sollte bald beginnen. Sobald er beginnt, können Sie diese Box schliessen. Wenn er nach 20 Sekunden noch nicht begonnen hat, versuchen Sie es bitte erneut.",
      "parseError": "Beim Anfordern Ihrer Daten ist etwas nicht geklappt."
    }
  },
  "es": {
    "title": "Descargar datos enviados",
    "exportOptions": "Opciones de exportación",
    "field": {
      "splitSelectMultiples": "Divida las opciones de \"selección múltiple\" en columnas",
      "removeGroupNames": "Eliminar nombres de grupos",
      "deletedFields": "Incluir campos que no están en el Formulario publicado."
    },
    "deletedFieldsHelp": "Utilice esta opción si necesita ver los campos a los que se hace referencia en versiones anteriores del formulario.",
    "noSelectMultiple": "Este formulario no tiene ningún campo de selección múltiple.",
    "encryptedForm": "Los formularios cifrados no se pueden procesar de esta manera.",
    "deletedFieldsDisabledForDraft": "Los borradores no se pueden procesar de esta manera.",
    "introduction": [
      "Para descargar la información, usted necesitará ingresar su contraseña. Su contraseña se usará para desencriptar la información descargada, al finalizar el proceso el servidor la olvidará."
    ],
    "hint": "Pista: {hint}",
    "noRepeat": "Este formulario no tiene campos repetidos.",
    "action": {
      "download": {
        "mainTable": "Tabla de datos principal (sin repeticiones)",
        "allTables": "Todas las tablas de datos",
        "withAttachments": "Todos los datos y archivos adjuntos"
      }
    },
    "alert": {
      "unavailable": "La descarga de datos aún no está disponible. Vuelva a intentarlo en un momento.",
      "submit": "Su descarga de datos debería comenzar en breve. Una vez que inicie, puede cerrar este mensaje. Si no se ha comenzado en 20 segundos, por favor inténtelo nuevamente.",
      "parseError": "Algo salió mal al solicitar tus datos."
    }
  },
  "fr": {
    "title": "Télécharger les soumissions",
    "exportOptions": "Options d'exportation",
    "field": {
      "splitSelectMultiples": "Séparer le contenu des questions à choix multiples en plusieurs colonnes.",
      "removeGroupNames": "Supprimer les noms de groupe",
      "deletedFields": "Inclut les champs qui ne sont pas dans le formulaire publié"
    },
    "deletedFieldsHelp": "Utilisez cette option si vous avez besoin de champs référencés dans les versions précédentes du formulaire",
    "noSelectMultiple": "Ce formulaire ne contient aucun champ à choix multiples (de type \"select_multiple\").",
    "encryptedForm": "Les formulaires chiffrés ne peuvent être traités de cette manière.",
    "deletedFieldsDisabledForDraft": "Les ébauches de formulaires ne peuvent être utilisées comme cela.",
    "introduction": [
      "Pour télécharger ces données, vous devrez fournir votre phrase secrète. Votre phrase secrète sera utilisée uniquement pour déchiffrer vos données pour le téléchargement, après quoi le serveur l'oubliera à nouveau"
    ],
    "hint": "Indice : {hint}",
    "noRepeat": "Ce formulaire ne contient pas de structures \"repeat\"",
    "action": {
      "download": {
        "mainTable": "Principale table de données (sans \"repeats\")",
        "allTables": "Toutes les tables de données",
        "withAttachments": "Toutes données et fichiers joints"
      }
    },
    "alert": {
      "unavailable": "Le téléchargement des données n'est pas encore disponible. Merci de réessayer dans un moment.",
      "submit": "Le téléchargement de vos données devrait commencer bientôt. Une fois qu'il aura commencé, vous pourrez fermer ce message. Si vous avez attendu et le téléchargement n'a pas commencé, veuillez réessayer.",
      "parseError": "Quelque chose s'est mal passé pendant la requête de vos données"
    }
  },
  "id": {
    "exportOptions": "Opsi Ekspor",
    "introduction": [
      "Untuk mengunduh data ini, Anda harus menyediakan frasa sandi. Frasa sandi hanya akan digunakan untuk mendekripsi data anda untuk diunduh, dan akan terhapus dari server setelahnya."
    ],
    "hint": "Petunjuk: {hint}",
    "noRepeat": "Formulir ini tidak memiliki pengulangan.",
    "action": {
      "download": {
        "mainTable": "Tabel data utama (tanpa pengulangan)"
      }
    }
  },
  "it": {
    "title": "Scarica invii",
    "exportOptions": "Opzioni di esportazione",
    "field": {
      "splitSelectMultiples": "Dividi le scelte \"select multiple\" in colonne",
      "removeGroupNames": "Rimuovi i nomi dei gruppi",
      "deletedFields": "Includere i campi non nel formulario pubblicato"
    },
    "deletedFieldsHelp": "Utilizzare questa opzione se è necessario visualizzare i campi a cui si fa riferimento nelle versioni precedenti del formulario.",
    "noSelectMultiple": "Questo formulario non ha campi a scelta multipla selezionati.",
    "encryptedForm": "I moduli crittografati non possono essere elaborati in questo modo.",
    "deletedFieldsDisabledForDraft": "Le bozze non possono essere elaborate in questo modo.",
    "introduction": [
      "Per scaricare questi dati, dovrai fornire la tua passphrase. La tua passphrase verrà utilizzata solo per decifrare i tuoi dati per il download, dopodiché il server la cancellerà."
    ],
    "hint": "Suggerimento: {hint}",
    "noRepeat": "Questo formulario non ha repeats.",
    "action": {
      "download": {
        "mainTable": "Tabella dati principale (no repeats)",
        "allTables": "Tutte le tabelle di dati",
        "withAttachments": "Tutti i dati e gli allegati"
      }
    },
    "alert": {
      "unavailable": "Il download dei dati non è ancora disponibile. Si prega di riprovare in un altro momento.",
      "submit": "Il download dei dati dovrebbe iniziare a breve. Una volta iniziato, puoi chiudere questo messaggio. Se non è iniziato in 20 secondi, riprova.",
      "parseError": "Qualcosa è andato storto durante la richiesta dei tuoi dati"
    }
  },
  "ja": {
    "title": "提出済フォームをダウンロードする",
    "exportOptions": "エクスポート設定",
    "field": {
      "splitSelectMultiples": "複数選択項目を列に切り分ける。",
      "removeGroupNames": "グループ名を取り除く"
    },
    "noSelectMultiple": "このフォームには複数選択項目がありません。",
    "encryptedForm": "この方法でフォームの暗号化は行えません。",
    "deletedFieldsDisabledForDraft": "この方法で下書きの処理は行えません。",
    "introduction": [
      "このデータをダウンロードするためには、パスフレーズを入力する必要があります。パスフレーズは、データをダウンロードする際の復号時にのみ使用され、その後、サーバーはパスフレーズを保持しません。"
    ],
    "hint": "ヒント：{hint}",
    "noRepeat": "このフォームはリピート項目がありません。",
    "action": {
      "download": {
        "mainTable": "主なデータ（リピートを含まない）",
        "allTables": "全てのデータ"
      }
    },
    "alert": {
      "unavailable": "データのダウンロードはまだ利用できません。しばらく待って、再試行してください。"
    }
  },
  "pt": {
    "title": "Baixar Respostas",
    "exportOptions": "Opções de exportação",
    "field": {
      "splitSelectMultiples": "Dividir opções de “selecionar várias” em colunas",
      "removeGroupNames": "Remover nomes de grupos",
      "deletedFields": "Incluir campos que não estão no Formulário publicado"
    },
    "deletedFieldsHelp": "Use esta opção se precisar ver campos referenciados em versões anteriores do Formulário.",
    "noSelectMultiple": "Este Formulário não tem campos de seleção múltiplos.",
    "encryptedForm": "Formulários encriptados não podem ser processados dessa forma.",
    "deletedFieldsDisabledForDraft": "Formulários de rascunho não podem ser processados dessa forma.",
    "introduction": [
      "Para baixar esses dados, você precisará fornecer sua senha. Sua senha será usada apenas para descriptografar seus dados para download, após o qual o servidor irá esquecê-la novamente."
    ],
    "hint": "Dica: {hint}",
    "noRepeat": "Este Formulário não tem repetições.",
    "action": {
      "download": {
        "mainTable": "Tabela de dados principal (sem repetições)",
        "allTables": "Todas as tabelas de dados",
        "withAttachments": "Todos os dados e Anexos"
      }
    },
    "alert": {
      "unavailable": "O download de dados ainda não está disponível. Tente novamente em instantes.",
      "parseError": "Algo deu errado ao solicitar seus dados."
    }
  },
  "sw": {
    "title": "Pakua Mawasilisho",
    "exportOptions": "Chaguzi za export",
    "field": {
      "splitSelectMultiples": "Gawanya chaguo za \"chagua nyingi\" kwenye safu wima",
      "removeGroupNames": "Ondoa majina ya kikundi",
      "deletedFields": "Jumuisha sehemu zisizo katika Fomu iliyochapishwa"
    },
    "deletedFieldsHelp": "Tumia chaguo hili ikiwa unahitaji kuona sehemu zilizorejelewa katika matoleo ya awali ya Fomu.",
    "noSelectMultiple": "Fomu hii haina sehemu nyingi zilizochaguliwa",
    "encryptedForm": "Fomu Zilizosimbwa kwa njia fiche haziwezi kuchakatwa kwa njia hii",
    "deletedFieldsDisabledForDraft": "Rasimu za Fomu haziwezi kuchakatwa kwa njia hii.",
    "introduction": [
      "Ili kupakua data hii, utahitaji kutoa neno lako la siri. Kauli yako ya siri itatumika tu kusimbua data yako kwa ajili ya kupakua, na kisha seva itaisahau tena."
    ],
    "hint": "Kidokezo: {hint}",
    "noRepeat": "Fomu hii haina marudio",
    "action": {
      "download": {
        "mainTable": "Jedwali kuu la data (hakuna marudio)",
        "allTables": "Jedwali zote za data",
        "withAttachments": "Data na Viambatisho vyote"
      }
    },
    "alert": {
      "unavailable": "Upakuaji wa data bado haupatikani. Tafadhali jaribu tena baada ya muda mfupi",
      "parseError": "Hitilafu fulani imetokea wakati wa kuomba data yako."
    }
  },
  "zh": {
    "title": "下载提交的内容",
    "exportOptions": "导出选项",
    "field": {
      "splitSelectMultiples": "将“多选”字段拆分为多个列",
      "removeGroupNames": "删除群组名称",
      "deletedFields": "包含未发布表单中的字段"
    },
    "deletedFieldsHelp": "若需查看以往表单版本中引用的字段，请使用此选项。",
    "noSelectMultiple": "此表单不包含多选项",
    "encryptedForm": "加密表单无法通过此方式处理。",
    "deletedFieldsDisabledForDraft": "草稿表单无法通过此方式处理。",
    "introduction": [
      "若要下载此数据，您需要提供您的安全密钥。您的安全密钥仅用于解密您的数据以便下载，之后服务器将不会保留该密钥。"
    ],
    "hint": "提示：{hint}",
    "noRepeat": "此表格没有重复值",
    "action": {
      "download": {
        "mainTable": "主数据表（不包含重复数据）",
        "allTables": "全部数据表",
        "withAttachments": "全部数据与附件"
      }
    },
    "alert": {
      "unavailable": "数据下载尚不可用，请稍后重试。",
      "submit": "数据下载即将开始。开始后即可关闭本提示。若20秒后仍未开始，请重新尝试。",
      "parseError": "数据请求过程中出现错误。"
    }
  },
  "zh-Hant": {
    "title": "下載提交資料",
    "exportOptions": "匯出選項",
    "field": {
      "splitSelectMultiples": "將「選擇多個」選項拆分為列",
      "removeGroupNames": "刪除群組名稱",
      "deletedFields": "包含已發布表單中未包含的字段"
    },
    "deletedFieldsHelp": "如果您需要查看先前的表單版本中引用的字段，請使用此選項。",
    "noSelectMultiple": "此表單沒有任何選擇多個欄位。",
    "encryptedForm": "加密表格不能以這種方式處理。",
    "deletedFieldsDisabledForDraft": "草稿表格不能以這種方式處理。",
    "introduction": [
      "為了下載此資料，您需要提供您的密碼。您的密碼將僅用於解密您的資料以供下載，之後伺服器將再次忘記它。"
    ],
    "hint": "提示: {hint}",
    "noRepeat": "此表格沒有重複。",
    "action": {
      "download": {
        "mainTable": "主要資料表（無重複）",
        "allTables": "所有資料表",
        "withAttachments": "所有資料與附件"
      }
    },
    "alert": {
      "unavailable": "資料下載尚不可用。請稍後重試。",
      "submit": "資料下載即將開始。一旦開始，您可以關閉此訊息。如果 20 秒內仍未開始，請再試一次。",
      "parseError": "請求您的資料時出現問題。"
    }
  }
}
</i18n>
