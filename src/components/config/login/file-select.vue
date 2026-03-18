<template>
  <div class="config-login-file-select">
    <template v-if="!exists">
      <file-drop-zone :disabled="awaitingResponse"
        @drop="post($event.dataTransfer.files[0])">
        <span class="icon-file-o"></span>
        <i18n-t keypath="select.full">
          <template #upload>
            <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
            <input v-show="false" ref="input" type="file" accept=".jpg,.jpeg,.png"
              @change="changeInput">
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
const { toast } = inject('container');

const exists = computed(() => {
  const config = serverConfig[props.name];
  return config != null && config.blobExists;
});

const { request, awaitingResponse } = useRequest();
const url = computed(() => `/v1/config/${props.name}`);
const post = (file) => {
  request({
    method: 'POST',
    url: url.value,
    data: file,
    headers: { 'Content-Type': file.type }
  })
    .then(({ data }) => {
      serverConfig[props.name] = data;
      toast.show(t('alert.post'));
    })
    .catch(noop);
};

const input = ref(null);
const changeInput = (event) => {
  post(event.target.files[0]);
  input.value.value = '';
};

const del = () => {
  request({ method: 'DELETE', url: url.value })
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
      "post": "Image successfully saved.",
      "del": "Image successfully removed."
    }
  }
}
</i18n>
