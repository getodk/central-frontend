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
  <!-- We use v-show rather than v-if so that this.$refs.dropZone is in the DOM
  from the first render. -->
  <div v-show="attachments != null" id="form-attachment-list" ref="dropZone">
    <div class="heading-with-button">
      <button type="button" class="btn btn-primary"
        @click="showModal('uploadFilesModal')">
        <span class="icon-cloud-upload"></span>{{ $t('action.upload') }}&hellip;
      </button>
      <p>{{ $t('heading[0]') }}</p>
      <p>{{ $t('heading[1]') }}</p>
    </div>
    <table id="form-attachment-list-table" class="table">
      <thead>
        <tr>
          <th class="form-attachment-list-type">{{ $t('header.type') }}</th>
          <th class="form-attachment-list-name">{{ $t('header.name') }}</th>
          <th class="form-attachment-list-uploaded">{{ $t('header.uploaded') }}</th>
        </tr>
      </thead>
      <tbody v-if="form != null && attachments != null">
        <form-attachment-row v-for="(attachment, index) in attachments"
          :key="attachment.name" :attachment="attachment"
          :file-is-over-drop-zone="fileIsOverDropZone && !disabled"
          :dragover-attachment="dragoverAttachment"
          :planned-uploads="plannedUploads"
          :updated-attachments="updatedAttachments" :data-index="index"/>
      </tbody>
    </table>
    <form-attachment-popups
      :count-of-files-over-drop-zone="countOfFilesOverDropZone"
      :dragover-attachment="dragoverAttachment"
      :planned-uploads="plannedUploads" :unmatched-files="unmatchedFiles"
      :name-mismatch="nameMismatch" :upload-status="uploadStatus"
      @confirm="uploadFiles" @cancel="cancelUploads"/>

    <form-attachment-upload-files v-bind="uploadFilesModal"
      @hide="hideModal('uploadFilesModal')" @select="afterFileInputSelection"/>
    <form-attachment-name-mismatch :state="nameMismatch.state"
      :planned-uploads="plannedUploads" @hide="hideModal('nameMismatch')"
      @confirm="uploadFiles" @cancel="cancelUploads"/>
  </div>
</template>

<script>
import pako from 'pako/lib/deflate';

