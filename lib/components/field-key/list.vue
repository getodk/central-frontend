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
  <div>
    <alert v-bind="alert" @close="alert.state = false"/>
    <float-row class="table-actions">
      <refresh-button slot="left" :fetching="awaitingResponse"
        @refresh="fetchData({ clear: false })"/>
      <button id="field-key-list-new-button" slot="right" type="button"
        class="btn btn-primary" @click="newFieldKey.state = true">
        <span class="icon-plus-circle"></span> Create app user
      </button>
    </float-row>
    <loading v-if="fieldKeys == null" :state="awaitingResponse"/>
    <p v-else-if="fieldKeys.length === 0">
      There are no app users yet. You will need to create some to download forms
      and submit data from your device.
    </p>
    <table v-else id="field-key-list-table" class="table table-hover">
      <thead>
        <tr>
          <th>Nickname</th>
          <th>Created</th>
          <th>Last Used</th>
          <th>Configure Client</th>
          <th class="field-key-list-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <field-key-row v-for="fieldKey of fieldKeys" :key="fieldKey.key"
          :field-key="fieldKey" :highlighted="highlighted"
          @show-code="showPopover" @revoke="showRevoke"/>
      </tbody>
    </table>

    <field-key-new v-bind="newFieldKey" @hide="newFieldKey.state = false"
      @success="afterCreate"/>
    <field-key-revoke v-bind="revoke" @hide="revoke.state = false"
      @success="afterRevoke"/>
  </div>
</template>

<script>
import Vue from 'vue';
import qrcode from 'qrcode-generator';
import { deflate } from 'pako/lib/deflate';

import FieldKeyNew from './new.vue';
import FieldKeyRevoke from './revoke.vue';
import FieldKeyRow from './row.vue';
import alert from '../../mixins/alert';
import modal from '../../mixins/modal';
import request from '../../mixins/request';

const QR_CODE_TYPE_NUMBER = 0;
// This is the level used in Collect.
const QR_CODE_ERROR_CORRECTION_LEVEL = 'L';
const QR_CODE_CELL_SIZE = 3;
const QR_CODE_MARGIN = 0;

class FieldKeyPresenter {
  constructor(fieldKey) {
    this._fieldKey = fieldKey;
  }

  get id() { return this._fieldKey.id; }
  get displayName() { return this._fieldKey.displayName; }
  get token() { return this._fieldKey.token; }
  get lastUsed() { return this._fieldKey.lastUsed; }
  get createdBy() { return this._fieldKey.createdBy; }
  get createdAt() { return this._fieldKey.createdAt; }

  get key() {
    if (this._key != null) return this._key;
    this._key = Vue.prototype.$uniqueId();
    return this._key;
  }

  get serverUrl() {
    return `${window.location.origin}/api/v1/key/${this._fieldKey.token}`;
  }

  get qrCodeImgHtml() {
    if (this._qrCodeImgHtml != null) return this._qrCodeImgHtml;
    const code = qrcode(QR_CODE_TYPE_NUMBER, QR_CODE_ERROR_CORRECTION_LEVEL);
    // Collect requires the JSON to have 'general' and 'admin' keys, even if the
    // associated values are empty objects.
    const settings = { general: { server_url: this.serverUrl }, admin: {} };
    const deflated = deflate(JSON.stringify(settings), { to: 'string' });
    code.addData(btoa(deflated));
    code.make();
    this._qrCodeImgHtml = code.createImgTag(QR_CODE_CELL_SIZE, QR_CODE_MARGIN);
    return this._qrCodeImgHtml;
  }
}

const POPOVER_CONTENT_TEMPLATE = `
  <div id="field-key-list-popover-content">
    <div class="field-key-list-img-container"></div>
    <div>
      <a href="https://docs.opendatakit.org/collect-import-export/" target="_blank">
        What’s this?
      </a>
    </div>
  </div>
`;

