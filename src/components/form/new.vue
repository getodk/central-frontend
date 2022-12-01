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
      {{ !formDraft.dataExists ? $t('title.create') : $t('title.update') }}
    </template>
    <template #body>
      <div v-show="warnings != null" class="modal-warnings">
        <p>{{ $t('warningsText[0]') }}</p>
        <ul if="warnings != null">
          <!-- eslint-disable-next-line vue/require-v-for-key -->
          <li v-for="warning of warnings">{{ warning.trim() }}</li>
        </ul>
        <p>
          <span>{{ $t('warningsText[1]') }}</span>
          <sentence-separator/>
          <template v-if="!formDraft.dataExists">{{ $t('warningsText[2].create') }}</template>
          <template v-else>{{ $t('warningsText[2].update') }}</template>
        </p>
        <p>
          <button type="button" class="btn btn-primary"
            :disabled="awaitingResponse" @click="upload(true)">
            {{ $t('action.uploadAnyway') }} <spinner :state="awaitingResponse"/>
          </button>
        </p>
      </div>
      <div class="modal-introduction">
        <p>
          <template v-if="!formDraft.dataExists">{{ $t('introduction[0].create') }}</template>
          <template v-else>{{ $t('introduction[0].update') }}</template>
          <sentence-separator/>
          <i18n-t keypath="introduction[1].full">
            <template #tools>
              <doc-link to="form-tools/">{{ $t('introduction[1].tools') }}</doc-link>
            </template>
          </i18n-t>
        </p>
        <p v-if="!formDraft.dataExists">{{ $t('introduction[2]') }}</p>
      </div>
      <div id="form-new-drop-zone" ref="dropZone" :class="dropZoneClass">
        <i18n-t tag="div" keypath="dropZone.full">
          <template #chooseOne>
            <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
            <input v-show="false" ref="input" type="file" @change="afterChange">
            <button type="button" class="btn btn-primary"
              :disabled="awaitingResponse" @click="$refs.input.click()">
              <span class="icon-folder-open"></span>{{ $t('dropZone.chooseOne') }}
            </button>
          </template>
        </i18n-t>
        <div v-show="file != null" id="form-new-filename">
          {{ file != null ? file.name : '' }}
        </div>
      </div>
      <div class="modal-actions">
        <button id="form-new-upload-button" type="button"
          class="btn btn-primary" :disabled="awaitingResponse"
          @click="upload(false)">
          {{ $t('action.upload') }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link" :disabled="awaitingResponse"
          @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import DocLink from '../doc-link.vue';
import Modal from '../modal.vue';
import SentenceSeparator from '../sentence-separator.vue';
import Spinner from '../spinner.vue';

import dropZone from '../../mixins/drop-zone';
import request from '../../mixins/request';
import { apiPaths, isProblem } from '../../util/request';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormNew',
  components: { DocLink, Modal, SentenceSeparator, Spinner },
  mixins: [dropZone(), request()],
  inject: ['alert'],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hide', 'success'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { project, resourceView } = useRequestData();
    const formDraft = resourceView('formDraft', (data) => data.get());
    return { project, formDraft };
  },
  data() {
    return {
      dragDepth: 0,
      awaitingResponse: false,
      file: null,
      warnings: null
    };
  },
  computed: {
    disabled() {
      return this.awaitingResponse;
    },
    dropZoneClass() {
      return {
        'form-new-disabled': this.awaitingResponse,
        'form-new-dragover': this.fileIsOverDropZone
      };
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
      this.alert.blank();
      this.file = file;
      this.warnings = null;
    },
    afterChange(event) {
      this.afterFileSelection(event.target.files[0]);
      this.$refs.input.value = '';
    },
    ondrop(jQueryEvent) {
      this.afterFileSelection(jQueryEvent.originalEvent.dataTransfer.files[0]);
    },
    upload(ignoreWarnings) {
      if (this.file == null) {
        this.alert.info(this.$t('alert.fileRequired'));
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
        url: !this.formDraft.dataExists
          ? apiPaths.forms(this.project.id, query)
          : apiPaths.formDraft(this.project.id, this.formDraft.xmlFormId, query),
        headers,
        data: this.file,
        fulfillProblem: ({ code }) => code === 400.16,
        problemToAlert: ({ code, details }) => {
          if (code === 400.15)
            return this.$t('problem.400_15', details);
          if (code === 409.3 && details.table === 'forms') {
            const { fields } = details;
            if (fields.length === 2 && fields[0] === 'projectId' &&
              fields[1] === 'xmlFormId') {
              const xmlFormId = details.values[1];
              return this.$t('problem.409_3', { xmlFormId });
            }
          }
          if (code === 400.8 && details.field === 'xmlFormId') {
            return this.$t('problem.400_8', {
              expected: this.formDraft.xmlFormId,
              actual: details.value
            });
          }
          return null;
        }
      })
        .then(({ data }) => {
          if (isProblem(data)) {
            this.alert.blank();
            this.warnings = data.details.warnings;
          } else {
            // project.forms may now be out-of-date. However, if the user
            // navigates to the project overview, it should be updated.

            this.$emit('success', data);
          }
        })
        .catch(() => {
          if (this.$route === initialRoute) this.warnings = null;
        });
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

$drop-zone-vpadding: 15px;

#form-new .modal-warnings ul {
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

#form-new-drop-zone {
  background-color: $color-panel-input-background;
  border: 1px dashed $color-subpanel-border;
  padding-bottom: $drop-zone-vpadding;
  padding-top: $drop-zone-vpadding;
  text-align: center;

  &.form-new-dragover {
    opacity: 0.65;
  }

  &.form-new-disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
}

