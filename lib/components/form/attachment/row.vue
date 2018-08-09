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
    <td class="form-attachment-list-name">{{ attachment.name }}</td>
    <td class="form-attachment-list-uploaded">
      <template v-if="attachment.exists">
        {{ updatedAt }}
        <span v-show="targetAttachment != null &&
          attachment.name === targetAttachment.name"
          class="label label-primary">
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
    targetAttachment: Object // eslint-disable-line vue/require-default-prop
  },
  computed: {
    htmlClass() {
      const targeted = this.targetAttachment != null &&
        this.attachment.name === this.targetAttachment.name;
      const highlight = this.targetAttachment != null
        ? targeted
        : this.fileIsOverDropZone;
      return {
        'form-attachment-row': true,
        info: highlight,
        'form-attachment-row-targeted': targeted
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

#form-attachment-list-table > tbody > .form-attachment-row {
  > td {
    border-bottom: 1px solid transparent;

    &:first-child {
      border-left: 1px solid transparent;
    }

    &:last-child {
      border-right: 1px solid transparent;
    }
  }

  &.form-attachment-row-targeted > td {
    border-color: $color-info;
  }

  .label {
    margin-left: 5px;
  }

  .icon-exclamation-triangle {
    color: #cc9e00;
    margin-right: 2px;
  }
}
</style>
