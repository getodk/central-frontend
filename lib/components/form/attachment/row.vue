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
    <td class="form-attachment-list-type">
      {{ attachment.type.replace(/^[a-z]/, (letter) => letter.toUpperCase()) }}
    </td>
    <!-- TODO. Add a link if the attachment exists. -->
    <td class="form-attachment-list-name">{{ attachment.name }}</td>
    <td class="form-attachment-list-uploaded">
      <template v-if="attachment.exists">
        {{ updatedAt }}
        <span v-show="targeted" class="label label-primary">
          Replace
        </span>
      </template>
      <template v-else>
        <span class="icon-exclamation-triangle"></span> Not yet uploaded
      </template>
    </td>
  </tr>
</template>

<script>
import { formatDate } from '../../../util';

export default {
  name: 'FormAttachmentRow',
  props: {
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
    }
  },
  computed: {
    targeted() {
      const targetedByDragover = this.dragoverAttachment != null &&
        this.attachment.name === this.dragoverAttachment.name;
      const targetedByDrop = this.plannedUploads.some(({ file }) =>
        file.name === this.attachment.name);
      return targetedByDragover || targetedByDrop;
    },
    htmlClass() {
      const dragoverTargetsADifferentRow = this.dragoverAttachment != null &&
        this.dragoverAttachment.name !== this.attachment.name;
      const info = this.targeted ||
        (this.fileIsOverDropZone && !dragoverTargetsADifferentRow);
      return {
        'form-attachment-row': true,
        info,
        'form-attachment-row-targeted': this.targeted
      };
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
  thead > tr > th {
    border-bottom-width: 0;
  }

  // TODO. Adjust styles for bottom row.
  > tbody > .form-attachment-row {
    &:first-child > td {
      border-top: $border-bottom-table-heading;
    }

    > td {
      &:first-child {
        border-left: 1px solid transparent;
      }

      &:last-child {
        border-right: 1px solid transparent;
      }
    }

    &.form-attachment-row-targeted {
      > td {
        border-top-color: $color-info;

        &:first-child {
          border-left-color: $color-info;
        }

        &:last-child {
          border-right-color: $color-info;
        }
      }
    }

    &.form-attachment-row-targeted + tr > td {
      border-top-color: $color-info;
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
