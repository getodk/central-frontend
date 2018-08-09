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
  <tr>
    <td>
      {{ attachment.type.replace(/^[a-z]/, (letter) => letter.toUpperCase()) }}
    </td>
    <td class="form-attachment-list-name">{{ attachment.name }}</td>
    <td>
      <template v-if="attachment.exists">
        {{ updatedAt }}
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
  inheritAttrs: false,
  props: {
    attachment: {
      type: Object,
      required: true
    }
  },
  computed: {
    updatedAt() {
      return formatDate(this.attachment.updatedAt);
    }
  }
};
</script>

<style lang="sass">
.form-attachment-row {
  .icon-exclamation-triangle {
    color: #cc9e00;
  }
}
</style>
