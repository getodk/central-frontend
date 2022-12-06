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
  <div id="form-attachment-list" ref="dropZone">
    <div class="heading-with-button">
      <button type="button" class="btn btn-primary"
        @click="showModal('uploadFilesModal')">
        <span class="icon-cloud-upload"></span>{{ $t('action.upload') }}&hellip;
      </button>
      <p>{{ $t('heading[0]') }}</p>
      <p>{{ $t('heading[1]') }}</p>
    </div>
    <div v-if="datasetLinkable" class="panel-dialog">
      <div class="panel-heading">
        <span class="panel-title">
          <span class="icon-database"></span>
          {{ $t('common.datasetsPreview') }}
        </span>
      </div>
      <div class="panel-body">
        <p>
          <span>{{ $t('datasetsPreview.body[0]') }}</span>
          <sentence-separator/>
          <i18n-t keypath="moreInfo.clickHere.full">
            <template #clickHere>
              <doc-link to="central-datasets/">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
            </template>
          </i18n-t>
        </p>
      </div>
    </div>
    <table id="form-attachment-list-table" class="table">
      <thead>
        <tr>
          <th class="form-attachment-list-type">{{ $t('header.type') }}</th>
          <th class="form-attachment-list-name">{{ $t('header.name') }}</th>
          <th class="form-attachment-list-uploaded">{{ $t('header.uploaded') }}</th>
          <th class="form-attachment-list-action"></th>
        </tr>
      </thead>
      <tbody v-if="form.dataExists && attachments.dataExists">
        <form-attachment-row v-for="attachment of attachments.values()"
          :key="attachment.name" :attachment="attachment"
          :file-is-over-drop-zone="fileIsOverDropZone && !disabled"
          :dragover-attachment="dragoverAttachment"
          :planned-uploads="plannedUploads"
          :updated-attachments="updatedAttachments" :data-name="attachment.name"
          :linkable="attachment.type === 'file' && !!dsHashset && dsHashset.has(attachment.name.replace(/\.[^.]+$/i, ''))"
          @link="showLinkDatasetModal($event)"/>
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


    <form-attachment-link-dataset v-bind="linkDatasetModal" @hide="hideModal('linkDatasetModal')"
      @success="afterLinkDataset"/>
  </div>
</template>

<script>
import { any } from 'ramda';
import pako from 'pako/lib/deflate';
import { markRaw } from 'vue';
import FormAttachmentNameMismatch from './name-mismatch.vue';
import FormAttachmentPopups from './popups.vue';
import FormAttachmentRow from './row.vue';
import FormAttachmentUploadFiles from './upload-files.vue';
import FormAttachmentLinkDataset from './link-dataset.vue';
import DocLink from '../doc-link.vue';
import dropZone from '../../mixins/drop-zone';
import modal from '../../mixins/modal';
import request from '../../mixins/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';
import SentenceSeparator from '../sentence-separator.vue';

