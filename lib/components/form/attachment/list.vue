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
          :file-is-over-drop-zone="fileIsOverDropZone"
          :target-attachment="targetAttachment" :data-index="index"/>
      </tbody>
    </table>
    <form-attachment-popup v-show="fileIsOverDropZone"
      :target-attachment="targetAttachment"/>
  </div>
</template>

<script>
import FormAttachmentPopup from './popup.vue';
import FormAttachmentRow from './row.vue';
import dropZone from '../../../mixins/drop-zone';

export default {
  name: 'FormAttachmentList',
  components: { FormAttachmentPopup, FormAttachmentRow },
  mixins: [
    dropZone({ keepAlive: true, eventNamespace: 'form-attachment-list' })
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
      // The index of the attachment targeted for the drop
      targetIndex: null
  },
  computed: {
    targetAttachment() {
      return this.attachments[this.targetIndex];
    }
  },
  methods: {
    ondragenter(jQueryEvent) {
      const { items } = jQueryEvent.originalEvent.dataTransfer;
      // items will be undefined in IE.
      if (items == null) return;
      if (this.hasMultipleFiles(items)) return;
      const $targetRow = $(jQueryEvent.target)
        .closest('#form-attachment-list-table tbody tr');
      this.targetIndex = $targetRow.length !== 0
        ? $targetRow.data('index')
        : null;
    },
    ondragleave() {
      if (!this.fileIsOverDropZone) this.targetIndex = null;
    },
    ondrop() {
      this.targetIndex = null;
    },
    // items is a DataTransferItemList, not an Array.
    hasMultipleFiles(items) {
      let count = 0;
      for (let i = 0; i < items.length; i += 1) {
        if (items[i].kind === 'file') {
          count += 1;
          if (count > 1) return true;
        }
      }
      return false;
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

#form-attachment-list-table {
  border-collapse: separate;

  > tbody > tr:first-child > td {
    border-top-color: transparent;
  }

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
