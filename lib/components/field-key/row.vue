<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr :class="highlight(fieldKey, 'id')">
    <td>{{ fieldKey.displayName }}</td>
    <td>{{ created }}</td>
    <td>{{ lastUsed }}</td>
    <td>
      <a v-if="!isRevoked" ref="popoverLink"
        class="field-key-row-popover-link no-text-decoration" role="button"
        @click="showCode">
        <span class="icon-qrcode"></span>
        <span class="underline-on-hover-or-focus">See code</span>
      </a>
      <template v-else>
        Revoked
      </template>
    </td>
    <td class="field-key-list-actions">
      <div class="dropdown">
        <button :id="actionsId" type="button"
          class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
          aria-haspopup="true" aria-expanded="false">
          <span class="icon-cog"></span>
          <span class="caret"></span>
        </button>
        <ul :aria-labelledby="actionsId"
          class="dropdown-menu dropdown-menu-right">
          <li :class="{ disabled: isRevoked }">
            <a href="#" @click.prevent="revoke">Revoke</a>
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
    highlighted: {
      type: Number,
      default: null
    }
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
    isRevoked() {
      return this.fieldKey.token == null;
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
      if (this.isRevoked) return;
      this.$emit('revoke', this.fieldKey);
    }
  }
};
</script>