export default {
  name: 'FormAttachmentList',
  components: {
    FormAttachmentNameMismatch,
    FormAttachmentPopups,
    FormAttachmentRow,
    FormAttachmentUploadFiles,
    FormAttachmentLinkDataset,
    DocLink,
    SentenceSeparator
  },
  mixins: [dropZone(), modal(), request()],
  inject: ['alert'],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  setup() {
    const { project, form, resourceView, datasets } = useRequestData();
    const attachments = resourceView('attachments', (data) => data.get());
    return { project, form, attachments, datasets };
  },
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
        progress: null
      },
      updatedAttachments: new Set(),
      // Modals
      uploadFilesModal: {
        state: false
      },
      nameMismatch: {
        state: false
      },
      linkDatasetModal: {
        state: false,
        attachmentName: ''
      },
      // Used for testing
      uploading: false
    };
  },
  computed: {
    disabled() {
      return this.uploadStatus.total !== 0;
    },
    dsHashset() {
      return this.datasets.dataExists ? new Set(this.datasets.map(d => `${d.name}`)) : null;
    },
    datasetLinkable() {
      return this.attachments.dataExists &&
        this.dsHashset &&
        any(a => a.type === 'file' && this.dsHashset.has(a.name.replace(/\.[^.]+$/i, '')), Array.from(this.attachments.values()));
    }
  },
  watch: {
    'project.dataExists': {
      handler(dataExists) {
        if (dataExists && this.project.datasets > 0) this.fetchDatasets();
      },
      immediate: true
    }
  },
  methods: {
    ////////////////////////////////////////////////////////////////////////////
    // FILE INPUT

    afterFileInputSelection(files) {
      this.hideModal('uploadFilesModal');
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
    ondragenter(jQueryEvent) {
      const { items } = jQueryEvent.originalEvent.dataTransfer;
      this.countOfFilesOverDropZone = this.fileItemCount(items);
      if (this.countOfFilesOverDropZone === 1) {
        const tr = jQueryEvent.target
          .closest('#form-attachment-list-table tbody tr');
        this.dragoverAttachment = tr != null
          ? this.attachments.get(tr.dataset.name)
          : null;
      }
      this.cancelUploads();
      this.updatedAttachments.clear();
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
        const attachment = this.attachments.get(file.name);
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
    a few dozen MBs.

    Note that the development main.nginx.conf does not support request body
    decompression. That means that in development, if this component gzips a CSV
    file, Backend will store the gzipped contents rather than the file's
    original contents.
    */
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
        const initialRoute = this.$route;
        reader.onload = () => {
          resolve({ data: pako.gzip(reader.result), encoding: 'gzip' });
        };
        reader.onerror = () => {
          if (this.$route === initialRoute) {
            this.alert.danger(this.$t('alert.readError', {
              filename: file.name
            }));
          }
          reject(new Error());
        };
        reader.readAsText(file);
      });
    },
    // uploadFile() may mutate `updates`.
    uploadFile({ attachment, file }, updates) {
      // We decrement uploadStatus.remaining here rather than after the POST so
      // that uploadStatus.remaining and uploadStatus.current continue to be in
      // sync.
      this.uploadStatus.remaining -= 1;
      this.uploadStatus.current = file.name;
      this.uploadStatus.progress = null;
      const initialRoute = this.$route;
      return this.maybeGzip(file)
        .then(({ data, encoding }) => {
          if (this.$route !== initialRoute) throw new Error();
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
              this.uploadStatus.progress = markRaw(progressEvent);
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
          updates.push([attachment.name, updatedAt]);
        });
    },
    uploadFiles() {
      this.uploading = true;
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
          this.attachments.patch(() => {
            for (const [name, updatedAt] of updates) {
              const attachment = this.attachments.get(name);
              attachment.blobExists = true;
              attachment.datasetExists = false;
              attachment.exists = true;
              attachment.updatedAt = updatedAt;

              this.updatedAttachments.add(name);
            }
          });
          this.uploadStatus = { total: 0, remaining: 0, current: null, progress: null };
          this.uploading = false;
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
    showLinkDatasetModal({ name, blobExists }) {
      this.linkDatasetModal.attachmentName = name;
      this.linkDatasetModal.blobExists = blobExists;
      this.showModal('linkDatasetModal');
    },
    afterLinkDataset() {
      this.alert.success(this.$t('alert.link', {
        attachmentName: this.linkDatasetModal.attachmentName
      }));

      this.attachments.patch(() => {
        const attachment = this.attachments.get(this.linkDatasetModal.attachmentName);
        attachment.datasetExists = true;
        attachment.blobExists = false;
        attachment.exists = true;
      });

      this.hideModal('linkDatasetModal');
    }
  }
};
</script>