import FormAttachmentNameMismatch from './name-mismatch.vue';
import FormAttachmentPopups from './popups.vue';
import FormAttachmentRow from './row.vue';
import FormAttachmentUploadFiles from './upload-files.vue';
import dropZone from '../../mixins/drop-zone';
import modal from '../../mixins/modal';
import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormAttachmentList',
  components: {
    FormAttachmentNameMismatch,
    FormAttachmentPopups,
    FormAttachmentRow,
    FormAttachmentUploadFiles
  },
  mixins: [dropZone(), modal(), request()],
  data() {
    return {
      dragDepth: 0,
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
             - progress. The latest ProgressEvent for the current upload.
        4. Properties set once the uploads have finished or stopped and reset
           once a new drag is started or another file input selection is made
           - updatedAttachments. An array of the attachments for which files
             were successfully uploaded.
      */
      countOfFilesOverDropZone: 0,
      dragoverAttachment: null,
      plannedUploads: [],
      unmatchedFiles: [],
      uploadStatus: {
        total: 0,
        remaining: 0,
        current: null,
        progress: null
      },
      updatedAttachments: [],
      // Modals
      uploadFilesModal: {
        state: false
      },
      nameMismatch: {
        state: false
      },
      // Used for testing
      uploading: false
    };
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(['form', { key: 'attachments', getOption: true }]),
    disabled() {
      return this.uploadStatus.total !== 0;
    }
  },
  methods: {
    ////////////////////////////////////////////////////////////////////////////
    // FILE INPUT

    afterFileInputSelection(files) {
      this.hideModal('uploadFilesModal');
      if (this.updatedAttachments.length !== 0) this.updatedAttachments = [];
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
    ondragenter(jQueryEvent) {
      const { items } = jQueryEvent.originalEvent.dataTransfer;
      this.countOfFilesOverDropZone = this.fileItemCount(items);
      if (this.countOfFilesOverDropZone === 1) {
        const $tr = $(jQueryEvent.target)
          .closest('#form-attachment-list-table tbody tr');
        this.dragoverAttachment = $tr.length !== 0
          ? this.attachments[$tr.data('index')]
          : null;
      }
      this.cancelUploads();
      if (this.updatedAttachments.length !== 0) this.updatedAttachments = [];
    },
    ondragleave() {
      if (!this.fileIsOverDropZone) {
        if (this.countOfFilesOverDropZone === 1) this.dragoverAttachment = null;
        this.countOfFilesOverDropZone = 0;
      }
    },
    ondrop(jQueryEvent) {
      this.countOfFilesOverDropZone = 0;
      const { files } = jQueryEvent.originalEvent.dataTransfer;
      if (this.dragoverAttachment != null) {
        const upload = { attachment: this.dragoverAttachment, file: files[0] };
        this.dragoverAttachment = null;
        this.plannedUploads.push(upload);
        if (upload.file.name === upload.attachment.name)
          this.uploadFiles();
        else
          this.showModal('nameMismatch');
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
        const attachment = this.attachments.find(a => a.name === file.name);
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
    /*
    maybeGzip() takes a file and returns a Promise that, if fulfilled, resolves
    to an object with two properties:

      - data. Either the original File or a Uint8Array of the file's gzipped
        contents. We only gzip the file if it is CSV and large enough that
        gzipping it would have much of an effect.
      - encoding. The value of the Content-Encoding header to specify for the
        data: either 'identity' or 'gzip'.

    When we gzip a CSV file, we read the entire file into memory. That should be
    OK, because any CSV file is likely intended for a data collection client on
    a relatively low-resource device: we expect that a CSV file will not exceed
    a few dozen MBs. */
    maybeGzip(file) {
      // We determine whether the file is CSV using its file extension rather
      // than its MIME type. I think the MIME type for a CSV file should be
      // text/csv, but apparently some clients use application/vnd.ms-excel
      // instead.
      const fileIsCsv = file.name.length >= 4 &&
        file.name.slice(-4).toLowerCase() === '.csv';
      if (!fileIsCsv || file.size < 16000)
        return Promise.resolve({ data: file, encoding: 'identity' });
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const { currentRoute } = this.$store.state.router;
        reader.onload = () => {
          resolve({ data: pako.gzip(reader.result), encoding: 'gzip' });
        };
        reader.onerror = () => {
          if (this.$store.state.router.currentRoute === currentRoute) {
            this.$alert().danger(this.$t('alert.readError', {
              filename: file.name
            }));
          }
          reject(new Error());
        };
        reader.readAsText(file);
      });
    },
    // uploadFile() may mutate `updatedAttachments`.
    uploadFile({ attachment, file }, updatedAttachments) {
      // We decrement uploadStatus.remaining here rather than after the POST so
      // that uploadStatus.remaining and uploadStatus.current continue to be in
      // sync.
      this.uploadStatus.remaining -= 1;
      this.uploadStatus.current = file.name;
      this.uploadStatus.progress = null;
      const { currentRoute } = this.$store.state.router;
      return this.maybeGzip(file)
        .then(({ data, encoding }) => {
          if (this.$store.state.router.currentRoute !== currentRoute)
            throw new Error();
          return this.request({
            method: 'POST',
            url: apiPaths.formDraftAttachment(
              this.form.projectId,
              this.form.xmlFormId,
              attachment.name
            ),
            headers: {
              'Content-Type': file.type,
              'Content-Encoding': encoding
            },
            data,
            onUploadProgress: (progressEvent) => {
              this.uploadStatus.progress = progressEvent;
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
          });
        })
        .then(() => {
          // This may differ a little from updatedAt on the server, but that
          // should be OK.
          const updatedAt = new Date().toISOString();
          updatedAttachments.push(attachment.with({ exists: true, updatedAt }));
        });
    },
    updateAttachment(updatedAttachment) {
      const index = this.attachments.findIndex(attachment =>
        attachment.name === updatedAttachment.name);
      this.$store.commit('setDataProp', {
        key: 'attachments',
        prop: index,
        value: updatedAttachment
      });
    },
    uploadFiles() {
      this.uploading = true;
      this.$alert().blank();
      this.uploadStatus.total = this.plannedUploads.length;
      // This will soon be decremented by 1.
      this.uploadStatus.remaining = this.plannedUploads.length + 1;
      const updated = [];
      // Using `let` and this approach so that uploadStatus.total and
      // uploadStatus.current are initialized in the same tick, and
      // uploadStatus.remaining does not continue to be greater than
      // uploadStatus.total.
      let promise = this.uploadFile(this.plannedUploads[0], updated);
      for (let i = 1; i < this.plannedUploads.length; i += 1) {
        const upload = this.plannedUploads[i];
        promise = promise.then(() => this.uploadFile(upload, updated));
      }
      const { currentRoute } = this.$store.state.router;
      promise
        .catch(noop)
        .finally(() => {
          if (this.$store.state.router.currentRoute !== currentRoute) return;
          if (updated.length === this.uploadStatus.total)
            this.$alert().success(this.$tcn('alert.success', updated.length));
          for (const attachment of updated)
            this.updateAttachment(attachment);
          this.uploadStatus = { total: 0, remaining: 0, current: null, progress: null };
          if (updated.length !== 0) this.updatedAttachments = updated;
          this.uploading = false;
        });
      this.plannedUploads = [];
      this.unmatchedFiles = [];
    }
  }
};
</script>

<style lang="scss">
#form-attachment-list {
  // Extend to the bottom of the page (or slightly beyond it) so that the drop
  // zone includes the entire page below the PageHead.
  min-height: calc(100vh - 146px);
}

