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
  <div id="form-attachment-list">
    <form-attachment-table
      :file-is-over-drop-zone="countOfFilesOverDropZone !== 0 && !uploading"
      :dragover-attachment="dragoverAttachment"
      :planned-uploads="plannedUploads"
      :updated-attachments="updatedAttachments"
      @link="linkDatasetModal.show({ attachment: $event })"/>
    <p>
      <button id="form-attachment-list-upload-button" type="button"
        class="btn btn-primary" @click="uploadFilesModal.show()">
        <span class="icon-cloud-upload"></span>{{ $t('action.upload') }}
      </button>
      <span>{{ $t('orDrag') }}</span>
    </p>
    <form-attachment-popups
      :count-of-files-over-drop-zone="countOfFilesOverDropZone"
      :dragover-attachment="dragoverAttachment"
      :planned-uploads="plannedUploads" :unmatched-files="unmatchedFiles"
      :name-mismatch="nameMismatch" :upload-status="uploadStatus"
      @confirm="uploadFiles" @cancel="cancelUploads"/>

    <form-attachment-upload-files v-bind="uploadFilesModal"
      @hide="uploadFilesModal.hide()" @select="afterFileInputSelection"/>
    <form-attachment-name-mismatch v-bind="nameMismatch"
      :planned-uploads="plannedUploads" @hide="nameMismatch.hide()"
      @confirm="uploadFiles" @cancel="cancelUploads"/>
    <form-attachment-link-dataset v-bind="linkDatasetModal"
      @hide="linkDatasetModal.hide()" @success="afterLinkDataset"/>
  </div>
</template>

