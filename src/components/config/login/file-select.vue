<template>
  <div class="config-login-file-select">
    <template v-if="!exists">
      <file-drop-zone :disabled="awaitingResponse" @drop="drop">
        <span class="icon-file-o"></span>
        <i18n-t keypath="select.full">
          <template #upload>
            <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
            <input v-show="false" ref="input" type="file"
              :accept="accept.join(',')" @change="changeInput">
            <a href="#" role="button" @click="input.click()">
              {{ $t('select.upload') }}
            </a>
          </template>
        </i18n-t>
      </file-drop-zone>
      <spinner :state="awaitingResponse"/>
    </template>
    <button v-else type="button" class="btn btn-primary" @click="del">
      {{ $t('action.remove') }}
      <spinner :state="awaitingResponse"/>
    </button>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import FileDropZone from '../../file-drop-zone.vue';
import Spinner from '../../spinner.vue';

import useRequest from '../../../composables/request';
import { apiPaths } from '../../../util/request';
import { noop } from '../../../util/util';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'ConfigLoginFileSelect'
});
const props = defineProps({
  name: {
    type: String,
    required: true
  }
});

const { t } = useI18n();
const { serverConfig } = useRequestData();
const { toast, redAlert } = inject('container');

const exists = computed(() => {
  const config = serverConfig[props.name];
  return config != null && config.blobExists;
});

const { request, awaitingResponse } = useRequest();
const post = (file) => {
  request({
    method: 'POST',
    url: apiPaths.config(props.name),
    data: file,
    headers: { 'Content-Type': file.type }
  })
    .then(({ data }) => {
      serverConfig[props.name] = data;
      toast.show(t('alert.post'));
    })
    .catch(noop);
};

const accept = ['.jpg', '.jpeg', '.png'];
const getExtension = (filename) => {
  const i = filename.lastIndexOf('.');
  return i <= 0 ? '' : filename.slice(i).toLowerCase();
};
const drop = (event) => {
  const file = event.dataTransfer.files[0];
  if (!accept.includes(getExtension(file.name)))
    redAlert.show(t('alert.invalidType'));
  else
    post(file);
};

const input = ref(null);
const changeInput = (event) => {
  post(event.target.files[0]);
  input.value.value = '';
};

const del = () => {
  request({ method: 'DELETE', url: apiPaths.config(props.name) })
    .then(() => {
      delete serverConfig[props.name];
      toast.show(t('alert.del'));
    })
    .catch(noop);
};
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

.config-login-file-select {
  position: relative;

  .icon-file-o { margin-right: $margin-right-icon; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "select": {
      "full": "Drag image here or {upload}",
      "upload": "upload file"
    },
    "action": {
      "remove": "Remove image"
    },
    "alert": {
      "invalidType": "File type not accepted.",
      "post": "Image successfully saved.",
      "del": "Image successfully removed."
    }
  }
}
</i18n>
