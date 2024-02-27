<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <file-drop-zone id="entity-upload-file-select"
    @drop="$emit('change', $event.dataTransfer.files[0])">
    <i18n-t tag="div" keypath="text.full">
      <template #chooseOne>
        <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
        <input v-show="false" ref="input" type="file" accept=".csv"
          @change="changeInput">
        <button type="button" class="btn btn-primary" @click="input.click()">
          <span class="icon-folder-open"></span>{{ $t('text.chooseOne') }}
        </button>
      </template>
    </i18n-t>
    <slot></slot>
  </file-drop-zone>
</template>

<script setup>
import { ref } from 'vue';

import FileDropZone from '../../file-drop-zone.vue';

defineOptions({
  name: 'EntityUploadFileSelect'
});
const emit = defineEmits(['change']);

const input = ref(null);
const changeInput = (event) => {
  emit('change', event.target.files[0]);
  input.value.value = '';
};
</script>

<style lang="scss">
#entity-upload-file-select {
  border-radius: 5px;
  padding-bottom: 10px;
  padding-top: 10px;
  text-align: left;

  > :first-child {
    font-size: 16px;
    margin-bottom: 1px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "text": {
      "full": "Drag a .csv file here, or {chooseOne} to import.",
      "chooseOne": "choose one"
    }
  }
}
</i18n>