<script>
import FormAttachmentLinkDataset from './link-dataset.vue';
import FormAttachmentNameMismatch from './name-mismatch.vue';
import FormAttachmentPopups from './popups.vue';
import FormAttachmentTable from './table.vue';
import FormAttachmentUploadFiles from './upload-files.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormAttachmentList',
  components: {
    FormAttachmentLinkDataset,
    FormAttachmentNameMismatch,
    FormAttachmentPopups,
    FormAttachmentTable,
    FormAttachmentUploadFiles
  },
  inject: ['alert', 'projectId', 'dragDisabled', 'dragHandler'],
  setup() {
    const { project, form, draftAttachments, datasets } = useRequestData();
    const { request } = useRequest();
    return { project, form, draftAttachments, datasets, request };
  },
  data() {
    return {
      /*
      Most properties fall into exactly one of four groups:

        1. Properties set on dragenter and reset on dragleave or drop
           - countOfFilesOverDropZone. The number of files over the drop zone.
           - dragoverAttachment. Only applicable for
             countOfFilesOverDropZone === 1. When the user drags a single file
             over a row, dragoverAttachment is the attachment that corresponds
             to the row.
        2. Properties that are set once files have been selected (either by a
           drop or using the file input) and that are reset once the uploads
           have started or been canceled
           - plannedUploads. An array of file/attachment pairs, indicating which
             file to upload for which attachment. plannedUploads is used to
             confirm or cancel the uploads, then to start them, but it is not
             used during the uploads themselves.
           - unmatchedFiles. An array of the files whose names did not match any
             attachment's.
        3. Properties set once the uploads have started and reset once they have
           finished or stopped
           - uploadStatus. An object with the following properties:
             - total. The total number of files to upload.
             - remaining. The number of files that have not been uploaded yet.
             - current. The name of the file currently being uploaded.
             - progress. The upload progress for the current upload as a
               fraction.
        4. Properties set once the uploads have finished or stopped and reset
           once a new drag is started or another file input selection is made
           - updatedAttachments. A Set of the names of the attachments for which
             files were successfully uploaded.
      */
      countOfFilesOverDropZone: 0,
      dragoverAttachment: null,
      plannedUploads: [],
      unmatchedFiles: [],
      uploadStatus: {
        total: 0,
        remaining: 0,
        current: null,
        progress: 0
      },
      updatedAttachments: new Set(),
      // Modals
      uploadFilesModal: modalData(),
      nameMismatch: modalData(),
      linkDatasetModal: modalData()
    };
  },
  computed: {
    uploading() {
      return this.uploadStatus.total !== 0;
    }
  },
  watch: {
    'project.dataExists': {
      handler(dataExists) {
        if (dataExists && this.project.datasets > 0) this.fetchDatasets();
      },
      immediate: true
    },
    uploading(uploading) {
      this.dragDisabled = uploading;
    }
  },
  created() {
    this.dragHandler = (event, ...args) => {
      // Delegate to one of the drag and drop methods below (e.g.,
      // this.dragenter()).
      this[event.type]?.(event, ...args);
    };
  },
  beforeUnmount() {
    this.dragHandler = noop;
  },
  methods: {
    ////////////////////////////////////////////////////////////////////////////
    // FILE INPUT

    afterFileInputSelection(files) {
      this.uploadFilesModal.hide();
      this.updatedAttachments.clear();
      this.matchFilesToAttachments(files);
    },

    ////////////////////////////////////////////////////////////////////////////
    // DRAG AND DROP

    // `items` is a DataTransferItemList.
    fileItemCount(items) {
      let count = 0;
      // `items` is not an Array, hence the style of for-loop.
      for (let i = 0; i < items.length; i += 1)
        if (items[i].kind === 'file') count += 1;
      return count;
    },
    // this.dragenter(), this.dragleave(), and this.drop() are called via
    // this.dragHandler.
    dragenter(event) {
      const { items } = event.dataTransfer;
      this.countOfFilesOverDropZone = this.fileItemCount(items);
      if (this.countOfFilesOverDropZone === 1) {
        const tr = event.target.closest('.form-attachment-row');
        this.dragoverAttachment = tr != null
          ? this.draftAttachments.get(tr.dataset.name)
          : null;
      }
      this.cancelUploads();
      this.updatedAttachments.clear();
    },
    dragleave(_, leftDropZone) {
      if (leftDropZone) {
        if (this.countOfFilesOverDropZone === 1) this.dragoverAttachment = null;
        this.countOfFilesOverDropZone = 0;
      }
    },
    drop(event) {
      this.countOfFilesOverDropZone = 0;
      const { files } = event.dataTransfer;
      if (this.dragoverAttachment != null) {
        const upload = { attachment: this.dragoverAttachment, file: files[0] };
        this.dragoverAttachment = null;
        this.plannedUploads.push(upload);
        if (upload.file.name === upload.attachment.name)
          this.uploadFiles();
        else
          this.nameMismatch.show();
      } else {
        // The else case can be reached even if this.countOfFilesOverDropZone
        // was 1, if the drop was not over a row.
        this.matchFilesToAttachments(files);
      }
    },

    ////////////////////////////////////////////////////////////////////////////
    // CORE LOGIC

    matchFilesToAttachments(files) {
      this.plannedUploads = [];
      this.unmatchedFiles = [];
      // files is a FileList, not an Array, hence the style of for-loop.
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const attachment = this.draftAttachments.get(file.name);
        if (attachment != null)
          this.plannedUploads.push({ attachment, file });
        else
          this.unmatchedFiles.push(file);
      }
      // With the changes to this.plannedUploads and this.unmatchedFiles, the
      // popup will show in the next tick.
    },
    // cancelUploads() cancels the uploads before they start, after files have
    // been selected. (It does not cancel an upload in progress.)
    cancelUploads() {
      if (this.plannedUploads.length !== 0) this.plannedUploads = [];
      if (this.unmatchedFiles.length !== 0) this.unmatchedFiles = [];
    },
    // uploadFile() may mutate `updates`.
    uploadFile({ attachment, file }, updates) {
      // We decrement uploadStatus.remaining here rather than after the POST so
      // that uploadStatus.remaining and uploadStatus.current continue to be in
      // sync.
      this.uploadStatus.remaining -= 1;
      this.uploadStatus.current = file.name;
      this.uploadStatus.progress = 0;

      return this.request({
        method: 'POST',
        url: apiPaths.formAttachment(
          this.form.projectId,
          this.form.xmlFormId,
          true,
          attachment.name
        ),
        headers: {
          'Content-Type': file.type,
          'Content-Encoding': 'identity'
        },
        data: file,
        onUploadProgress: (event) => {
          this.uploadStatus.progress = event.progress ?? 0;
        },
        problemToAlert: (problem) => {
          const { total } = this.uploadStatus;
          if (total === 1) return null;
          const uploaded = total - this.uploadStatus.remaining;
          if (uploaded === 0)
            return this.$t('problem.noneUploaded', problem);
          return this.$tc('problem.someUploaded', uploaded, {
            message: problem.message,
            uploaded: this.$n(uploaded, 'default'),
            total: this.$n(total, 'default')
          });
        }
      })
        .then(({ data }) => { updates.push(data); });
    },
    uploadFiles() {
      this.alert.blank();
      this.uploadStatus.total = this.plannedUploads.length;
      // This will soon be decremented by 1.
      this.uploadStatus.remaining = this.plannedUploads.length + 1;
      const updates = [];
      // Using `let` and this approach so that uploadStatus.total and
      // uploadStatus.current are initialized in the same tick, and
      // uploadStatus.remaining does not continue to be greater than
      // uploadStatus.total.
      let promise = this.uploadFile(this.plannedUploads[0], updates);
      for (let i = 1; i < this.plannedUploads.length; i += 1) {
        const upload = this.plannedUploads[i];
        promise = promise.then(() => this.uploadFile(upload, updates));
      }
      const initialRoute = this.$route;
      promise
        .catch(noop)
        .finally(() => {
          if (this.$route !== initialRoute) return;
          if (updates.length === this.uploadStatus.total)
            this.alert.success(this.$tcn('alert.success', updates.length));

          for (const updatedAttachment of updates) {
            const { name } = updatedAttachment;
            this.draftAttachments.set(name, updatedAttachment);
            this.updatedAttachments.add(name);
          }

          this.uploadStatus = { total: 0, remaining: 0, current: null, progress: 0 };
        });
      this.plannedUploads = [];
      this.unmatchedFiles = [];
    },
    fetchDatasets() {
      this.datasets.request({
        url: apiPaths.datasets(this.projectId),
        resend: false
      }).catch(noop);
    },
    afterLinkDataset(updatedAttachment) {
      this.linkDatasetModal.hide();
      this.alert.success(this.$t('alert.link', {
        attachmentName: updatedAttachment.name
      }));
      this.draftAttachments.set(updatedAttachment.name, updatedAttachment);
    }
  }
};
</script>