#form-new-filename {
  background-color: $color-input-background;
  border-top: 1px solid #ddd;
  font-family: $font-family-monospace;
  margin-bottom: -$drop-zone-vpadding;
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
      "upload": "Upload",
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
    "warningsText": [
      // The word "XLSForm" should not be translated.
      "This XLSForm file can be used, but it has the following possible problems (conversion warnings):",
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
      "upload": "Nahrát",
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
    "warningsText": [
      "Tento soubor XLSForm lze použít, ale má následující možné problémy (upozornění při převodu):",
      "Opravte problémy a zkuste to znovu.",
      {
        "create": "Pokud jste si jisti, že tyto problémy lze ignorovat, formulář přesto vytvořte kliknutím na tlačítko:",
        "update": "Pokud jste si jisti, že tyto problémy lze ignorovat, klikněte na tlačítko a Koncept aktualizujte:"
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
      }
    ],
    "dropZone": {
      "full": "Fügen Sie hier eine Datei mit Drag-and-Drop ein, oder {chooseOne} zum Hochladen.",
      "chooseOne": "eine auswählen"
    },
    "action": {
      "upload": "Hochladen",
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
    "warningsText": [
      "Die XLSForm-Datei kann verwendet werden, aber sie hat die folgenden möglichen Probleme (Warnungen bei der Umwandlung):",
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
      }
    ],
    "dropZone": {
      "full": "Suelta un archivo aquí o {chooseOne} para subir.",
      "chooseOne": "elige uno"
    },
    "action": {
      "upload": "Subir",
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
    "warningsText": [
      "Este archivo en formato XLS puede ser usado, pero tiene algunos problemas posibles ( advertencias de conversión ):",
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
      }
    ],
    "dropZone": {
      "full": "Déposez un fichier ici, ou {chooseOne} pour le téléverser.",
      "chooseOne": "Choisissez un"
    },
    "action": {
      "upload": "Téléverser",
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
    "warningsText": [
      "Ce fichier XLSForm peut être utilisé, mais il présente les problèmes possibles suivants (avertissements de conversion) :",
      "Veuillez corriger les problèmes et réessayer.",
      {
        "create": "Si vous êtes sûr que ces problèmes peuvent être ignorés, cliquez sur le bouton pour créer quand même le formulaire :",
        "update": "Si vous êtes sûr que ce problème peut-être ignoré, cliquez sur le bouton pour mettre à jour l'ébauche :"
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
      "upload": "Unggah",
      "uploadAnyway": "Lanjutkan unggah"
    },
    "alert": {
      "fileRequired": "Silakan pilih dokumen."
    },
    "problem": {
      "400_8": "Definisi formulir yang Anda unggah tidak cocok dengan formulir ini. Terjadi kesalahan formld (seharusnya \"{expected}\", yang didapat \"{actual}\").",
      "400_15": "XLSForm tidak bisa diubah: {error}",
      "409_3": "Formulir sudah ada di Proyek ini dengan ID Formulir \"{xmlFormId}\"."
    },
    "warningsText": [
      "XLSForm dapat digunakan, tetapi dengan peringatan kemungkinan masalah berikut (peringatan konversi):",
      "Mohon perbaiki dan coba lagi.",
      {
        "create": "Apabila Anda yakin masalah ini dapat diabaikan, klik tombol untuk melanjutkan buat formulir:",
        "update": "Apabila Anda yakin masalah ini dapat diabaikan, klik tombol untuk melanjutkan pembaruan draf:"
      }
    ]
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
      }
    ],
    "dropZone": {
      "full": "Trascina un file qui o {chooseOne} per caricarlo.",
      "chooseOne": "scegli uno"
    },
    "action": {
      "upload": "Carica",
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
    "warningsText": [
      "Questo file XLSForm può essere utilizzato, ma presenta i seguenti possibili problemi (avvisi di conversione):",
      "Si prega di correggere i problemi e riprovare.",
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
      "upload": "アップロード",
      "uploadAnyway": "ひとまず、アップロード"
    },
    "alert": {
      "fileRequired": "ファイルを選択"
    },
    "problem": {
      "400_8": "アップロードされた定義フォームは、このフォームのものとは異なるようです。formIdが間違っています（\"{expected}\"であるべきですが、\"{actual}\"となっています）。",
      "400_15": "XLSFormを変換できませんでした：{error}",
      "409_3": "このプロジェクトには、フォームID\"{xmlFormId}\"のフォームがすでに存在しています。"
    },
    "warningsText": [
      "このXLSFormファイルは利用できますが、次の問題が起こる可能性があります（変換時の警告）：",
      "問題を修正して再度試して下さい。",
      {
        "create": "これらの問題が無視できると判断した場合は、以下のボタンをクリックしてフォームを作成して下さい。",
        "update": "これら問題が無視できると判断した場合、ボタンをクリックして下書きを更新して下さい。"
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
      }
    ],
    "dropZone": {
      "full": "Dondosha faili hapa, au {chooseOne} ili upakie.",
      "chooseOne": "Chagua moja"
    },
    "action": {
      "upload": "pakia",
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
    "warningsText": [
      "Faili hii ya XLSForm inaweza kutumika, lakini ina matatizo yafuatayo yanayowezekana (maonyo ya ubadilishaji).",
      "Tafadhali sahihisha matatizo na ujaribu tena",
      {
        "create": "Ikiwa una uhakika kuwa matatizo haya yanaweza kupuuzwa, bofya kitufe ili kuunda Fomu hata hivyo:",
        "update": "ikiwa una uhakika matatizo haya yanaweza kupuuzwa, bofya kitufe ili kusasisha Rasimu hata hivyo:"
      }
    ]
  }
}
</i18n>
