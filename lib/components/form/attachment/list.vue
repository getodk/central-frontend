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
        @click="showUploadFilesModal">
        <span class="icon-cloud-upload"></span> Upload files
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
          :key="attachment.key" :attachment="attachment"
          :file-is-over-drop-zone="fileIsOverDropZone && !disabled"
          :dragover-attachment="dragoverAttachment"
          :planned-uploads="plannedUploads" :data-index="index"/>
      </tbody>
    </table>
    <form-attachment-popups
      :count-of-files-over-drop-zone="countOfFilesOverDropZone"
      :dragover-attachment="dragoverAttachment"
      :planned-uploads="plannedUploads" :unmatched-files="unmatchedFiles"
      :upload-status="uploadStatus" @confirm="uploadFiles"
      @cancel="cancelUpload"/>

    <form-attachment-upload-files v-bind="uploadFilesModal"
      @hide="hideModal('uploadFilesModal')"/>
    <form-attachment-name-mismatch :state="nameMismatch.state"
      :planned-uploads="plannedUploads" @hide="hideModal('nameMismatch')"
      @confirm="uploadFiles" @cancel="cancelUpload"/>
  </div>
</template>

<script>
import FormAttachmentNameMismatch from './name-mismatch.vue';
import FormAttachmentPopups from './popups.vue';
import FormAttachmentRow from './row.vue';
import FormAttachmentUploadFiles from './upload-files.vue';
import dropZone from '../../../mixins/drop-zone';
import modal from '../../../mixins/modal';
import request from '../../../mixins/request';

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
  props: {
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
      fileIsOverDropZone: false,
      countOfFilesOverDropZone: 0,
      // Only applicable for countOfFilesOverDropZone === 1.
      dragoverAttachment: null,
      // Array of file/attachment pairs
      plannedUploads: [],
      // TODO: Only store the length?
      unmatchedFiles: [],
      uploadStatus: {
        // The total number of files to upload
        total: null,
        // The number of files uploaded so far
        complete: null,
        // The name of the file currently being uploaded
        current: null
      },
      uploadFilesModal: {
        state: false
      },
      nameMismatch: {
        state: false
      }
    };
  },
  computed: {
    disabled() {
      return this.uploadStatus.current != null;
    }
  },
  beforeRouteLeave(to, from, next) {
    if (this.uploadStatus.current == null)
      next();
    else
      next(false);
  },
  methods: {
    showUploadFilesModal() {
      if (this.uploadStatus.current == null) this.showModal('uploadFilesModal');
    },
    // items is a DataTransferItemList, not an Array.
    fileItemCount(maybeItems) {
      // IE
      if (maybeItems == null) return -1;
      let count = 0;
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
      this.cancelUpload();
    },
    ondragleave() {
      if (!this.fileIsOverDropZone) {
        if (this.countOfFilesOverDropZone === 1) this.dragoverAttachment = null;
        this.countOfFilesOverDropZone = 0;
      }
    },
    // files is a FileList, not an Array.
    matchFilesToAttachments(files) {
      this.plannedUploads = [];
      this.unmatchedFiles = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const attachment = this.attachments.find(a => a.name === file.name);
        if (attachment != null)
          this.plannedUploads.push({ attachment, file });
        else
          this.unmatchedFiles.push(file);
      }
    },
    postPath(attachment) {
      const encodedName = encodeURIComponent(attachment.name);
      return `/forms/${this.form.xmlFormId}/attachments/${encodedName}`;
    },
    uploadFiles() {
      this.uploadStatus.total = this.plannedUploads.length;
      this.uploadStatus.complete = 0;
      const uploaded = [];
      const promise = this.plannedUploads.reduce(
        (acc, { attachment, file }) => acc
          .then(() => {
            this.uploadStatus.current = file.name;
            const headers = { 'Content-Type': file.type };
            const path = this.postPath(attachment);
            return this.post(path, file, { headers });
          })
          .then(() => {
            uploaded.push({ attachment, updatedAt: new Date().toISOString() });
            this.uploadStatus.complete += 1;
          }),
        Promise.resolve()
      );
      promise
        .finally(() => {
          for (const { attachment, updatedAt } of uploaded) {
            this.$emit(
              'attachment-change',
              this.attachments.indexOf(attachment),
              attachment.with({ exists: true, updatedAt })
            );
          }
          this.uploadStatus = { total: null, complete: null, current: null };
        })
        .catch(() => {});
      this.plannedUploads = [];
      this.unmatchedFiles = [];
    },
    ondrop(jQueryEvent) {
      const { files } = jQueryEvent.originalEvent.dataTransfer;
      if (this.countOfFilesOverDropZone !== 1)
        this.matchFilesToAttachments(files);
      else if (this.dragoverAttachment != null) {
        const file = files[0];
        this.plannedUploads = [{ file, attachment: this.dragoverAttachment }];
        this.dragoverAttachment = null;
        if (file.name === this.plannedUploads[0].attachment.name)
          this.uploadFiles();
        else
          this.nameMismatch.state = true;
      }
      this.countOfFilesOverDropZone = 0;
    },
    cancelUpload() {
      // Checking `length` in order to avoid setting these properties
      // unnecessarily, which could result in Vue calculations.
      if (this.plannedUploads.length !== 0) this.plannedUploads = [];
      if (this.unmatchedFiles.length !== 0) this.unmatchedFiles = [];
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
