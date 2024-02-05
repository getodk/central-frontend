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

<!-- eslint-disable vue/no-v-html -->
<template>
  <span class="collect-qr" v-html="imgHtml"></span>
</template>
<!-- eslint-enable vue/no-v-html -->

<script setup>
import { computed } from 'vue';
import qrcode from 'qrcode-generator';
import pako from 'pako/lib/deflate';

defineOptions({
  name: 'CollectQr'
});

const props = defineProps({
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
});

const imgHtml = computed(() => {
  const code = qrcode(0, props.errorCorrectionLevel);
  const json = JSON.stringify(props.settings);
  code.addData(btoa(pako.deflate(json, { to: 'string' })));
  code.make();
  return code.createImgTag(props.cellSize, 0);
});

</script>
