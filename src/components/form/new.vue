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

<!-- A modal that can be used to create a new form or to upload a new form
definition for an existing form -->
<template>
  <modal id="form-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="$emit('hide')">
    <template #title>
      {{ !draft ? $t('title.create') : $t('title.update') }}
    </template>
    <template #body>
      <div v-show="warnings != null" class="modal-warnings">
        <p>{{ $t('warningsText[0]') }}</p>

        <template v-if="warnings?.xlsFormWarnings">
          <p>
            <strong>{{ $t('warningsText[1]') }}</strong>
          </p>
          <ul>
            <!-- eslint-disable-next-line vue/require-v-for-key -->
            <li v-for="warning of warnings.xlsFormWarnings">
              {{ removeLearnMore(warning) }}
              <template v-if="hasLearnMoreLink(warning)">
                <sentence-separator/>
                <a :href="getLearnMoreLink(warning)" target="_blank">{{ $t('moreInfo.learnMore') }}</a>
              </template>
            </li>
          </ul>
        </template>

        <template v-if="warnings?.workflowWarnings">
          <p>
            <strong>{{ $t('warningsText[2]') }}</strong>
          </p>
          <ul>
            <!-- eslint-disable-next-line vue/require-v-for-key -->
            <li v-for="warning of warnings.workflowWarnings">
              <template v-if="warning.type === 'deletedFormExists'">
                {{ $t('warningsText[3].deletedFormExists', { value: warning.details.xmlFormId }) }}
                <doc-link to="central-forms/#deleting-a-form">{{ $t('moreInfo.learnMore') }}</doc-link>
              </template>
              <template v-else-if="warning.type === 'structureChanged'">
                {{ $t('warningsText[3].structureChanged') }}
                <doc-link to="central-forms/#central-forms-updates">{{ $t('moreInfo.learnMore') }}</doc-link>
                <span>
                  <br>
                  <strong>{{ $t('fields') }}</strong> {{ warning.details.join(', ') }}
                </span>
              </template>
              <template v-else-if="warning.type === 'oldEntityVersion'">
                {{ $t('warningsText[3].oldEntityVersion', { version: warning.details.version }) }}
                <a href="https://getodk.github.io/xforms-spec/entities" target="_blank">{{ $t('moreInfo.learnMore') }}</a>
              </template>
            </li>
          </ul>
        </template>

        <p>
          <span>{{ $t('warningsText[4]') }}</span>
          <sentence-separator/>
          <template v-if="!draft">{{ $t('warningsText[5].create') }}</template>
          <template v-else>{{ $t('warningsText[5].update') }}</template>
        </p>
        <p>
          <button type="button" class="btn btn-primary"
            :aria-disabled="awaitingResponse" @click="upload(true)">
            {{ $t('action.uploadAnyway') }} <spinner :state="awaitingResponse"/>
          </button>
        </p>
      </div>
      <div class="modal-introduction">
        <p>
          <template v-if="!draft">{{ $t('introduction[0].create') }}</template>
          <template v-else>{{ $t('introduction[0].update') }}</template>
          <sentence-separator/>
          <i18n-t keypath="introduction[1].full">
            <template #tools>
              <doc-link to="form-tools/">{{ $t('introduction[1].tools') }}</doc-link>
            </template>
          </i18n-t>
        </p>
        <p v-if="!draft">{{ $t('introduction[2]') }}</p>
      </div>
      <file-drop-zone :disabled="awaitingResponse"
        @drop="afterFileSelection($event.dataTransfer.files[0])">
        <i18n-t tag="div" keypath="dropZone.full">
          <template #chooseOne>
            <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
            <input v-show="false" ref="input" type="file" accept=".xls,.xlsx,.xml"
              @change="afterInputChange">
            <button type="button" class="btn btn-primary"
              :aria-disabled="awaitingResponse" @click="$refs.input.click()">
              <span class="icon-folder-open"></span>{{ $t('dropZone.chooseOne') }}
            </button>
          </template>
        </i18n-t>
        <div v-show="file != null" id="form-new-filename">
          {{ file != null ? file.name : '' }}
        </div>
      </file-drop-zone>
      <div class="modal-actions">
        <button type="button" class="btn btn-link" :aria-disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
        <button id="form-new-upload-button" type="button"
          class="btn btn-primary" :aria-disabled="awaitingResponse"
          @click="upload(false)">
          {{ $t('action.upload') }} <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import DocLink from '../doc-link.vue';
