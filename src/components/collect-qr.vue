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
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span class="collect-qr" v-html="imgHtml"></span>
</template>

<script>
import qrcode from 'qrcode-generator';
import pako from 'pako/lib/deflate';

export default {
  name: 'CollectQr',
  props: {
    // General settings only (not admin settings)
    settings: {
      type: Object,
      required: true
    },
    errorCorrectionLevel: {
      type: String,
      required: true
    },
    cellSize: {
      type: Number,
      required: true
    }
  },
  computed: {
    fullSettings() {
      return {
        general: {
          ...this.settings,
          server_url: `${window.location.origin}${this.settings.server_url}`
        },
        // Collect requires the settings to have an `admin` property.
        admin: {}
      };
    },
    imgHtml() {
      const code = qrcode(0, this.errorCorrectionLevel);
      const json = JSON.stringify(this.fullSettings);
      code.addData(btoa(pako.deflate(json, { to: 'string' })));
      code.make();
      return code.createImgTag(this.cellSize, 0);
    }
  }
};
</script>
