<template>
  <div id="config-login-edit">
    <p class="file-label">{{ $t('logo.label') }}</p>
    <p>{{ $t('logo.help') }}</p>
    <config-login-file-select name="logo"/>

    <form @submit.prevent="submit">
      <div class="form-group">
        <label for="config-login-edit-title">{{ $t('field.title') }}</label>
        <p id="config-login-edit-title-help">{{ $t('title.help') }}</p>
        <input id="config-login-edit-title" v-model.trim="title"
          class="form-control" aria-describedby="config-login-edit-title-help"
          :placeholder="$t('login.defaultTitle')" autocomplete="off">
      </div>

      <div class="form-group">
        <label for="config-login-edit-description">{{ $t('field.description') }}</label>
        <p id="config-login-edit-description-help">{{ $t('description.help') }}</p>
        <input id="config-login-edit-description" v-model.trim="description"
          class="form-control"
          aria-describedby="config-login-edit-description-help"
          :placeholder="$t('login.defaultDescription')" autocomplete="off">
      </div>

      <button type="submit" class="btn btn-primary">
        {{ $t('action.save') }} <spinner :state="awaitingResponse"/>
      </button>
    </form>

    <p class="file-label">{{ $t('hero.label') }}</p>
    <p>{{ $t('hero.help') }}</p>
    <config-login-file-select name="hero-image"/>
  </div>
</template>

<script setup>
import { inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import ConfigLoginFileSelect from './file-select.vue';
import Spinner from '../../spinner.vue';

import useRequest from '../../../composables/request';
import { noop } from '../../../util/util';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'ConfigLoginEdit'
});

const { t } = useI18n();
const { serverConfig } = useRequestData();
const { toast } = inject('container');

const initialAppearance = serverConfig['login-appearance']?.value;
const title = ref(initialAppearance?.title ?? '');
const description = ref(initialAppearance?.description ?? '');

const { request, awaitingResponse } = useRequest();
const submit = () => {
  const data = {};
  if (title.value !== '') data.title = title.value;
  if (description.value !== '') data.description = description.value;

  request({ method: 'POST', url: '/v1/config/login-appearance', data })
    .then(response => {
      serverConfig['login-appearance'] = response.data;
      toast.show(t('alert.success'));
    })
    .catch(noop);
};
</script>

<style lang="scss">
#config-login-edit {
  .file-drop-zone, .btn-primary { margin-bottom: 40px; }
  .form-group { margin-bottom: 25px; }
  button[type="submit"] { margin-top: -10px; }

  .file-label, label { font-size: 16px; }
  label { font-weight: normal; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "logo": {
      "label": "Logo",
      "help": "We recommend using an image with a white or transparent background of at least 150x150 pixels."
    },
    "title": {
      "help": "A title for your server login."
    },
    "description": {
      "help": "A brief description of your project space."
    },
    "hero": {
      "label": "Hero image",
      "help": "We recommend using a high-resolution image in JPG or PNG format. For best results, use a visually engaging image that represents your brand or message."
    },
    "alert": {
      // @transifexKey component.AnalyticsForm.alert.success
      "success": "Settings successfully saved."
    }
  }
}
</i18n>
