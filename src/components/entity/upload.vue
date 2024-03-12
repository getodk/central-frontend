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
  <modal id="entity-upload" :state="state" :hideable="!awaitingResponse"
    size="full" backdrop @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <entity-upload-file-select v-show="file == null" @change="selectFile">
        <div>
          <span>{{ $t('headersNote') }}</span>
          <sentence-separator/>
          <entity-upload-data-template/>
        </div>
      </entity-upload-file-select>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary"
          :aria-disabled="file == null || awaitingResponse" @click="upload">
          {{ $t('action.append') }} <spinner :state="awaitingResponse"/>
        </button>
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
      </div>
      <div v-if="file != null" id="entity-upload-popups">
        <!-- TODO. Pass the actual count. -->
        <entity-upload-popup :filename="file.name" :count="1"
          :awaiting-response="awaitingResponse" :progress="uploadProgress"
          @clear="clearFile"/>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { ref, watch } from 'vue';

import EntityUploadDataTemplate from './upload/data-template.vue';
import EntityUploadFileSelect from './upload/file-select.vue';
import EntityUploadPopup from './upload/popup.vue';
import Modal from '../modal.vue';
import SentenceSeparator from '../sentence-separator.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityUpload'
});
const props = defineProps({
  state: Boolean
});
const emit = defineEmits(['hide', 'success']);

const { dataset } = useRequestData();

const file = ref(null);
const selectFile = (value) => { file.value = value; };
const clearFile = () => { file.value = null; };
watch(() => props.state, (state) => { if (!state) clearFile(); });

const { request, awaitingResponse } = useRequest();
const uploadProgress = ref(0);
const upload = () => {
  request({
    method: 'POST',
    url: apiPaths.entities(dataset.projectId, dataset.name),
    data: {
      source: { name: file.value.name, size: file.value.size },
      entities: []
    },
    onUploadProgress: (event) => { uploadProgress.value = event.progress ?? 0; }
  })
    // TODO. Emit the correct count.
    .then(() => { emit('success', 1); })
    .finally(() => { uploadProgress.value = 0; })
    .catch(noop);
};
</script>

<style lang="scss">
@keyframes tocorner {
  0% { transform: translate(-70px, -70px); }
  100% { transform: translate(0, 0); }
}

#entity-upload-popups {
  animation-duration: 2s;
  animation-iteration-count: 1;
  animation-name: tocorner;
  animation-timing-function: cubic-bezier(0.05, 0.9, 0, 1);
  bottom: 70px;
  position: absolute;
  right: 15px;
  width: 325px;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Import Data from File",
    "headersNote": "The first row in your data file must exactly match the table header you see above.",
    "action": {
      "append": "Append data"
    }
  }
}
</i18n>
