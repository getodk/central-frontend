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
  <tr :class="htmlClass">
    <td class="form-attachment-list-type">{{ type }}</td>
    <td :title="attachment.name" class="form-attachment-list-name">
      <a v-if="attachment.exists" :href="href" target="_blank">
        {{ attachment.name }}
      </a>
      <template v-else>
        {{ attachment.name }}
      </template>
    </td>
    <td class="form-attachment-list-uploaded">
      <template v-if="attachment.exists">
        {{ updatedAt }}
        <span v-show="targeted" class="label label-primary">
          Replace
        </span>
      </template>
      <template v-else>
        <span class="icon-exclamation-triangle"></span>
        <span title="To upload files, drag and drop one or more files onto this page">
          Not yet uploaded
        </span>
      </template>
    </td>
  </tr>
</template>

<script>
import { formatDate } from '../../../util';

const TYPES = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  file: 'Data File'
};

export default {
  name: 'FormAttachmentRow',
  props: {
    form: {
      type: Object,
      required: true
    },
    attachment: {
      type: Object,
      required: true
    },
    fileIsOverDropZone: {
      type: Boolean,
      default: false
    },
    dragoverAttachment: Object, // eslint-disable-line vue/require-default-prop
    plannedUploads: {
      type: Array,
      required: true
    },
    updatedAttachments: {
      type: Array,
      required: true
    }
  },
  computed: {
    targeted() {
      const targetedByDragover = this.dragoverAttachment != null &&
        this.attachment.name === this.dragoverAttachment.name;
      const targetedByDrop = this.plannedUploads
        .some(({ attachment }) => attachment.name === this.attachment.name);
      return targetedByDragover || targetedByDrop;
    },
    htmlClass() {
      const dragoverTargetsADifferentRow = this.dragoverAttachment != null &&
        this.dragoverAttachment.name !== this.attachment.name;
      const highlightedAsInfo = this.targeted ||
        (this.fileIsOverDropZone && !dragoverTargetsADifferentRow);
      const highlightedAsSuccess = this.updatedAttachments
        .some(attachment => attachment.name === this.attachment.name);
      return {
        'form-attachment-row': true,
        info: highlightedAsInfo,
        'form-attachment-row-targeted': this.targeted,
        success: highlightedAsSuccess
      };
    },
    type() {
      const { type } = this.attachment;
      const displayName = TYPES[type];
      return displayName != null ? displayName : type;
    },
    href() {
      return `/v1/forms/${this.form.encodedId()}/attachments/${this.attachment.encodedName()}`;
    },
    updatedAt() {
      return formatDate(this.attachment.updatedAt);
    }
  }
};
</script>

<style lang="sass">
@import '../../../../assets/scss/variables';

#form-attachment-list-table {
  > tbody > tr {
    &.form-attachment-row-targeted {
      > td {
        box-shadow: inset 0 1px $color-info, inset 0 -1px $color-info;

        &:first-child {
          box-shadow: inset 1px 1px $color-info, inset 0 -1px $color-info;
        }

        &:last-child {
          box-shadow: inset 0 1px $color-info, inset -1px -1px $color-info;
        }
      }
    }

    .label {
      margin-left: 5px;
    }

    .icon-exclamation-triangle {
      color: #e1bf50;
      margin-right: 2px;
    }
  }
}
</style>
