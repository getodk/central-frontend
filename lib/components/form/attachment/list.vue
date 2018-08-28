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
          :key="attachment.key" :form="form" :attachment="attachment"
          :file-is-over-drop-zone="fileIsOverDropZone && !disabled"
          :dragover-attachment="dragoverAttachment"
          :planned-uploads="plannedUploads" :data-index="index"/>
      </tbody>
    </table>
    <form-attachment-popups
      :count-of-files-over-drop-zone="countOfFilesOverDropZone"
      :dragover-attachment="dragoverAttachment"
      :planned-uploads="plannedUploads" :unmatched-files="unmatchedFiles"
      :name-mismatch="nameMismatch" :upload-status="uploadStatus"
      @confirm="uploadFiles" @cancel="cancelUploads"/>

    <form-attachment-upload-files v-bind="uploadFilesModal"
      @hide="hideModal('uploadFilesModal')"/>
    <form-attachment-name-mismatch :state="nameMismatch.state"
      :planned-uploads="plannedUploads" @hide="hideModal('nameMismatch')"
      @confirm="uploadFiles" @cancel="cancelUploads"/>
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
      /*
      Most properties fall in one of three groups:

        1. Properties set on dragenter and reset on dragleave or drop.
           - fileIsOverDropZone. Indicates whether there is a file over the drop
             zone. Its value is managed by the dropZone mixin.
           - countOfFilesOverDropZone. The number of files over the drop zone.
             It is -1 if there are files, but we do not know how many (an issue
             in IE).
           - dragoverAttachment. Only applicable for
             countOfFilesOverDropZone === 1. When the user drags a single file
             over a row, dragoverAttachment is the attachment that corresponds
             to the row.
        2. Properties set on drop and reset once the uploads have started or
           been canceled.
           - plannedUploads. An array of file/attachment pairs, indicating which
             file to upload for which attachment. plannedUploads is used to
             confirm or cancel the uploads, then to start them, but it is not
             used during the uploads themselves.
           - unmatchedFiles. Only applicable for countOfFilesOverDropZone !== 1.
             An array of dropped files whose names did not match any
             attachment's.
        3. Properties set once the uploads have started and reset once they have
           finished or stopped.
           - uploadStatus. An object with the following properties:
             - total. The total number of files to upload.
             - remaining. The number of files that have not been uploaded yet.
             - current. The name of the file currently being uploaded.
             - progress. The latest ProgressEvent for the current upload.
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
      // Modals
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
  methods: {
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
      this.cancelUploads();
    },
    ondragleave() {
      if (!this.fileIsOverDropZone) {
        if (this.countOfFilesOverDropZone === 1) this.dragoverAttachment = null;
        this.countOfFilesOverDropZone = 0;
      }
    },
    // Updates this.plannedUploads and this.unmatchedFiles after a drop. files
    // is a FileList, not an Array.
    matchFilesToAttachments(files) {
      if (this.countOfFilesOverDropZone === 1) {
        const upload = { attachment: this.dragoverAttachment, file: files[0] };
        this.plannedUploads.push(upload);
      } else {
        for (let i = 0; i < files.length; i += 1) {
          const file = files[i];
          const attachment = this.attachments.find(a => a.name === file.name);
          if (attachment != null)
            this.plannedUploads.push({ attachment, file });
          else
            this.unmatchedFiles.push(file);
        }
      }
    },
    uploadFile(attachment, file) {
      this.uploadStatus.current = file.name;
      const path = `/forms/${this.form.encodedId()}/attachments/${attachment.encodedName()}`;
      const post = this.post(path, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          this.uploadStatus.progress = progressEvent;
        }
      });
      return post.then(() => {
        this.uploadStatus.remaining -= 1;
      });
    },
    uploadFiles() {
      const uploaded = [];
      this.uploadStatus.total = this.plannedUploads.length;
      this.uploadStatus.remaining = this.plannedUploads.length;
      const promise = this.plannedUploads.reduce(
        (acc, { attachment, file }) => acc
          .then(() => this.uploadFile(attachment, file))
          .then(() => {
            const updatedAt = new Date().toISOString();
            uploaded.push(attachment.with({ exists: true, updatedAt }));
          }),
        Promise.resolve()
      );
      promise
        .finally(() => {
          for (const attachment of uploaded)
            this.$emit('attachment-change', attachment);
          this.uploadStatus = { total: 0, remaining: 0, current: null, progress: null };
        })
        .catch(() => {});
      this.plannedUploads = [];
      this.unmatchedFiles = [];
    },
    ondrop(jQueryEvent) {
      const { files } = jQueryEvent.originalEvent.dataTransfer;
      this.matchFilesToAttachments(files);
      this.countOfFilesOverDropZone = 0;
      if (this.dragoverAttachment != null) {
        this.dragoverAttachment = null;
        if (files[0].name === this.plannedUploads[0].attachment.name)
          this.uploadFiles();
        else
          this.showModal('nameMismatch');
      }
    },
    // cancelUploads() cancels the uploads before they start, after files have
    // been dropped. (It does not cancel an upload in progress.)
    cancelUploads() {
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
