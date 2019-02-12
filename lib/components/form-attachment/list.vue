<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="form-attachment-list" ref="dropZone">
    <div id="form-attachment-list-heading">
      <button class="btn btn-primary" type="button"
        @click="showModal('uploadFilesModal')">
        <span class="icon-cloud-upload"></span>Upload files
      </button>
      <div>
        Based on the form you uploaded, the following files are expected. You
        can see which ones have been uploaded or are still missing.
      </div>
      <div>To upload files, drag and drop one or more files onto the page.</div>
    </div>
    <table id="form-attachment-list-table" class="table">
      <thead>
        <tr>
          <th class="form-attachment-list-type">Type</th>
          <th class="form-attachment-list-name">Name</th>
          <th class="form-attachment-list-uploaded">Uploaded</th>
        </tr>
      </thead>
      <tbody>
        <form-attachment-row v-for="(attachment, index) in attachments"
          :key="attachment.key" :project-id="projectId" :form="form"
          :attachment="attachment"
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

export default {
  name: 'FormAttachmentList',
  components: {
    FormAttachmentNameMismatch,
    FormAttachmentPopups,
    FormAttachmentRow,
    FormAttachmentUploadFiles
  },
  mixins: [
    dropZone({ keepAlive: true, eventNamespace: 'form-attachment-list' }),
    modal(['uploadFilesModal', 'nameMismatch']),
    request()
  ],
  // Setting this in order to ignore attributes from FormShow that are intended
  // for other form-related components.
  inheritAttrs: false,
  props: {
    projectId: {
      type: String,
      required: true
    },
    form: {
      type: Object,
      required: true
    },
    attachments: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      /*
      Most properties fall into exactly one of four groups:

        1. Properties set on dragenter and reset on dragleave or drop
           - fileIsOverDropZone. Indicates whether there is a file over the drop
             zone. Its value is managed by the dropZone mixin.
           - countOfFilesOverDropZone. The number of files over the drop zone.
             It is -1 if there are files, but we do not know how many (an issue
             in IE).
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
      fileIsOverDropZone: false,
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
    disabled() {
      return this.uploadStatus.total !== 0;
    }
  },
  methods: {
    ////////////////////////////////////////////////////////////////////////////
    // FILE INPUT

    afterFileInputSelection(files) {
      this.uploadFilesModal.state = false;
      if (this.updatedAttachments.length !== 0) this.updatedAttachments = [];
      this.matchFilesToAttachments(files);
    },

    ////////////////////////////////////////////////////////////////////////////
    // DRAG AND DROP

    // maybeItems is either a DataTransferItemList or null.
    fileItemCount(maybeItems) {
      // IE
      if (maybeItems == null) return -1;
      let count = 0;
      // maybeItems is not an Array, hence the style of for-loop.
      for (let i = 0; i < maybeItems.length; i += 1)
        if (maybeItems[i].kind === 'file') count += 1;
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
      // Checking `length` in order to avoid setting these properties
      // unnecessarily, which could result in Vue calculations.
      if (this.plannedUploads.length !== 0) this.plannedUploads = [];
      if (this.unmatchedFiles.length !== 0) this.unmatchedFiles = [];
    },
    problemToAlert(problem) {
      if (this.uploadStatus.total === 1) return null;
      const uploaded = this.uploadStatus.total - this.uploadStatus.remaining;
      const summary = uploaded !== 0
        ? `Only ${uploaded} of ${this.uploadStatus.total} files ${this.$pluralize('was', uploaded)} successfully uploaded.`
        : 'No files were successfully uploaded.';
      return `${problem.message} ${summary}`;
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
        reader.onload = () => {
          resolve({ data: pako.gzip(reader.result), encoding: 'gzip' });
        };
        reader.onerror = () => {
          this.$alert().danger(`Something went wrong while reading “${file.name}”.`);
          reject(new Error());
        };
        reader.readAsText(file);
      });
    },
    // uploadFile() may mutate `updated`.
    uploadFile({ attachment, file }, updated) {
      // We decrement uploadStatus.remaining here rather than after the POST so
      // that uploadStatus.remaining and uploadStatus.current continue to be in
      // sync.
      this.uploadStatus.remaining -= 1;
      this.uploadStatus.current = file.name;
      this.uploadStatus.progress = null;
      return this.maybeGzip(file)
        .then(({ data, encoding }) => {
          const path = `/projects/${this.projectId}/forms/${this.form.encodedId()}/attachments/${attachment.encodedName()}`;
          return this.post(path, data, {
            headers: {
              'Content-Type': file.type,
              'Content-Encoding': encoding
            },
            onUploadProgress: (progressEvent) => {
              this.uploadStatus.progress = progressEvent;
            }
          });
        })
        .then(() => {
          // This may differ a little from updatedAt on the server, but that
          // should be OK.
          const updatedAt = new Date().toISOString();
          updated.push(attachment.with({ exists: true, updatedAt }));
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
      promise
        .catch(() => {})
        .finally(() => {
          if (updated.length === this.uploadStatus.total) {
            this.$alert().success(updated.length === 1
              ? '1 file has been successfully uploaded.'
              : `${updated.length} files have been successfully uploaded.`);
          }
          for (const attachment of updated)
            this.$emit('attachment-change', attachment);
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

<style lang="sass">
#form-attachment-list {
  // Extend to the bottom of the page (or slightly beyond it) so that the drop
  // zone includes the entire page below the PageHead.
  min-height: calc(100vh - 146px);
}

#form-attachment-list-heading {
  margin-bottom: 20px;

  button {
    float: right;
    margin-left: 10px;
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
    min-width: 250px;
  }
}
</style>