export default {
  name: 'FieldKeyList',
  components: { FieldKeyRow, FieldKeyNew, FieldKeyRevoke },
  mixins: [
    alert(),
    request(),
    modal(['newFieldKey', 'revoke'])
  ],
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      fieldKeys: null,
      highlighted: null,
      enabledPopoverLinks: new Set(),
      // The <a> element whose popover is currently shown.
      popoverLink: null,
      newFieldKey: {
        state: false
      },
      revoke: {
        state: false,
        fieldKey: {
          displayName: ''
        }
      }
    };
  },
  watch: {
    alert() {
      this.$emit('alert');
    }
  },
  created() {
    this.fetchData({ clear: false });
  },
  activated() {
    $('body').on('click.app-field-key-list', this.hidePopoverAfterClickOutside);
  },
  deactivated() {
    this.hidePopover();
    $('body').off('click.app-field-key-list', this.hidePopoverAfterClickOutside);
  },
  methods: {
    fetchData({ clear }) {
      if (clear) this.fieldKeys = null;
      const headers = { 'X-Extended-Metadata': 'true' };
      this
        .get('/field-keys', { headers })
        .then(({ data }) => {
          this.fieldKeys = data.map(fieldKey => new FieldKeyPresenter(fieldKey));
          this.enabledPopoverLinks = new Set();
          if (!clear) this.highlighted = null;
        })
        .catch(() => {});
    },
    hidePopover() {
      if (this.popoverLink == null) return;
      $(this.popoverLink).popover('hide');
      this.popoverLink = null;
    },
    // Hides the popover upon a click outside the popover and outside a popover
    // link.
    hidePopoverAfterClickOutside(event) {
      if (this.popoverLink == null) return;
      const popover = $('#field-key-list-popover-content').closest('.popover')[0];
      if (event.target === popover || $.contains(popover, event.target))
        return;
      // If the target is a different popover link from the one whose popover is
      // currently shown, showPopover() will hide the popover: we do not need to
      // do so here.
      if ($(event.target).closest('.field-key-row-popover-link').length !== 0)
        return;
      this.hidePopover();
    },
    popoverContent(fieldKey) {
      const $content = $(POPOVER_CONTENT_TEMPLATE);
      $content
        .find('.field-key-list-img-container')
        .append(fieldKey.qrCodeImgHtml);
      return $content[0].outerHTML;
    },
    enablePopover(fieldKey, $popoverLink) {
      if (this.enabledPopoverLinks.has(fieldKey.id)) return;
      $popoverLink.popover({
        animation: false,
        container: 'body',
        trigger: 'manual',
        placement: 'left',
        content: this.popoverContent(fieldKey),
        html: true
      });
      this.enabledPopoverLinks.add(fieldKey.id);
    },
    showPopover(fieldKey, popoverLink) {
      this.hidePopover();
      const $popoverLink = $(popoverLink);
      this.enablePopover(fieldKey, $popoverLink);
      $popoverLink.popover('show');
      this.popoverLink = popoverLink;
    },
    showRevoke(fieldKey) {
      this.revoke.fieldKey = fieldKey;
      this.revoke.state = true;
    },
    afterCreate(fieldKey) {
      this.fetchData({ clear: true });
      this.alert = alert.success(`The app user “${fieldKey.displayName}” was created successfully.`);
      this.highlighted = fieldKey.id;
    },
    afterRevoke() {
      this.fetchData({ clear: true });
      this.alert = alert.success(`The app user “${this.revoke.fieldKey.displayName}” was revoked.`);
      this.highlighted = null;
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

// 8px is the Bootstrap default.
$padding-left-actions: 8px;
$padding-right-actions: 23px;
$width-dropdown: 44px;
$width-dropdown-toggle: 42px;

#field-key-list-table {
  th, td {
    &.field-key-list-actions {
      padding-left: $padding-left-actions;
      padding-right: $padding-right-actions;
      // Setting the width so that the .dropdown-menu-right is correctly
      // aligned.
      width: $width-dropdown + $padding-left-actions + $padding-right-actions;

      .dropdown-menu-right {
        margin-right: $width-dropdown - $width-dropdown-toggle;
      }
    }
  }

  td {
    vertical-align: middle;
  }
}

#field-key-list-popover-content {
  padding: 3px;

  .field-key-list-img-container {
    border: 3px solid $color-subpanel-border;
    margin-bottom: 3px;
  }

  a {
    color: white;
  }
}
</style>
