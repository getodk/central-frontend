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
  <file-drop-zone id="entity-upload-file-select" :disabled="parsing"
    @drop="$emit('change', $event.dataTransfer.files[0])">
    <div id="entity-upload-file-select-heading">
      <i18n-t tag="div" keypath="text.full">
        <template #chooseOne>
          <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
          <input v-show="false" ref="input" type="file" accept=".csv"
            @change="changeInput">
          <button type="button" class="btn btn-primary" :aria-disabled="parsing"
            @click="input.click()">
            <span class="icon-folder-open"></span>{{ $t('text.chooseOne') }}
          </button>
        </template>
      </i18n-t>
      <div v-show="parsing"><spinner inline/>{{ $t('parsing') }}</div>
    </div>
    <slot></slot>
  </file-drop-zone>
</template>

<script setup>
import { ref } from 'vue';

import FileDropZone from '../../file-drop-zone.vue';
import Spinner from '../../spinner.vue';

defineOptions({
  name: 'EntityUploadFileSelect'
});
defineProps({
  parsing: Boolean
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
  margin-top: 27px;
  text-align: left;

  &.disabled { opacity: 1; }

  > :first-child { margin-top: -4px; }
  > :last-child { margin-bottom: -4px; }
}

#entity-upload-file-select-heading {
  font-size: 16px;
  margin-bottom: 1px;
  position: relative;

  .disabled > & {
    > :first-child { opacity: 0.09; }

    > :nth-child(2) {
      left: 0;
      position: absolute;
      top: 1px;
    }
  }

  .spinner {
    margin-right: 6px;
    top: 1px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "text": {
      "full": "Drag a .csv file here, or {chooseOne} to import.",
      "chooseOne": "choose one"
    },
    "parsing": "Reading data…"
  }
}
</i18n>
