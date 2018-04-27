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
    <float-row>
      <button type="button" id="field-key-list-new-button"
        class="btn btn-primary" @click="newFieldKey.state = true">
        <span class="icon-plus-circle"></span> Create Field Key
      </button>
    </float-row>
    <loading v-if="fieldKeys == null" :state="awaitingResponse"/>
    <p v-else-if="fieldKeys.length === 0">
      There are no field keys yet. You will need to create some to download
      forms and submit data from your device.
    </p>
    <table v-else id="field-key-list-table" class="table table-hover">
      <thead>
        <tr>
          <th>Nickname</th>
          <th>Created</th>
          <th>Last Used</th>
          <th>Auto-Configure</th>
          <th class="field-key-list-actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(fieldKey, index) in fieldKeys" :key="fieldKey.key"
          :class="highlight(fieldKey, 'id')" :data-index="index">
          <td>{{ fieldKey.displayName }}</td>
          <td>{{ fieldKey.created }}</td>
          <td>{{ fieldKey.lastUsed }}</td>
          <td>
            <a v-if="!fieldKey.isRevoked()"
              class="field-key-list-popover-link no-text-decoration"
              role="button">
              <span class="icon-qrcode"></span>
              <span class="underline-on-hover-or-focus">See code</span>
            </a>
            <template v-else>
              Revoked
            </template>
          </td>
          <td class="field-key-list-actions">
            <div class="dropdown">
              <button type="button" :id="actionsId(index)"
                class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
                <span class="icon-cog"></span>
                <span class="caret"></span>
              </button>
              <ul class="dropdown-menu dropdown-menu-right"
                :aria-labelledby="actionsId(index)">
                <li :class="{ disabled: fieldKey.isRevoked() }">
                  <a href="#" @click.prevent="showRevoke(fieldKey)">Revoke</a>
                </li>
              </ul>
            </div>
          </td>
        </tr>
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
import alert from '../../mixins/alert';
import highlight from '../../mixins/highlight';
import modal from '../../mixins/modal';
import request from '../../mixins/request';
import { formatDate } from '../../util';

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

  isRevoked() { return this._fieldKey.token == null; }

  get key() {
    if (this._key != null) return this._key;
    this._key = Vue.prototype.$uniqueId();
    return this._key;
  }

  get created() {
    const createdAt = formatDate(this._fieldKey.createdAt);
    const createdBy = this._fieldKey.createdBy.displayName;
    return `${createdAt} by ${createdBy}`;
  }

  get lastUsed() { return formatDate(this._fieldKey.lastUsed); }

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
  components: { FieldKeyNew, FieldKeyRevoke },
  mixins: [
    alert(),
    request(),
    modal(['newFieldKey', 'revoke']),
    highlight()
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
    this.fetchData();
  },
  activated() {
    $('body').on('click.app-field-key-list', this.togglePopovers);
  },
  deactivated() {
    this.hidePopover();
    $('body').off('click.app-field-key-list', this.togglePopovers);
  },
  methods: {
    fetchData() {
      this.fieldKeys = null;
      this.enabledPopoverLinks = new Set();
      const headers = { 'X-Extended-Metadata': 'true' };
      this
        .get('/field-keys', { headers })
        .then(({ data }) => {
          this.fieldKeys = data.map(fieldKey => new FieldKeyPresenter(fieldKey));
        })
        .catch(() => {});
    },
    popoverContent(fieldKey) {
      const $content = $(POPOVER_CONTENT_TEMPLATE);
      $content.find('.field-key-list-img-container').append(fieldKey.qrCodeImgHtml);
      return $content[0].outerHTML;
    },
    enablePopover($popoverLink) {
      const index = $popoverLink.closest('tr').data('index');
      if (this.enabledPopoverLinks.has(index)) return;
      $popoverLink.popover({
        animation: false,
        container: 'body',
        trigger: 'manual',
        placement: 'left',
        content: this.popoverContent(this.fieldKeys[index]),
        html: true
      });
      this.enabledPopoverLinks.add(index);
    },
    showPopover($popoverLink) {
      this.enablePopover($popoverLink);
      $popoverLink.popover('show');
      this.popoverLink = $popoverLink.get(0);
    },
    hidePopover() {
      if (this.popoverLink == null) return;
      $(this.popoverLink).popover('hide');
      this.popoverLink = null;
    },
    elementIsOutsidePopover(element) {
      if (this.popoverLink == null) return true;
      const popover = $('#field-key-list-popover-content').closest('.popover')[0];
      return element !== popover && !$.contains(popover, element);
    },
    togglePopovers(event) {
      const $popoverLink = $(event.target).closest('.field-key-list-popover-link');
      if ($popoverLink.length !== 0) {
        // true if the user clicked on the link whose popover is currently shown
        // and false if not.
        const samePopover = this.popoverLink != null &&
          $popoverLink[0] === this.popoverLink;
        if (!samePopover) {
          this.hidePopover();
          this.showPopover($popoverLink);
        }
      } else if (this.popoverLink != null &&
        this.elementIsOutsidePopover(event.target)) {
        this.hidePopover();
      }
    },
    actionsId(index) {
      return `field-key-list-actions${index}`;
    },
    showRevoke(fieldKey) {
      // Bootstrap does not actually disable dropdown menu items marked as
      // disabled.
      if (fieldKey.isRevoked()) return;
      this.revoke.fieldKey = fieldKey;
      this.revoke.state = true;
    },
    afterCreate(fieldKey) {
      this.fetchData();
      this.alert = alert.success(`The field key “${fieldKey.displayName}” was created successfully.`);
      this.highlighted = fieldKey.id;
    },
    afterRevoke() {
      this.fetchData();
      this.alert = alert.success(`The field key “${this.revoke.fieldKey.displayName}” was revoked.`);
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
