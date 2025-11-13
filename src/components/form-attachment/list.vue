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
  inject: ['toast', 'redAlert', 'projectId', 'dragDisabled', 'dragHandler'],
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
      this.toast.hide();
      this.redAlert.hide();
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
            this.toast.show(this.$tcn('alert.success', updates.length));

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
      this.toast.show(this.$t('alert.link', {
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
      "link": "Entity List successfully linked."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "problem": {
      "noneUploaded": "{message} Nebyly nahrány žádné soubory.",
      "someUploaded": "{message} Úspěšně byl nahrán pouze {uploaded} soubor ze {total}. | {message} Úspěšně byly nahrány pouze {uploaded} soubory z {total}. | {message} Úspěšně bylo nahráno pouze {uploaded} souborů z {total}. | {message} Úspěšně bylo nahráno pouze {uploaded} souborů z {total}."
    },
    "alert": {
      "success": "{count} soubor byl úspěšně nahrán. | {count} soubory byly úspěšně nahrány. | {count} souborů bylo úspěšně nahráno. | {count} souborů bylo úspěšně nahráno."
    }
  },
  "de": {
    "action": {
      "upload": "Dateien auswählen"
    },
    "orDrag": "oder ziehen Sie Dateien zum Hochladen auf diese Seite",
    "problem": {
      "noneUploaded": "{message} Es wurden keine Dateien erfolgreich hochgeladen.",
      "someUploaded": "{message} Nur {uploaded} von {total} Dateien wurde erfolgreich hochgeladen. | {message} Nur {uploaded} von {total} Dateien wurden erfolgreich hochgeladen."
    },
    "alert": {
      "success": "{count} Datei wurde erfolgreich hochgeladen. | {count} Dateien wurden erfolgreich hochgeladen.",
      "link": "Objektliste erfolgreich verknüpft."
    }
  },
  "es": {
    "action": {
      "upload": "Elegir archivos"
    },
    "orDrag": "o arrastre archivos a esta página para cargarlos",
    "problem": {
      "noneUploaded": "{message} No se cargaron archivos correctamente",
      "someUploaded": "{message} Solo {uploaded} de {total} archivos se cargó correctamente. | {message} Solo {uploaded} de {total} archivos se cargaron correctamente. | {message} Solo {uploaded} de {total} archivos se cargaron correctamente."
    },
    "alert": {
      "success": "{count} archivo se ha cargado correctamente. | {count} archivos se han cargado correctamente. | {count} archivos se han cargado correctamente.",
      "link": "Lista de entidades enlazada correctamente."
    }
  },
  "fr": {
    "action": {
      "upload": "Choisir les fichiers"
    },
    "orDrag": "ou glisser les fichiers dans cette page pour les téléverser",
    "problem": {
      "noneUploaded": "{message} Aucun fichier n'a été correctement téléversé.",
      "someUploaded": "{message} Seulement {uploaded} fichier(s) sur {total} ont été téléversés avec succès. | {message} Seulement {uploaded} fichier(s) sur {total} ont été téléversés avec succès. | {message} Seulement {uploaded} fichier(s) sur {total} ont été téléversés avec succès."
    },
    "alert": {
      "success": "{count} fichier a été correctement téléversé. | {count} fichiers ont été correctement téléversés. | {count} fichiers ont été correctement téléversés.",
      "link": "Liste d'entités liée avec succès."
    }
  },
  "id": {
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
      "upload": "Scegli files"
    },
    "orDrag": "o trascinare i file su questa pagina per caricarli",
    "problem": {
      "noneUploaded": "{message} Nessun file è stato caricato correttamente.",
      "someUploaded": "{message} Solamente {uploaded} su {total} files è stato caricato con successo | {message} Solamente {uploaded} su {total} files sono stati caricati con successo | {message} Solamente {uploaded} su {total} files sono stati caricati con successo"
    },
    "alert": {
      "success": "{count} file è stato caricato con successo | {count} files sono stati caricati con successo | {count} files sono stati caricati con successo",
      "link": "Lista Entità correttamente collegata."
    }
  },
  "ja": {
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
      "upload": "Escolher arquivos"
    },
    "orDrag": "ou arraste arquivos aqui para carregar",
    "problem": {
      "noneUploaded": "{message} Nenhum arquivo foi carregado.",
      "someUploaded": "{message} Apenas {uploaded} de {total} arquivo foi carregado com sucesso. | {message} Apenas {uploaded} de {total} arquivos foram carregados com sucesso. | {message} Apenas {uploaded} de {total} arquivos foram carregados com sucesso."
    },
    "alert": {
      "success": "{count} arquivo foi carregado com sucesso. | {count} arquivos foram carregados com sucesso. | {count} arquivos foram carregados com sucesso.",
      "link": "Lista de Entidades vinculada com sucesso."
    }
  },
  "sw": {
    "problem": {
      "noneUploaded": "{message} Hakuna faili zilizopakiwa.",
      "someUploaded": "{message} {uploaded} pekee kati ya faili {total} ndizo zilizopakiwa. | {message} {uploaded} pekee kati ya faili {total} ndizo zilizopakiwa."
    },
    "alert": {
      "success": "faili {count} imepakiwa. | faili {count} zimepakiwa."
    }
  },
  "zh": {
    "action": {
      "upload": "选择文件"
    },
    "orDrag": "或将文件拖拽至此以上传",
    "problem": {
      "noneUploaded": "{message}没有文件上传成功。",
      "someUploaded": "{message} 成功上传 {uploaded}/{total} 个文件。"
    },
    "alert": {
      "success": "{count}个文件已成功上传。",
      "link": "实体清单已成功关联。"
    }
  },
  "zh-Hant": {
    "action": {
      "upload": "選擇檔案"
    },
    "orDrag": "或將檔案拖曳至此頁上傳",
    "problem": {
      "noneUploaded": "{message} 沒有文件上傳成功。",
      "someUploaded": "{message} 僅 {uploaded} 個檔案成功上傳，共 {total} 個檔案。"
    },
    "alert": {
      "success": "{count} 個文件已成功上傳。",
      "link": "實體清單已成功連結。"
    }
  }
}
</i18n>