<style lang="scss">
#form-attachment-list {
  // Extend to the bottom of the page (or slightly beyond it) so that the drop
  // zone includes the entire page below the PageHead.
  min-height: calc(100vh - 146px);

  .panel-dialog {
    margin-top: -5px;
    margin-bottom: 25px;
  }
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
    min-width: 300px;

    // So that column doesn't grow infinitely
    width: 1px;
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
      "Based on the Form you uploaded, the following Form Attachments are expected. You can see which ones have been provided or are still missing.",
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
      // {uploaded} and {total} are numbers. {uploaded} is at least 1, and
      // {total} is at least 2. The string will be pluralized based on
      // {uploaded}.
      "someUploaded": "{message} Only {uploaded} of {total} files was successfully uploaded. | {message} Only {uploaded} of {total} files were successfully uploaded."
    },
    "alert": {
      "readError": "Something went wrong while reading “{filename}”.",
      "success": "{count} file has been successfully uploaded. | {count} files have been successfully uploaded.",
      "link": "Dataset linked successfully."
    },
    "datasetsPreview": {
      "body": [
        "One or more Form Attachments have filenames that match Dataset names. By default, those are linked to Datasets. For testing, you may want to upload temporary data as .csv files, then link to the Datasets once you have verified your form logic."
      ]
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
      "readError": "Při čtení “{filename}” došlo k chybě.",
      "success": "{count} soubor byl úspěšně nahrán. | {count} soubory byly úspěšně nahrány. | {count} souborů bylo úspěšně nahráno. | {count} souborů bylo úspěšně nahráno.",
      "link": "Datová sada byla úspěšně propojena."
    },
    "datasetsPreview": {
      "body": [
        "Jedna nebo více příloh formuláře mají názvy souborů shodné s názvy datových sad. Ve výchozím nastavení jsou tyto soubory propojeny s datovými sadami. Pro účely testování můžete chtít nahrát dočasná data jako soubory .csv a poté je propojit s Datasety, jakmile ověříte logiku formuláře."
      ]
    }
  },
  "de": {
    "action": {
      "upload": "Dateien hochladen"
    },
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
    "header": {
      "uploaded": "Subido"
    },
    "problem": {
      "noneUploaded": "{message} No se cargaron archivos correctamente",
      "someUploaded": "{message} Solo {uploaded} de {total} archivos se cargó correctamente. | {message} Solo {uploaded} de {total} archivos se cargaron correctamente. | {message} Solo {uploaded} de {total} archivos se cargaron correctamente."
    },
    "alert": {
      "readError": "Algo salió mal mientras leía {filename}",
      "success": "{count} archivo se ha cargado correctamente. | {count} archivos se han cargado correctamente. | {count} archivos se han cargado correctamente."
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
      "readError": "Quelque-chose s'est mal passé pendant la lecture de “{filename}”.",
      "success": "{count} fichier a été correctement téléversé. | {count} fichiers ont été correctement téléversés. | {count} fichiers ont été correctement téléversés.",
      "link": "Dataset lié avec succès"
    },
    "datasetsPreview": {
      "body": [
        "Un ou plusieurs fichiers joints ont des noms de fichiers qui correspondent à des noms de Datasets. Par défaut, ils sont liés aux Datasets. Pour tester, vous pouvez envoyer des de fichiers .csv de données temporaires, puis les lier aux Datasets une fois que vous aurez vérifié la logique de votre formulaire."
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
      "readError": "Terjadi kesalahan saat membaca \"{filename}\".",
      "success": "{count} dokumen berhasil diunggah."
    }
  },
  "it": {
    "action": {
      "upload": "Caricare files"
    },
    "header": {
      "uploaded": "Caricati"
    },
    "problem": {
      "noneUploaded": "{message} Nessun file è stato caricato correttamente.",
      "someUploaded": "{message} Solamente {uploaded} su {total} files è stato caricato con successo | {message} Solamente {uploaded} su {total} files sono stati caricati con successo | {message} Solamente {uploaded} su {total} files sono stati caricati con successo"
    },
    "alert": {
      "readError": "Qualcosa è andato storto durante la lettura di \"{filename}\".",
      "success": "{count} file è stato caricato con successo | {count} files sono stati caricati con successo | {count} files sono stati caricati con successo"
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
      "readError": "ファイル\"{filename}\"を読み込み中に問題が発生しました。",
      "success": "{count}のファイルのアップロードに成功"
    }
  },
  "sw": {
    "action": {
      "upload": "Pakia faili"
    },
    "header": {
      "uploaded": "Imepakiwa"
    },
    "problem": {
      "noneUploaded": "{message} Hakuna faili zilizopakiwa.",
      "someUploaded": "{message} {uploaded} pekee kati ya faili {total} ndizo zilizopakiwa. | {message} {uploaded} pekee kati ya faili {total} ndizo zilizopakiwa."
    },
    "alert": {
      "readError": "Hitilafu fulani imetokea wakati wa kusoma \"{filename}\"",
      "success": "faili {count} imepakiwa. | faili {count} zimepakiwa."
    }
  }
}
</i18n>
