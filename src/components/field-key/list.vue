<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <div class="heading-with-button">
      <button id="field-key-list-create-button" type="button"
        class="btn btn-primary" @click="showModal('newFieldKey')">
        <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
      </button>
      <p>
        <i18n :tag="false" path="heading.full">
          <template #formAccess>
            <router-link :to="projectPath('form-access')">{{ $t('heading.formAccess') }}</router-link>
          </template>
        </i18n>
        &nbsp;
        <i18n :tag="false" path="moreInfo.clickHere.full">
          <template #clickHere>
            <doc-link to="central-users/#managing-app-users">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
          </template>
        </i18n>
      </p>
    </div>
    <table id="field-key-list-table" class="table">
      <thead>
        <tr>
          <th>{{ $t('header.displayName') }}</th>
          <th>{{ $t('header.created') }}</th>
          <th>{{ $t('header.lastUsed') }}</th>
          <th>{{ $t('header.configureClient') }}</th>
          <th>{{ $t('header.actions') }} </th>
        </tr>
      </thead>
      <tbody v-if="fieldKeys != null">
        <!-- Using fieldKey.key rather than fieldKey.id for the v-for key to
        ensure that there will be no component reuse if fieldKeys changes. Such
        component reuse could add complexity around our use of the Bootstrap
        plugin. -->
        <field-key-row v-for="fieldKey of fieldKeys" :key="fieldKey.key"
          :field-key="fieldKey" :highlighted="highlighted"
          @show-code="showPopover" @revoke="showRevoke"/>
      </tbody>
    </table>
    <loading :state="$store.getters.initiallyLoading(['fieldKeys'])"/>
    <p v-if="fieldKeys != null && fieldKeys.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>

    <field-key-new v-bind="newFieldKey" @hide="hideModal('newFieldKey')"
      @success="afterCreate"/>
    <field-key-revoke v-bind="revoke" @hide="hideModal('revoke')"
      @success="afterRevoke"/>
  </div>
</template>

<script>
import DocLink from '../doc-link.vue';
import FieldKeyNew from './new.vue';
import FieldKeyRevoke from './revoke.vue';
import FieldKeyRow from './row.vue';
import Loading from '../loading.vue';
import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import validateData from '../../mixins/validate-data';
import { requestData } from '../../store/modules/request';

const popoverContentTemplate = `
  <div id="field-key-list-popover-content">
    <div class="field-key-list-img-container"></div>
    <div>
      <a href="https://docs.getodk.org/collect-import-export/" target="_blank"></a>
    </div>
  </div>
`;

export default {
  name: 'FieldKeyList',
  components: { DocLink, FieldKeyRow, FieldKeyNew, FieldKeyRevoke, Loading },
  mixins: [modal(), routes(), validateData()],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      highlighted: null,
      enabledPopoverLinks: new Set(),
      // The <a> element whose popover is currently shown.
      popoverLink: null,
      newFieldKey: {
        state: false
      },
      revoke: {
        fieldKey: null,
        state: false
      }
    };
  },
  computed: requestData(['fieldKeys']),
  watch: {
    fieldKeys() {
      this.enabledPopoverLinks = new Set();
      this.revoke.fieldKey = null;
      this.hidePopover();
    }
  },
  created() {
    this.$emit('fetch-field-keys', false);
  },
  mounted() {
    $('body').on('click.field-key-list', this.hidePopoverAfterClickOutside);
  },
  beforeDestroy() {
    this.hidePopover();
    $('body').off('.field-key-list');
  },
  methods: {
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
      const $content = $(popoverContentTemplate);
      $content
        .find('.field-key-list-img-container')
        .append(fieldKey.qrCodeHtml());
      $content.find('a').text(this.$t('qrCodeHelp'));
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
      if (popoverLink === this.popoverLink) return;
      this.hidePopover();
      const $popoverLink = $(popoverLink);
      this.enablePopover(fieldKey, $popoverLink);
      $popoverLink.popover('show');
      this.popoverLink = popoverLink;
    },
    showRevoke(fieldKey) {
      this.revoke.fieldKey = fieldKey;
      this.showModal('revoke');
    },
    afterCreate(fieldKey) {
      this.$emit('fetch-field-keys');
      this.hideModal('newFieldKey');
      this.$alert().success(this.$t('alert.create', fieldKey));
      this.highlighted = fieldKey.id;
    },
    afterRevoke(fieldKey) {
      this.$emit('fetch-field-keys');
      this.hideModal('revoke');
      this.$alert().success(this.$t('alert.revoke', fieldKey));
      this.highlighted = null;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#field-key-list-table {
  table-layout: fixed;

  th:nth-child(5) {
    width: $padding-left-table-data + $padding-right-table-data +
      $min-width-dropdown-menu;
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

<i18n lang="json5">
{
  "en": {
    "action": {
      "create": "Create App User"
    },
    "heading": {
      "full": "App Users in this Project only will be able to download and use Forms within this Project. When you create a new App User, it will not have access to any Forms at first. To set the Forms each App User may access, use the {formAccess} tab. Multiple devices can use the same App User profile without problem.",
      "formAccess": "Form Access"
    },
    "header": {
      "lastUsed": "Last Used",
      // Header for the table column that shows QR codes to configure data collection clients such as ODK Collect.
      "configureClient": "Configure Client"
    },
    // Linked to a help file about QR codes to configure data collection clients.
    "qrCodeHelp": "What’s this?",
    "emptyTable": "There are no App Users yet. You will need to create some to download Forms and submit data from your device.",
    "alert": {
      "create": "The App User “{displayName}” was created successfully.",
      "revoke": "Access was revoked for the App User “{displayName}”."
    }
  }
}
</i18n>