<style lang="scss">
#form-attachment-list-upload-button {
  margin-right: 5px;

  + span { color: #999; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "upload": "Choose files"
    },
    // This text is shown next to a button with the text "Choose files".
    "orDrag": "or drag files onto this page to upload",
    "problem": {
      // {message} is an error message from the server.
      "noneUploaded": "{message} No files were successfully uploaded.",
      // This string is an error message. It is shown only if the user tried to
      // upload multiple files. {message} is an error message from the server.
      // {uploaded} and {total} are numbers. {uploaded} is at least 1, and
      // {total} is at least 2. The string will be pluralized based on
      // {uploaded}.
      "someUploaded": "{message} Only {uploaded} of {total} files was successfully uploaded. | {message} Only {uploaded} of {total} files were successfully uploaded."
    },
    "alert": {
      "success": "{count} file has been successfully uploaded. | {count} files have been successfully uploaded.",
      "link": "Entity List linked successfully."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "upload": "Nahrát soubory"
    },
    "heading": [
      "Na základě nahraného formuláře se očekávají následující přílohy formuláře. Můžete se podívat, které z nich byly poskytnuty nebo které ještě chybí.",
      "Chcete-li nahrát soubory, přetáhněte jeden nebo více souborů na stránku."
    ],
    "header": {
      "uploaded": "Nahráno"
    },
    "problem": {
      "noneUploaded": "{message} Nebyly nahrány žádné soubory.",
      "someUploaded": "{message} Úspěšně byl nahrán pouze {uploaded} soubor ze {total}. | {message} Úspěšně byly nahrány pouze {uploaded} soubory z {total}. | {message} Úspěšně bylo nahráno pouze {uploaded} souborů z {total}. | {message} Úspěšně bylo nahráno pouze {uploaded} souborů z {total}."
    },
    "alert": {
      "success": "{count} soubor byl úspěšně nahrán. | {count} soubory byly úspěšně nahrány. | {count} souborů bylo úspěšně nahráno. | {count} souborů bylo úspěšně nahráno.",
      "link": "Seznam entit byl úspěšně propojen."
    },
    "entitiesTesting": {
      "title": "Testování entit",
      "body": [
        "Jedna nebo více příloh formuláře mají názvy souborů shodné s názvy seznamu entit. Ty jsou ve výchozím nastavení propojeny se seznamy entit. Pro účely testování můžete chtít nahrát dočasná data jako soubory .csv a poté je propojit se seznamy entit, jakmile ověříte logiku formuláře."
      ]
    }
  },
  "de": {
    "action": {
      "upload": "Dateien hochladen"
    },
    "heading": [
      "Bei der Analyse des Formulars ergab sich, dass die folgenden Formularanhänge erwartet. Es wird angezeigt, welche Formularanhänge schon hochgeladen wurden und welche noch fehlen.",
      "Um Dateien hochzuladen, verwenden Sie Drag-and-Drop auf die Seite."
    ],
    "header": {
      "uploaded": "Hochgeladen"
    },
    "problem": {
      "noneUploaded": "{message} Es wurden keine Dateien erfolgreich hochgeladen.",
      "someUploaded": "{message} Nur {uploaded} von {total} Dateien wurde erfolgreich hochgeladen. | {message} Nur {uploaded} von {total} Dateien wurden erfolgreich hochgeladen."
    },
    "alert": {
      "success": "{count} Datei wurde erfolgreich hochgeladen. | {count} Dateien wurden erfolgreich hochgeladen.",
      "link": "Entitätsliste erfolgreich verknüpft."
    },
    "entitiesTesting": {
      "title": "Entitäten testen",
      "body": [
        "Mindestens ein Formularanhang hat Dateinamen, die mit Datensatznamen übereinstimmen. Standardmässig sind diese mit Datensätzen verknüpft. Zu Testzwecken können Sie temporäre Daten als CSV-Dateien hochladen und dann eine Verknüpfung zu den Datensätzen herstellen, sobald Sie Ihre Formularlogik überprüft haben."
      ]
    }
  },
  "es": {
    "action": {
      "upload": "Subir archivos"
    },
    "heading": [
      "Según el formulario que cargó, se esperan los siguientes archivos adjuntos del formulario. Puede ver cuáles se han proporcionado o cuáles aún faltan.",
      "Para cargar archivos, arrastre y suelte uno o más archivos en la página."
    ],
    "header": {
      "uploaded": "Subido"
    },
    "problem": {
      "noneUploaded": "{message} No se cargaron archivos correctamente",
      "someUploaded": "{message} Solo {uploaded} de {total} archivos se cargó correctamente. | {message} Solo {uploaded} de {total} archivos se cargaron correctamente. | {message} Solo {uploaded} de {total} archivos se cargaron correctamente."
    },
    "alert": {
      "success": "{count} archivo se ha cargado correctamente. | {count} archivos se han cargado correctamente. | {count} archivos se han cargado correctamente.",
      "link": "Lista de entidades enlazada correctamente."
    },
    "entitiesTesting": {
      "title": "Comprobación de las entidades",
      "body": [
        "Uno o más archivos adjuntos de formulario tienen nombres de archivo que coinciden con los nombres de la lista de entidades. De forma predeterminada, están vinculados a listas de entidades. Para realizar pruebas, es posible que desee cargar datos temporales como archivos .csv y luego vincularlos a las Listas de entidades una vez que haya verificado la lógica de su formulario."
      ]
    }
  },
  "fr": {
    "action": {
      "upload": "Téléverser des fichiers"
    },
    "heading": [
      "Selon le formulaire que vous avez envoyé, les fichiers joints suivantes sont attendues. Vous pouvez voir ceux qui ont été fournis ou qui sont encore manquants.",
      "Pour téléverser des fichiers, glissez/déposer un ou plusieurs fichiers sur cette page."
    ],
    "header": {
      "uploaded": "Téléversés"
    },
    "problem": {
      "noneUploaded": "{message} Aucun fichier n'a été correctement téléversé.",
      "someUploaded": "{message} Seulement {uploaded} fichier(s) sur {total} ont été téléversés avec succès. | {message} Seulement {uploaded} fichier(s) sur {total} ont été téléversés avec succès. | {message} Seulement {uploaded} fichier(s) sur {total} ont été téléversés avec succès."
    },
    "alert": {
      "success": "{count} fichier a été correctement téléversé. | {count} fichiers ont été correctement téléversés. | {count} fichiers ont été correctement téléversés.",
      "link": "Liste d'entités liée avec succès."
    },
    "entitiesTesting": {
      "title": "Tester les entités",
      "body": [
        "Un ou plusieurs fichiers joints ont des noms de fichiers qui correspondent à des noms de listes d'entités. Par défaut, ils sont liés aux listes d'entités. Pour tester, vous pouvez joindre des fichiers .csv de données temporaires. Vous pourrez ensuite rétablir les liens aux listes d'entités une fois que vous aurez vérifié la logique de votre formulaire."
      ]
    }
  },
  "id": {
    "action": {
      "upload": "Unggah dokumen"
    },
    "header": {
      "uploaded": "Diunggah"
    },
    "problem": {
      "noneUploaded": "{message} Pengunggahan gagal.",
      "someUploaded": "{message} Hanya {uploaded} dari {total} dokumen berhasil diunggah."
    },
    "alert": {
      "success": "{count} dokumen berhasil diunggah."
    }
  },
  "it": {
    "action": {
      "upload": "Caricare files"
    },
    "heading": [
      "In base al formulario che hai caricato, sono previsti i seguenti allegati al formulario. Puoi vedere quali sono stati forniti o mancano ancora.",
      "Per caricare file, trascina e rilascia uno o più file sulla pagina."
    ],
    "header": {
      "uploaded": "Caricati"
    },
    "problem": {
      "noneUploaded": "{message} Nessun file è stato caricato correttamente.",
      "someUploaded": "{message} Solamente {uploaded} su {total} files è stato caricato con successo | {message} Solamente {uploaded} su {total} files sono stati caricati con successo | {message} Solamente {uploaded} su {total} files sono stati caricati con successo"
    },
    "alert": {
      "success": "{count} file è stato caricato con successo | {count} files sono stati caricati con successo | {count} files sono stati caricati con successo",
      "link": "Lista Entità collegata correttamente."
    },
    "entitiesTesting": {
      "title": "Testando le Entità",
      "body": [
        "Uno o più allegati del formulario hanno nomi di file che corrispondono ai nomi della Lista Entità. Per impostazione predefinita, questi sono collegati alle Liste Entità. Per il test, potresti voler caricare dati temporanei come file .csv, quindi collegarti alle Liste Entità dopo aver verificato la logica del formulario."
      ]
    }
  },
  "ja": {
    "action": {
      "upload": "ファイルのアップロード"
    },
    "header": {
      "uploaded": "アップロード済"
    },
    "problem": {
      "noneUploaded": "{message} アップロードに成功したファイルはありません。",
      "someUploaded": "{message} {total}件のファイルの内、{uploaded}件のみがアップロードに成功しました。"
    },
    "alert": {
      "success": "{count}のファイルのアップロードに成功"
    }
  },
  "pt": {
    "action": {
      "upload": "Subir arquivos"
    },
    "heading": [
      "Com base no formulário que você carregou, os seguintes anexos de formulário são esperados. Você pode ver quais foram fornecidos ou ainda estão faltando.",
      "Para carregar arquivos, arraste e solte um ou mais arquivos nessa página"
    ],
    "header": {
      "uploaded": "Carregado"
    },
    "problem": {
      "noneUploaded": "{message}Nenhum arquivo foi carregado.",
      "someUploaded": "{message} Apenas {uploaded} de{total} arquivo foi carregado com sucesso. | {message}Apenas {uploaded}de {total}arquivos foram carregados com sucesso. | {message}Apenas {uploaded}de {total}arquivos foram carregados com sucesso."
    },
    "alert": {
      "success": "{count} arquivo foi carregado com sucesso. | {count} arquivos foram carregados com sucesso. | {count} arquivos foram carregados com sucesso.",
      "link": "Lista de Entidades vinculada com sucesso."
    },
    "entitiesTesting": {
      "title": "Testando Entidades",
      "body": [
        "Um ou mais Anexos do Formulário têm nomes de arquivo que correspondem aos nomes da Lista de Entidades. Por padrão, eles são vinculados às listas de entidades. Para testar, você pode querer carregar dados temporários como arquivos .csv e, em seguida, vincular às listas de entidades depois de verificar a lógica do seu formulário."
      ]
    }
  },
  "sw": {
    "action": {
      "upload": "Pakia faili"
    },
    "heading": [
      "Kulingana na Fomu uliyopakia, Viambatisho vya Fomu vifuatavyo vinatarajiwa. Unaweza kuona ni zipi zimetolewa au bado hazipo.",
      "Ili kupakia faili, buruta na udondoshe faili moja au zaidi kwenye ukurasa"
    ],
    "header": {
      "uploaded": "Imepakiwa"
    },
    "problem": {
      "noneUploaded": "{message} Hakuna faili zilizopakiwa.",
      "someUploaded": "{message} {uploaded} pekee kati ya faili {total} ndizo zilizopakiwa. | {message} {uploaded} pekee kati ya faili {total} ndizo zilizopakiwa."
    },
    "alert": {
      "success": "faili {count} imepakiwa. | faili {count} zimepakiwa.",
      "link": "Orodha ya Huluki imeunganishwa."
    },
    "entitiesTesting": {
      "title": "Vyombo vya Kujaribu",
      "body": [
        "Kiambatisho cha Fomu kimoja au zaidi kina majina ya faili yanayolingana na majina ya Orodha ya Huluki. Kwa chaguomsingi, hizo zimeunganishwa kwenye Orodha za Huluki. Kwa majaribio, unaweza kutaka kupakia data ya muda kama faili za .csv, kisha uunganishe kwenye Orodha za Huluki mara tu utakapothibitisha mantiki ya fomu yako."
      ]
    }
  },
  "zh-Hant": {
    "action": {
      "upload": "上傳檔案"
    },
    "heading": [
      "根據您上傳的表格，需要以下表格附件。您可以查看哪些已提供或仍然缺少。",
      "若要上傳文件，請將一個或多個文件拖曳到頁面上。"
    ],
    "header": {
      "uploaded": "已上傳"
    },
    "problem": {
      "noneUploaded": "{message} 沒有文件上傳成功。",
      "someUploaded": "{message} 僅 {uploaded} 個檔案成功上傳，共 {total} 個檔案。"
    },
    "alert": {
      "success": "{count} 個文件已成功上傳。",
      "link": "實體列表連結成功。"
    },
    "entitiesTesting": {
      "title": "測試實體",
      "body": [
        "一個或多個表單附件的檔案名稱與實體清單名稱相符。預設情況下，這些連結到實體列表。為了進行測試，您可能需要將臨時資料上傳為 .csv 文件，然後在驗證表單邏輯後連結到實體清單。"
      ]
    }
  }
}
</i18n>
