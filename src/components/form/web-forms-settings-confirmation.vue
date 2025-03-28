<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <confirmation v-bind="confirm" @hide="$emit('hide')" @success="setWebformsEnabled">
    <template v-if="webformsEnabled" #body>
      <!-- TODO: for ODK Web Forms, we need to show modal with an image. Reuse "what's new" modal,
              once it is done in getodk/central#801 -->
      <p>
        {{ $t('webformsConfirmation.intro') }}
      </p>
      <i18n-t tag="p" keypath="webformsConfirmation.description.full">
        <template #seeSupportedFeatures>
          <a href="https://github.com/getodk/web-forms?tab=readme-ov-file#feature-matrix"
            target="_blank">
            {{ $t('webformsConfirmation.description.seeSupportedFeatures') }}
          </a>
        </template>
        <template #previewYourForm>
          <router-link :to="previewPath" target="_blank">
            {{ $t('webformsConfirmation.description.previewYourForm') }}
          </router-link>
        </template>
      </i18n-t>
    </template>
    <template v-else #body>
      <p>
        {{ $t('enketoConfirmation.description') }}
      </p>
    </template>
  </confirmation>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Confirmation from '../confirmation.vue';
import useRoutes from '../../composables/routes';
import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

const { form } = useRequestData();
const { formPath } = useRoutes();
const { t } = useI18n();

defineOptions({
  name: 'FormWebFormsSettingsConfirmation'
});

const props = defineProps({
  state: Boolean,
  webformsEnabled: Boolean
});

const emit = defineEmits(['hide', 'success']);

const previewPath = computed(() => formPath(
  form.projectId,
  form.xmlFormId,
  'preview'
));

const confirm = computed(() => {
  const result = {
    state: props.state,
    noText: t('action.cancel'),
    awaitingResponse: form.awaitingResponse
  };
  if (props.webformsEnabled) {
    result.title = 'ODK Web Forms';
    result.yesText = t('webformsConfirmation.useOdkWebForms');
  } else {
    result.title = 'Enketo';
    result.yesText = t('enketoConfirmation.useEnketo');
  }
  return result;
});

const setWebformsEnabled = () => {
  form.request({
    method: 'PATCH',
    url: apiPaths.form(form.projectId, form.xmlFormId),
    data: { webformsEnabled: props.webformsEnabled },
    patch: ({ data }) => {
      form.updatedAt = data.updatedAt;
      form.webformsEnabled = data.webformsEnabled;
    }
  })
    .then(() => {
      emit('success');
    })
    .catch(noop);
};
</script>

<i18n lang="json5">
  {
    "en": {
      "webformsConfirmation": {
        // The words "ODK Web Forms" should not be translated
        "useOdkWebForms": "Use ODK Web Forms",
        "intro": "We’re building a new web-forms experience designed to be fast and user-friendly!",
        "description": {
          "full": "Some functionality might be lost; {seeSupportedFeatures} for details and {previewYourForm} before opting in.",
          "seeSupportedFeatures": "see supported features",
          "previewYourForm": "preview your form"
        }
      },
      "enketoConfirmation": {
        // The words "Enketo" and "ODK Web Forms" should not be translated
        "description": "Are you sure you want to switch from ODK Web Forms to Enketo?",
        // The word "Enketo" should not be translated
        "useEnketo": "Use Enketo"
      }
    }
  }
</i18n>
