<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="field-key-qr-panel panel panel-default"
    :class="{ legacy: !managed }">
    <div class="panel-heading">
      <h1 class="panel-title">
        {{ managed ? $t('title.managed') : $t('title.legacy') }}
      </h1>
      <span class="icon-mobile"></span>
    </div>
    <div v-if="fieldKey != null" class="panel-body">
      <collect-qr :settings="settings" error-correction-level="L"
        :cell-size="3"/>
      <p>
        <i18n v-if="managed" :tag="false" path="body[0].managed.full">
          <template #managedCode>
            <strong>{{ $t('body[0].managed.managedCode') }}</strong>
          </template>
        </i18n>
        <i18n v-else :tag="false" path="body[0].legacy.full">
          <template #legacyCode>
            <strong>{{ $t('body[0].legacy.legacyCode') }}</strong>
          </template>
        </i18n>

        {{ managed ? $t('body[1].managed', fieldKey) : $t('body[1].legacy') }}

        <i18n v-if="managed" :tag="false" path="body[2].managed.full">
          <template #switchToLegacy>
            <i18n tag="a" path="body[2].managed.switchToLegacy"
              class="switch-code" href="#">
              <template #legacyCode>
                <strong>{{ $t('body[2].managed.legacyCode') }}</strong>
              </template>
            </i18n>
          </template>
        </i18n>
        <i18n v-else :tag="false" path="body[2].legacy.full">
          <template #switchToManaged>
            <i18n tag="a" path="body[2].legacy.switchToManaged"
              class="switch-code" href="#">
              <template #managedCode>
                <strong>{{ $t('body[2].legacy.managedCode') }}</strong>
              </template>
            </i18n>
          </template>
        </i18n>
      </p>
      <p>
        {{ $t('body[3]', fieldKey) }}
        <doc-link to="collect-import-export/">{{ $t('moreInfo.learnMore') }}</doc-link>
      </p>
    </div>
  </div>
</template>

<script>
import CollectQr from '../collect-qr.vue';
import DocLink from '../doc-link.vue';

import FieldKey from '../../presenters/field-key';
import { apiPaths } from '../../util/request';

export default {
  name: 'FieldKeyQrPanel',
  components: { CollectQr, DocLink },
  props: {
    fieldKey: FieldKey, // eslint-disable-line vue/require-default-prop
    managed: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    settings() {
      const { token, projectId } = this.fieldKey;
      const settings = {
        server_url: apiPaths.serverUrlForFieldKey(token, projectId)
      };
      if (this.managed) settings.form_update_mode = 'match_exactly';
      return settings;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.field-key-qr-panel {
  margin-bottom: 0;
  width: 500px;

  .panel-heading {
    background-color: $color-action-background;
    position: relative;
  }

  // The icon is not animated, because in the popover, switching between a
  // managed and a legacy QR code would reset the animation.
  .icon-mobile {
    color: $color-action-overlay;
    font-size: 98px;
    position: absolute;
    right: 18px;
    top: -32px;
    transform: rotate(15deg);

    &::after {
      background-color: #fff;
      content: '';
      height: 65px;
      left: 5px;
      position: absolute;
      top: 18px;
      width: 32px;
      z-index: -1;
    }
  }

  .collect-qr {
    float: left;
    margin-right: 15px;
  }

  p {
    &:first-child { margin-top: 5px; }
    &:last-child { margin-bottom: 5px; }
  }

  &.legacy {
    .panel-heading { background-color: #777; }
    .icon-mobile { color: #555; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. "Client" refers to a data
    // collection client like ODK Collect. "Code" refers to a QR code.
    "title": {
      "managed": "Client Configuration Code",
      "legacy": "Legacy Client Configuration Code"
    },
    "body": [
      {
        "managed": {
          "full": "This is a {managedCode}.",
          "managedCode": "Managed QR Code"
        },
        "legacy": {
          "full": "This is a {legacyCode}.",
          "legacyCode": "Legacy QR Code"
        }
      },
      // "Get Blank Form" is the text of a button in ODK Collect.
      {
        "managed": "Collect will exactly match the Forms available to “{displayName}” including automatically applying updates. Users will not need to manually Get Blank Forms.",
        "legacy": "Users will have to manually Get Blank Forms on the device and determine which Forms to update.",
      },
      {
        "managed": {
          "full": "For the old behavior, {switchToLegacy}.",
          "switchToLegacy": "switch to a {legacyCode}",
          "legacyCode": "Legacy QR Code"
        },
        "legacy": {
          "full": "For a more controlled and foolproof process, {switchToManaged}.",
          "switchToManaged": "switch to a {managedCode}",
          "managedCode": "Managed QR Code"
        }
      },
      "Scan this QR code to configure a device with the account “{displayName}”."
    ]
  }
}
</i18n>
