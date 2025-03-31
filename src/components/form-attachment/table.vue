<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <table id="form-attachment-table" class="table">
    <thead>
      <tr>
        <th class="form-attachment-list-type">{{ $t('header.type') }}</th>
        <th class="form-attachment-list-name">{{ $t('header.name') }}</th>
        <th class="form-attachment-list-uploaded">{{ $t('header.uploaded') }}</th>
        <th class="form-attachment-list-action"></th>
      </tr>
    </thead>
    <tbody v-if="form.dataExists && draftAttachments.dataExists">
      <form-attachment-row v-for="attachment of draftAttachments.values()"
        :key="attachment.name" :attachment="attachment"
        :file-is-over-drop-zone="fileIsOverDropZone"
        :dragover-attachment="dragoverAttachment"
        :planned-uploads="plannedUploads"
        :updated-attachments="updatedAttachments"
        :linkable="attachment.type === 'file' && dsHashset.has(attachment.name.replace(/\.[^.]+$/i, ''))"
        @link="$emit('link', $event)"/>
    </tbody>
  </table>
</template>

<script setup>
import { computed } from 'vue';

import FormAttachmentRow from './row.vue';

import { useRequestData } from '../../request-data';

defineOptions({
  name: 'FormAttachmentTable'
});
defineProps({
  fileIsOverDropZone: Boolean,
  dragoverAttachment: Object,
  plannedUploads: {
    type: Array,
    required: true
  },
  updatedAttachments: {
    type: Set,
    required: true
  }
});
defineEmits(['link']);

const { form, draftAttachments, datasets } = useRequestData();

const dsHashset = computed(() =>
  (datasets.dataExists ? new Set(datasets.map(d => `${d.name}`)) : new Set()));
</script>

<style lang="scss">
#form-attachment-table {
  margin-bottom: 5px;

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
    // @transifexKey component.FormAttachmentList.header
    "header": {
      // This is the text of a table column header. The column shows when each
      // Media File was uploaded.
      "uploaded": "Uploaded"
    }
  }
}
</i18n>