import FileDropZone from '../file-drop-zone.vue';
import Modal from '../modal.vue';
import SentenceSeparator from '../sentence-separator.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths, isProblem } from '../../util/request';

export default {
  name: 'FormNew',
  components: { DocLink, FileDropZone, Modal, SentenceSeparator, Spinner },
  inject: ['redAlert'],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hide', 'success'],
  setup() {
    const { request, awaitingResponse } = useRequest();
    return { request, awaitingResponse };
  },
  data() {
    return {
      file: null,
      warnings: null
    };
  },
  computed: {
    projectId() {
      return this.$route.params.projectId;
    },
    xmlFormId() {
      return this.$route.params.xmlFormId;
    },
    // Is the component creating a new form or uploading a new form draft?
    draft() {
      return this.xmlFormId != null;
    },
    // Returns the inferred content type of the file based on its extension. (We
    // first tried using this.file.type rather than inferring the content type,
    // but that didn't work in Edge.)
    contentType() {
      const { name } = this.file;
      if (name.endsWith('.xlsx'))
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (name.endsWith('.xls')) return 'application/vnd.ms-excel';
      return 'application/xml';
    }
  },
  watch: {
    state(state) {
      if (!state) {
        this.file = null;
        this.warnings = null;
      }
    }
  },
  methods: {
    afterFileSelection(file) {
      this.redAlert.hide();
      this.file = file;
      this.warnings = null;
    },
    afterInputChange(event) {
      this.afterFileSelection(event.target.files[0]);
      this.$refs.input.value = '';
    },
    upload(ignoreWarnings) {
      if (this.file == null) {
        this.redAlert.show(this.$t('alert.fileRequired'));
        return;
      }

      const query = ignoreWarnings ? { ignoreWarnings } : null;
      const headers = { 'Content-Type': this.contentType };
      if (this.contentType !== 'application/xml') {
        const fallback = this.file.name.replace(/\.xlsx?$/, '');
        headers['X-XlsForm-FormId-Fallback'] = encodeURIComponent(fallback);
      }
      const initialRoute = this.$route;
      this.request({
        method: 'POST',
        url: !this.draft
          ? apiPaths.forms(this.projectId, query)
          : apiPaths.formDraft(this.projectId, this.xmlFormId, query),
        headers,
        data: this.file,
        fulfillProblem: ({ code }) => code === 400.16,
        problemToAlert: ({ code, details }) => {
          if (code === 400.15)
            return this.$t('problem.400_15', details);
          if (code === 409.3 && details.table === 'forms') {
            const { fields } = details;
            if (fields.length === 2 && fields[0] === 'projectId' &&
              fields[1] === 'xmlFormId')
              return this.$t('problem.409_3', { xmlFormId: details.values[1] });
          }
          if (code === 400.8 && details.field === 'xmlFormId') {
            return this.$t('problem.400_8', {
              expected: this.xmlFormId,
              actual: details.value
            });
          }
          return null;
        }
      })
        .then(({ data }) => {
          if (isProblem(data)) {
            this.redAlert.hide();
            this.warnings = data.details.warnings;
          } else {
            this.$emit('success', data);
          }
        })
        .catch(() => {
          if (this.$route === initialRoute) this.warnings = null;
        });
    },
    removeLearnMore(value) {
      return value.replace(/Learn more: (https?:\/\/xlsform\.org[^.]*)\.?/, '').trim();
    },
    hasLearnMoreLink(value) {
      return value.match(/Learn more: (https?:\/\/xlsform\.org[^.]*)\.?/);
    },
    getLearnMoreLink(value) {
      return value.match(/Learn more: (https?:\/\/xlsform\.org[^.]*)\.?/)[1];
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#form-new {
  .modal-warnings ul {
    overflow-wrap: break-word;
    white-space: pre-wrap;
    margin-top: 10px;
  }

  .file-drop-zone {
    // Zero out the horizontal padding so that the border above the filename
    // stretches across the entire width of the drop zone.
    padding-left: 0;
    padding-right: 0;
  }
}

#form-new-filename {
  background-color: #eee;
  border-top: 1px solid #ddd;
  font-family: $font-family-monospace;
  margin-bottom: -$padding-file-drop-zone;
  margin-top: 10px;
  padding: 6px 0;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": {
      "create": "Create Form",
      "update": "Upload New Form Definition"
    },
    "introduction": [
      // The words "XForms" and "XLSForm" should not be translated.
      {
        "create": "To create a Form, upload an XForms XML file or an XLSForm Excel file.",
        "update": "To update the Draft, upload an XForms XML file or an XLSForm Excel file."
      },
      {
        "full": "If you don’t already have one, there are {tools} to help you design your Form.",
        "tools": "tools available"
      },
      "If you have Form Attachments, you will be able to provide those on the next page, after the Form has been created."
    ],
    "dropZone": {
      "full": "Drop a file here, or {chooseOne} to upload.",
      "chooseOne": "choose one"
    },
    "action": {
      "uploadAnyway": "Upload anyway"
    },
    "alert": {
      "fileRequired": "Please choose a file."
    },
    "problem": {
      "400_8": "The Form definition you have uploaded does not appear to be for this Form. It has the wrong formId (expected “{expected}”, got “{actual}”).",
      // The word "XLSForm" should not be translated.
      "400_15": "The XLSForm could not be converted: {error}",
      "409_3": "A Form already exists in this Project with the Form ID of “{xmlFormId}”."
    },
    // Sub-heading for a warning details, followed by the list of fields
    "fields": "Fields:",
    "warningsText": [
      "This file can be used, but it has the following possible problems:",
      "Form design warnings:",
      "Workflow warnings:",
      {
        "deletedFormExists": "There is a form with ID \"{value}\" in the Trash. If you upload this Form, you won’t be able to restore the other one with the matching ID.",
        "structureChanged": "The following fields have been deleted, renamed or are now in different groups or repeats. These fields will not be visible in the Submission table or included in exports by default.",
        "oldEntityVersion": "Entities specification version “{version}” is not compatible with Offline Entities. We recommend using version 2024.1.0 or later."
      },
      "Please correct the problems and try again.",
      {
        "create": "If you are sure these problems can be ignored, click the button to create the Form anyway:",
        "update": "If you are sure these problems can be ignored, click the button to update the Draft anyway:"
      }
    ]
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": {
      "create": "Vytvořit formulář",
      "update": "Nahrát novou definici formuláře"
    },
    "introduction": [
      {
        "create": "Chcete-li vytvořit formulář, nahrajte soubor XForms XML nebo XLSForm Excel.",
        "update": "Chcete-li aktualizovat pracovní verzi, nahrajte soubor XForms XML nebo XLSForm Excel."
      },
      {
        "full": "Pokud ještě žádný nemáte, je tu {tools} který vám pomůže navrhnout formulář.",
        "tools": "dostupný nástroj"
      },
      "Pokud máte přílohy formuláře, budete je moci zadat na další stránce po vytvoření formuláře."
    ],
    "dropZone": {
      "full": "Sem přetáhněte soubor nebo {chooseOne} a nahrajte.",
      "chooseOne": "vyberte jeden"
    },
    "action": {
      "uploadAnyway": "Přesto nahrát"
    },
    "alert": {
      "fileRequired": "Vyberte soubor."
    },
    "problem": {
      "400_8": "Zdá se, že definice formuláře, kterou jste nahráli, není pro tento formulář. Má nesprávnou formu (očekává se „{expected}“, a máte „{actual}“).",
      "400_15": "XLSForm nelze převést: {error}",
      "409_3": "Formulář již v tomto projektu existuje s ID formuláře „{xmlFormId}“."
    },
    "fields": "Pole:",
    "warningsText": [
      "Tento soubor lze použít, ale může mít následující problémy:",
      "Upozornění k návrhu formuláře:",
      "Upozornění na pracovní postup:",
      {
        "structureChanged": "Následující pole byla odstraněna, přejmenována nebo jsou nyní v jiných skupinách či opakováních. Tato pole nebudou ve výchozím nastavení viditelná v tabulce Podání ani zahrnuta do exportů."
      },
      "Problémy opravte a zkuste to znovu.",
      {
        "create": "Pokud jste si jisti, že tyto problémy lze ignorovat, klikněte na tlačítko a formulář přesto vytvořte:",
        "update": "Pokud jste si jisti, že tyto problémy lze ignorovat, klikněte na tlačítko pro aktualizaci návrhu:"
      }
    ]
  },
  "de": {
    "title": {
      "create": "Formular erstellen",
      "update": "Neue Formulardefinition hochladen"
    },
    "introduction": [
      {
        "create": "Um ein Formular zu erstellen, laden Sie eine XML-Datei im Format XForms oder eine Excel-Datei im Format XLSForms hoch.",
        "update": "Um einen Entwurf zu erstellen, laden Sie eine XML-Datei im Format XForms oder eine Excel-Datei im Format XLSForms hoch."
      },
      {
        "full": "Wenn Sie noch kein Formular haben, gibt es {tools} mit denen Sie Ihr Formular entwickeln können.",
        "tools": "Werkzeuge"
      },
      "Wenn Sie Anhängen haben, können Sie diese auf der folgenden Seite hochladen, nachdem das Formular erstellt wurde."
    ],
    "dropZone": {
      "full": "Fügen Sie hier eine Datei mit Drag-and-Drop ein, oder {chooseOne} zum Hochladen.",
      "chooseOne": "eine auswählen"
    },
    "action": {
      "uploadAnyway": "Trotzdem hochladen"
    },
    "alert": {
      "fileRequired": "Bitte wählen Sie eine Datei aus."
    },
    "problem": {
      "400_8": "Die hochgeladene Formulardefinition scheint nicht für dieses Formular zu sein. Es hat die falsche formId (\"{expected}\" erwartet, \"{actual}\" erhalten).",
      "400_15": "Das XLSForm konnte nicht konvertiert werden: {error}",
      "409_3": "Es gibt bereits ein Formular in diesem Projekt mit der Formular ID \"{xmlFormId}\"."
    },
    "fields": "Felder:",
    "warningsText": [
      "Die Datei kann verwendet werden, aber sie hat die folgenden möglichen Probleme:",
      "Warnungen zum Formulardesign:",
      "Workflow-Warnungen:",
      {
        "deletedFormExists": "Es befindet sich ein Formular mit der ID \"{value}\" im Papierkorb. Wenn Sie dieses Formular hochladen, können Sie das andere mit derselben ID nicht mehr wiederherstellen.",
        "structureChanged": "Die folgenden Felder wurden gelöscht, umbenannt oder befinden sich jetzt in anderen Gruppen oder Wiederholungen. Diese Felder sind in der Überermittlungstabelle nicht sichtbar oder standardmässig in Exporten enthalten.",
        "oldEntityVersion": "Die Objektspezifikationsversion \"{version}\" ist nicht mit Offline-Objekten kompatibel. Wir empfehlen die Verwendung von Version 2024.1.0 oder neuer."
      },
      "Bitte beheben Sie die Probleme und versuchen es erneut.",
      {
        "create": "Wenn Sie sicher sind, dass diese Probleme ignoriert werden können, klicken Sie den Button, um das Formular trotzdem zu erzeugen:",
        "update": "Wenn Sie sicher sind, dass diese Probleme ignoriert werden können, klicken Sie den Button, um den Entwurf trotzdem zu aktualisieren:"
      }
    ]
  },
  "es": {
    "title": {
      "create": "Crear formulario",
      "update": "Cargar nueva definición de formulario"
    },
    "introduction": [
      {
        "create": "Para crear un formulario, cargue un archivo XML de XForms o un archivo XLSForm de Excel",
        "update": "Para actualizar el borrador, cargue un archivo XML de XForms o un archivo XLSForm de Excel."
      },
      {
        "full": "Si aún no tiene uno, hay {tools} para ayudarlo a diseñar su formulario.",
        "tools": "herramientas disponibles"
      },
      "Si tiene archivos adjuntos de formulario, podrá cargarlos en la página siguiente, después de que se haya creado el formulario."
    ],
    "dropZone": {
      "full": "Suelta un archivo aquí o {chooseOne} para subir.",
      "chooseOne": "elige uno"
    },
    "action": {
      "uploadAnyway": "Subir de todos modos"
    },
    "alert": {
      "fileRequired": "Por favor, elija un archivo."
    },
    "problem": {
      "400_8": "La definición del formulario que ha subido no parece ser para este formulario. Tiene el FormId equivocado (esperado \"{expected}\", got \"{actual}\").",
      "400_15": "El XLSForm no se pudo convertir: {error}",
      "409_3": "Un formulario ya existe en este proyecto con el ID formulario de {xmlFormId}"
    },
    "fields": "Campos:",
    "warningsText": [
      "Este archivo se puede utilizar, pero tiene los siguientes problemas posibles:",
      "Advertencias sobre el diseño del formulario:",
      "Advertencias sobre el flujo de trabajo:",
      {
        "deletedFormExists": "Hay un formulario con ID \"{value}\" en la Papelera. Si carga este formulario, no podrá restablecer el otro con la identificación coincidente.",
        "structureChanged": "Los siguientes campos han sido eliminados, renombrados o ahora están en diferentes grupos o repeticiones. Estos campos no estarán visibles en la tabla de envío ni se incluirán en las exportaciones de forma predeterminada.",
        "oldEntityVersion": "La versión \"{version}\" de la especificación de entidades no es compatible con las entidades sin conexión. Se recomienda utilizar la versión 2024.1.0 o posterior."
      },
      "Por favor, corrija los problemas e intente nuevamente.",
      {
        "create": "Si esta seguro que estos errores pueden ser ignorados, haga clic en el botón para crear el formulario de todos modos:",
        "update": "Si esta seguro que estos errores pueden ser ignorados, haga clic en el botón para actualizar el borrador de todos modos:"
      }
    ]
  },
  "fr": {
    "title": {
      "create": "Créer un formulaire",
      "update": "Téléverser une nouvelle définition de formulaire"
    },
    "introduction": [
      {
        "create": "Pour créer un formulaire, téléversez un fichier XML XForms ou un fichier excel XLSForm",
        "update": "Pour modifier l'ébauche, téléversez un fichier XML XForms ou un fichier Excel XLSForm"
      },
      {
        "full": "Si vous n'en avez as déjà un, il y a des {tools} pour vous aider à concevoir votre formulaire.",
        "tools": "outils disponibles"
      },
      "Si vous avez des fichiers joints pour ce Formulaire, vous pourrez les fournir sur la page suivante, après que le Formulaire aura été créé."
    ],
    "dropZone": {
      "full": "Déposez un fichier ici, ou {chooseOne} pour le téléverser.",
      "chooseOne": "Choisissez un"
    },
    "action": {
      "uploadAnyway": "Téléverser malgré tout"
    },
    "alert": {
      "fileRequired": "Merci de choisir un fichier."
    },
    "problem": {
      "400_8": "La définition de formulaire que vous avez envoyé ne semble pas correspondre à ce formulaire. Elle a un mauvais formid ( “{expected}” attendu, “{actual}” reçu).",
      "400_15": "Le XLSForm n'a pas pu être converti : {error}",
      "409_3": "Un formulaire portant le Form ID {xmlFormId} existe déjà dans ce projet."
    },
    "fields": "Champs :",
    "warningsText": [
      "Ce fichier peut être utilisé, mais a possiblement les problèmes suivants :",
      "Avertissements sur la conception du formulaire :",
      "Avertissements sur le déroulement des opérations :",
      {
        "deletedFormExists": "Il y a un formulaire avec l'ID \"{value}\" dans la Corbeille. Si vous téléversez ce Formulaire, vous ne serez plus en capacité de restaurer celui qui est dans la corbeille avec le même ID.",
        "structureChanged": "Les champs suivants ont été supprimés, renommés ou déplacés dans différents groupes (group) ou répétitions (repeat). Ces champs ne seront pas visibles dans le table des Soumissions ou inclus dans les exports par défaut.",
        "oldEntityVersion": "La version \"{version}\" de la spécification des entités n'est pas compatible avec les entités hors-ligne. Nous recommandons d'utiliser la version 2024.1.0 ou supérieure."
      },
      "Merci de corriger le problème et d'essayer à nouveau.",
      {
        "create": "Si vous êtes sûr que ces problèmes peuvent être ignorés, cliquez le bouton pour créer le formulaire malgré tout :",
        "update": "Si vous êtes sûr que ces problèmes peuvent être ignorés, cliquez le bouton pour mettre à jour l'ébauche malgré tout :"
      }
    ]
  },
  "id": {
    "title": {
      "create": "Buat Formulir",
      "update": "Unggah Definisi Formulir Baru"
    },
    "introduction": [
      {
        "create": "Untuk membuat formulir, unggah dokumen XForms XML atau dokumen XLSForm Excel.",
        "update": "Untuk memperbarui draf, unggan dokumen XForms XML atau dokumen XLSForm Excel."
      },
      {
        "full": "Apabila Anda belum memilikinya, {tools} akan membantu Anda mendesain formulir Anda.",
        "tools": "Perangkat yang tersedia"
      }
    ],
    "dropZone": {
      "full": "Lepas dokumen di sini, atau {chooseOne} untuk mengunggah.",
      "chooseOne": "pilih satu"
    },
    "action": {
      "uploadAnyway": "Lanjutkan unggah"
    },
    "alert": {
      "fileRequired": "Silakan pilih dokumen."
    },
    "problem": {
      "400_8": "Definisi formulir yang Anda unggah tidak cocok dengan formulir ini. Terjadi kesalahan formld (seharusnya \"{expected}\", yang didapat \"{actual}\").",
      "400_15": "XLSForm tidak bisa diubah: {error}",
      "409_3": "Formulir sudah ada di Proyek ini dengan ID Formulir \"{xmlFormId}\"."
    }
  },
  "it": {
    "title": {
      "create": "Creare un formulario",
      "update": "Carica la nuova definizione del formulario"
    },
    "introduction": [
      {
        "create": "Per creare un formulario, caricare un file XML XForms o un file Excel XLSForm.",
        "update": "Per aggiornare la bozza, caricare un file XML XForms o un file Excel XLSForm."
      },
      {
        "full": "Se non ne hai già uno, ci sono {tools} per aiutarti a progettare il tuo formulario.",
        "tools": "strumenti a disposizione"
      },
      "Se disponi di allegati, potrai caricarli nella pagina successiva, dopo che il formulario è stato creato."
    ],
    "dropZone": {
      "full": "Trascina un file qui o {chooseOne} per caricarlo.",
      "chooseOne": "scegli uno"
    },
    "action": {
      "uploadAnyway": "Carica comunque"
    },
    "alert": {
      "fileRequired": "Selezionare un file per favore"
    },
    "problem": {
      "400_8": "La definizione del formulario che hai caricato non sembra essere per questo formulario. Ha il formId sbagliato (previsto \"{expected}\", ottenuto \"{actual}\").",
      "400_15": "Non è stato possibile convertire l'XLSForm : {error}",
      "409_3": "Esiste già un Formulario in questo progetto con il Form ID “{xmlFormId}”."
    },
    "fields": "Campi:",
    "warningsText": [
      "Questo file può essere utilizzato, ma presenta i seguenti possibili problemi:",
      "Avvertenze sulla progettazione del formulario:",
      "Avvertenze sul flusso di lavoro:",
      {
        "deletedFormExists": "C'è un formulario con ID \"{value}\" nel Cestino. Se carichi questo formulario, non sarai in grado di ripristinare l'altro con l'ID corrispondente.",
        "structureChanged": "I seguenti campi sono stati cancellati, rinominati o sono ora in diversi gruppi o ripetizioni. Questi campi non saranno visibili nella tabella d'invio o inclusi negli export predefiniti.",
        "oldEntityVersion": "Versione delle specifiche delle entità “{version}” non è compatibile con le Entità offline. Si consiglia di utilizzare la versione 2024.1.0 o successiva."
      },
      "Correggi i problemi e riprova.",
      {
        "create": "Se sei sicuro che questi problemi possano essere ignorati, fai cli sul pulsante per creare comunque il formulario:",
        "update": "Se sei sicuro che questi problemi possano essere ignorati, fai cli sul pulsante per creare comunque la bozza del formulario:"
      }
    ]
  },
  "ja": {
    "title": {
      "create": "フォームの作成",
      "update": "新規の定義フォームのアップロード"
    },
    "introduction": [
      {
        "create": "フォーム作成のため、XForms（XMLファイル）、またはXLSForm（Excelファイル）をアップロードして下さい。",
        "update": "下書きの更新のため、XForms（XMLファイル）、またはXLSForm（Excelファイル）をアップロードして下さい。"
      },
      {
        "full": "もしまだフォームをお持ちでない場合、フォームデザインを支援する{tools}。",
        "tools": "ツールを利用できます"
      }
    ],
    "dropZone": {
      "full": "アップロードするには、ここにファイルをドロップする、または、こちらからファイルを{chooseOne}",
      "chooseOne": "１つ選択"
    },
    "action": {
      "uploadAnyway": "ひとまず、アップロード"
    },
    "alert": {
      "fileRequired": "ファイルを選択"
    },
    "problem": {
      "400_8": "アップロードされた定義フォームは、このフォームのものとは異なるようです。formIdが間違っています（\"{expected}\"であるべきですが、\"{actual}\"となっています）。",
      "400_15": "XLSFormを変換できませんでした：{error}",
      "409_3": "このプロジェクトには、フォームID\"{xmlFormId}\"のフォームがすでに存在しています。"
    }
  },
  "pt": {
    "title": {
      "create": "Criar formulário",
      "update": "Carregar nova definição de formulário"
    },
    "introduction": [
      {
        "create": "Para criar um formulário, carregue um arquivo XML do XForms ou um arquivo XLSForm do Excel.",
        "update": "Para atualizar o rascunho, carregue um arquivo XML do XForms ou um arquivo XLSForm do Excel."
      },
      {
        "full": "Se você não tem nenhum ainda, existem {tools} que podem ajudar você a construir seu formulário.",
        "tools": "ferramentas disponíveis"
      },
      "Se você tiver Anexos do Formulário, poderá fornecê-los na próxima página, após o Formulário ter sido criado."
    ],
    "dropZone": {
      "full": "Solte o arquivo aqui, ou {chooseOne} para carregar.",
      "chooseOne": "escolha um"
    },
    "action": {
      "uploadAnyway": "Carregar assim mesmo"
    },
    "alert": {
      "fileRequired": "Por favor, selecione um arquivo."
    },
    "problem": {
      "400_8": "A especificação de formulário que você carregou não parece ser para esse formulário. Ela contém uma identificação de formulário errada (era esperado \"{expected}\", mas encontramos \"{actual}\").",
      "400_15": "O XLSForm não pode ser convertido: {error}",
      "409_3": "Já existe um formulário nesse projeto com o ID de formulário \"{xmlFormId}\"."
    },
    "fields": "Campos:",
    "warningsText": [
      "Este arquivo pode ser usado, mas tem os seguintes problemas possíveis:",
      "Avisos de design do formulário:",
      "Avisos de fluxo de trabalho:",
      {
        "structureChanged": "Os seguintes campos foram excluídos, renomeados ou agora estão em grupos diferentes ou repetições. Esses campos não estarão visíveis na tabela de Resposta ou incluídos nas exportações por padrão.",
        "oldEntityVersion": "A versão “{version}” da especificação de Entidades não é compatível com Entidades Offline. Recomendamos utilizar a versão 2024.1.0 ou alguma mais recente."
      },
      "Por favor, corrija os problemas e tente novamente.",
      {
        "create": "Se tiver certeza de que esses problemas podem ser ignorados, clique no botão para criar o Formulário mesmo assim:",
        "update": "Se tiver certeza de que esses problemas podem ser ignorados, clique no botão para atualizar o Rascunho mesmo assim:"
      }
    ]
  },
  "sw": {
    "title": {
      "create": "unda fomu",
      "update": "Pakia Ufafanuzi wa Fomu Mpya"
    },
    "introduction": [
      {
        "create": "Ili kuunda Fomu, pakia faili ya XForms XML au faili ya XLSForm Excel.",
        "update": "Ili kusasisha Rasimu, pakia faili ya XForms XML au faili ya XLSForm Excel."
      },
      {
        "full": "Ikiwa tayari huna, kuna {tools} za kukusaidia kuunda Fomu yako.",
        "tools": "zana zinazopatikana"
      },
      "Kwa sasa, tuwasilishe uchapishe Fomu zako na Seti ya Data, na usiidhinishe yoyotesho (na kwa hivyo usiunde pesa zisizohitajika) hadi uhakikishe kuwa Fomu iko tayari."
    ],
    "dropZone": {
      "full": "Dondosha faili hapa, au {chooseOne} ili upakie.",
      "chooseOne": "Chagua moja"
    },
    "action": {
      "uploadAnyway": "Pakia hata hivyo"
    },
    "alert": {
      "fileRequired": "Tafadhali chagua faili."
    },
    "problem": {
      "400_8": "Ufafanuzi wa Fomu uliyopakia hauonekani kuwa wa Fomu hii. Ina formId isiyo sahihi (expected \"{expected}\", imepata \"{actual}\").",
      "400_15": "XLSForm haikuweza kubadilishwa: {error}",
      "409_3": "Tayari kuna Fomu katika Mradi huu yenye Kitambulisho cha Fomu ya “{xmlFormId}”."
    },
    "fields": "Viwanja:",
    "warningsText": [
      "Faili hii inaweza kutumika, lakini ina matatizo yafuatayo:",
      "Maonyo ya muundo wa fomu:",
      "Maonyo ya mtiririko wa kazi:",
      {
        "structureChanged": "Sehemu zifuatazo zimefutwa, zimepewa jina jipya au sasa ziko katika vikundi tofauti au marudio. Sehemu hizi hazitaonekana katika jedwali la Wasilisho au kujumuishwa katika uhamishaji kwa chaguo msingi"
      },
      "Tafadhali sahihisha matatizo na ujaribu tena.",
      {
        "create": "Ikiwa una uhakika kuwa matatizo haya yanaweza kupuuzwa, bofya kitufe ili kuunda Fomu hata hivyo:",
        "update": "Ikiwa una uhakika matatizo haya yanaweza kupuuzwa, bofya kitufe ili kusasisha Rasimu hata hivyo:"
      }
    ]
  },
  "zh": {
    "title": {
      "create": "创建表单",
      "update": "上传新表单定义"
    },
    "introduction": [
      {
        "create": "请上传XForms XML文件或XLSForm Excel文件以创建表单。",
        "update": "请上传XForms XML文件或XLSForm Excel文件以更新草稿。"
      },
      {
        "full": "若尚无表单文件，可使用{tools}辅助设计。",
        "tools": "可用工具"
      },
      "若需上传表单附件，可在创建表单后的下一页进行操作。"
    ],
    "dropZone": {
      "full": "请将文件拖放至此，或{chooseOne}上传。",
      "chooseOne": "选择文件"
    },
    "action": {
      "uploadAnyway": "仍然上传"
    },
    "alert": {
      "fileRequired": "请选择文件。"
    },
    "problem": {
      "400_8": "您上传的表单定义文件与此表单不匹配：表单ID应为“{expected}”，但上传文件为“{actual}”。",
      "400_15": "XLSForm转换失败：{error}",
      "409_3": "此项目中已存在表单ID为“{xmlFormId}”的表单"
    },
    "fields": "字段：",
    "warningsText": [
      "此文件可用，但存在以下潜在问题：",
      "表单设计警告：",
      "工作流警告：",
      {
        "deletedFormExists": "回收站中已存在ID为“{value}”的表单。若上传此表单，将无法恢复同名ID的表单。",
        "structureChanged": "以下字段已被删除、重命名或移至其他组/重复节段。默认情况下，这些字段将不会在提交表格中显示，也不会包含在导出数据中。",
        "oldEntityVersion": "实体规范版本“{version}”与离线实体功能不兼容。建议使用2024.1.0或更高版本。"
      },
      "请修正问题后重试。",
      {
        "create": "若确认可忽略这些问题，请点击下方按钮继续创建表单：",
        "update": "若确认可忽略这些问题，请点击下方按钮继续更新草稿："
      }
    ]
  },
  "zh-Hant": {
    "title": {
      "create": "建立表單",
      "update": "上傳新表單定義"
    },
    "introduction": [
      {
        "create": "若要建立表單，請上傳 XForms XML 檔案或 XLSForm Excel 檔案。",
        "update": "若要更新草稿，請上傳 XForms XML 檔案或 XLSForm Excel 檔案。"
      },
      {
        "full": "如果您還沒有，可以使用{tools}來幫助您設計表單。",
        "tools": "可用的工具"
      },
      "如果您有表單附件，則可以在建立表單後，於下個頁面提供這些附件。"
    ],
    "dropZone": {
      "full": "將檔案拖曳到此處，或{chooseOne} 上傳。",
      "chooseOne": "選擇一個檔案"
    },
    "action": {
      "uploadAnyway": "無論如何上傳"
    },
    "alert": {
      "fileRequired": "請選擇檔案"
    },
    "problem": {
      "400_8": "您上傳的表單定義似乎不適用於此表單。它的 formId (表單 ID)錯誤（預期為“{expected}”，得到“{actual}”）。",
      "400_15": "無法轉換 XLSForm：{error}",
      "409_3": "此專案中已存在表單 ID 為「{xmlFormId}」的表單。"
    },
    "fields": "欄位：",
    "warningsText": [
      "該檔案可以使用，但可能存在以下問題：",
      "表單設計警告：",
      "工作流程警告：",
      {
        "deletedFormExists": "垃圾箱中有一個 ID 為「{value}」的表單。如果您上傳此表單，您將無法還原具有符合 ID 的另一張表單。",
        "structureChanged": "以下欄位已被刪除、重新命名或現在位於不同的群組中或重複。預設情況下，這些欄位在提交表中不可見，也不包含在匯出中。",
        "oldEntityVersion": "實體規範版本 “{version}” 與離線實體不相容。我們建議使用2024.1.0或更高版本。"
      },
      "請更正問題並重試。",
      {
        "create": "如果您確定可以忽略這些問題，請按一下按鈕來建立表單：",
        "update": "如果您確定可以忽略這些問題，請按一下按鈕來更新草稿："
      }
    ]
  }
}
</i18n>