#form-attachment-list-table {
  .form-attachment-list-type {
    // Fix the widths of the Type and Name columns so that the width of the
    // Uploaded column is also fixed. We do not want the width of the Uploaded
    // column to change when a Replace label is added to a row.
    max-width: 125px;
    min-width: 125px;
    width: 125px;
  }

  .form-attachment-list-name {
    max-width: 250px;
    min-width: 250px;
    width: 250px;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .form-attachment-list-uploaded {
    // Set the column to a minimum width such that when a Replace label is
    // added to a row, it does not cause additional wrapping.
    min-width: 250px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "upload": "Upload files"
    },
    "heading": [
      "Based on the Form you uploaded, the following files are expected. You can see which ones have been uploaded or are still missing.",
      "To upload files, drag and drop one or more files onto the page."
    ],
    "header": {
      // This is the text of a table column header. The column shows when each
      // Media File was uploaded.
      "uploaded": "Uploaded"
    },
    "problem": {
      // {message} is an error message from the server.
      "noneUploaded": "{message} No files were successfully uploaded.",
      // This string is an error message. It is shown only if the user tried to
      // upload multiple files. {message} is an error message from the server.
      // {uploaded} and {total} are numbers.
      "someUploaded": "{message} Only {uploaded} of {total} files was successfully uploaded. | {message} Only {uploaded} of {total} files were successfully uploaded."
    },
    "alert": {
      "readError": "Something went wrong while reading “{filename}”.",
      "success": "{count} file has been successfully uploaded. | {count} files have been successfully uploaded."
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
      "Na základě nahraného formuláře se očekávají následující soubory. Můžete vidět, které z nich byly nahrány nebo stále chybí.",
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
      "readError": "Při čtení “{filename}” došlo k chybě.",
      "success": "{count} soubor byl úspěšně nahrán. | {count} soubory byly úspěšně nahrány. | {count} souborů bylo úspěšně nahráno. | {count} souborů bylo úspěšně nahráno."
    }
  },
  "de": {
    "action": {
      "upload": "Dateien hochladen"
    },
    "heading": [
      "Bei der Analyse des Formulars ergab sich, dass die folgenden Dateien erwartet werden. Es wird angezeigt, welche Dateien schon hochgeladen wurden und welche noch fehlen.",
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
      "readError": "Etwa hat beim Lesen der Datei \"{filename}\" nicht geklappt.",
      "success": "{count} Datei wurde erfolgreich hochgeladen. | {count} Dateien wurden erfolgreich hochgeladen."
    }
  },
  "es": {
    "action": {
      "upload": "Subir archivos"
    },
    "heading": [
      "Según el formulario que cargó, se esperan los siguientes archivos. Puede ver cuáles se han cargado o aún faltan.",
      "Para cargar archivos, arrastre y suelte uno o más archivos en la página."
    ],
    "header": {
      "uploaded": "Subido"
    },
    "problem": {
      "noneUploaded": "{message} No se cargaron archivos correctamente",
      "someUploaded": "{message} Solo {uploaded} de {total} archivos se cargó correctamente. | {message} Solo {uploaded} de {total} archivos se cargaron correctamente."
    },
    "alert": {
      "readError": "Algo salió mal mientras leía {filename}",
      "success": "{count} archivo se ha cargado correctamente. | {count} archivos se han cargado correctamente."
    }
  },
  "fr": {
    "action": {
      "upload": "Téléverser des fichiers"
    },
    "heading": [
      "A la lecture du formulaire téléversé, les fichiers suivants sont attendus. Vous pouvez voir lesquels ont été téléversé et ceux manquants.",
      "Pour téléverser des fichiers, glissez/déposer un ou plusieurs fichiers sur cette page."
    ],
    "header": {
      "uploaded": "Téléversés"
    },
    "problem": {
      "noneUploaded": "{message} Aucun fichier n'a été correctement téléversé.",
      "someUploaded": "{message} Seulement {uploaded} fichier(s) sur {total} ont été téléversés avec succès. | {message} Seulement {uploaded} fichier(s) sur {total} ont été téléversés avec succès."
    },
    "alert": {
      "readError": "Quelque-chose s'est mal passé pendant la lecture de “{filename}”.",
      "success": "{count} fichier a été correctement téléversé. | {count} fichiers ont été correctement téléversés."
    }
  },
  "id": {
    "action": {
      "upload": "Unggah dokumen"
    },
    "heading": [
      "Berdasarkan formulir yang Anda unggah, beberapa dokumen berikut adalah wajib. Anda dapat melihat mana yang sudah dan belum diunggah.",
      "Untuk mengunggah dokumen, seret dan lepas satu atau lebih dokumen ke laman."
    ],
    "header": {
      "uploaded": "Diunggah"
    },
    "problem": {
      "noneUploaded": "{message} Pengunggahan gagal.",
      "someUploaded": "{message} Hanya {uploaded} dari {total} dokumen berhasil diunggah."
    },
    "alert": {
      "readError": "Terjadi kesalahan saat membaca \"{filename}\".",
      "success": "{count} dokumen berhasil diunggah."
    }
  },
  "ja": {
    "action": {
      "upload": "ファイルのアップロード"
    },
    "heading": [
      "あなたがアップロードしたフォームには、以下のファイルが必要です。どのファイルがアップロードされ、どのファイルが不足してるのかがわかります。",
      "１つ以上のファイルをドラッグ＆ドロップしてアップロードする。"
    ],
    "header": {
      "uploaded": "アップロード済"
    },
    "problem": {
      "noneUploaded": "{message} アップロードに成功したファイルはありません。",
      "someUploaded": "{message} {total}件のファイルの内、{uploaded}件のみがアップロードに成功しました。"
    },
    "alert": {
      "readError": "ファイル\"{filename}\"を読み込み中に問題が発生しました。",
      "success": "{count}のファイルのアップロードに成功"
    }
  }
}
</i18n>
