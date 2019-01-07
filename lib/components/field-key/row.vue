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
  <tr :class="highlight(fieldKey, 'id')">
    <td>{{ fieldKey.displayName }}</td>
    <td>{{ created }}</td>
    <td>{{ lastUsed }}</td>
    <td>
      <a v-if="fieldKey.token != null" ref="popoverLink" href="#"
        class="field-key-row-popover-link" role="button"
        @click.prevent="showCode">
        <span class="icon-qrcode"></span>See code
      </a>
      <template v-else>
        Access revoked
      </template>
    </td>
    <td class="field-key-list-actions">
      <div class="dropdown">
        <button :id="actionsId" type="button"
          class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
          aria-haspopup="true" aria-expanded="false">
          <span class="icon-cog"></span><span class="caret"></span>
        </button>
        <ul :aria-labelledby="actionsId"
          class="dropdown-menu dropdown-menu-right">
          <li :class="{ disabled: fieldKey.token == null }">
            <a href="#" @click.prevent="revoke">Revoke access</a>
          </li>
        </ul>
      </div>
    </td>
  </tr>
</template>

<script>
import highlight from '../../mixins/highlight';
import { formatDate } from '../../util';

export default {
  name: 'FieldKeyRow',
  mixins: [highlight()],
  props: {
    fieldKey: {
      type: Object,
      required: true
    },
    highlighted: Number // eslint-disable-line vue/require-default-prop
  },
  computed: {
    created() {
      const createdAt = formatDate(this.fieldKey.createdAt);
      const createdBy = this.fieldKey.createdBy.displayName;
      return `${createdAt} by ${createdBy}`;
    },
    lastUsed() {
      return formatDate(this.fieldKey.lastUsed);
    },
    actionsId() {
      return `field-key-row-actions${this.fieldKey.id}`;
    }
  },
  methods: {
    showCode() {
      this.$emit('show-code', this.fieldKey, this.$refs.popoverLink);
    },
    revoke() {
      // Bootstrap does not actually disable dropdown menu items marked as
      // disabled.
      if (this.fieldKey.token == null) return;
      this.$emit('revoke', this.fieldKey);
    }
  }
};
</script>
