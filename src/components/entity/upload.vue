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
  <modal id="entity-upload" :state="state" :hideable="!uploading" size="full"
    backdrop @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div :class="{ backdrop: uploading }">
        <loading :state="serverEntities.initiallyLoading"/>
        <entity-upload-file-select v-show="file == null" @change="selectFile">
          <div>
            <span>{{ $t('headersNote') }}</span>
            <sentence-separator/>
            <entity-upload-data-template/>
          </div>
        </entity-upload-file-select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary"
          :aria-disabled="file == null || uploading" @click="upload">
          {{ $t('action.append') }}
        </button>
        <button type="button" class="btn btn-link" :aria-disabled="uploading"
          @click="$emit('hide')">
          {{ $t('action.cancel') }}
        </button>
      </div>
      <div v-if="file != null" id="entity-upload-popups">
        <!-- TODO. Pass the actual count. -->
        <entity-upload-popup :filename="file.name" :count="1"
          :awaiting-response="uploading" :progress="uploadProgress"
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
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import SentenceSeparator from '../sentence-separator.vue';

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

const defaultPageSize = 5;

const { dataset, createResource } = useRequestData();
const serverEntities = createResource('serverEntities');
watch(() => props.state, (state) => {
  if (state) {
    if (dataset.entities === 0) return;
    serverEntities.request({
      url: apiPaths.odataEntities(dataset.projectId, dataset.name, {
        $orderby: '__system/createdAt asc',
        $top: defaultPageSize
      })
    }).catch(noop);
  } else {
    serverEntities.reset();
  }
});

const file = ref(null);
const selectFile = (value) => { file.value = value; };
const clearFile = () => { file.value = null; };
watch(() => props.state, (state) => { if (!state) clearFile(); });

const { request, awaitingResponse: uploading } = useRequest();
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

#entity-upload {
  .backdrop {
    opacity: 0.27;
    pointer-events: none;
  }
}

#entity-upload-popups {
  animation-duration: 2s;
  animation-name: tocorner;
  animation-timing-function: cubic-bezier(0.05, 0.9, 0, 1);
  bottom: 70px;
  position: absolute;
  right: 15px;
  width: 305px;
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
