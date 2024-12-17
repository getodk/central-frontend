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
      <loading :state="formVersionXml.initiallyLoading"/>

      <template v-if="formVersionXml.dataExists">
        <OdkWebForm :form-xml="formVersionXml.data" :fetch-form-attachment="getAttachment" @submit="handleSubmit"/>
      </template>

      <modal v-bind="previewModal" hideable backdrop @hide="previewModal.hide()">
          <template #title>{{ $t('webFormPreview.submissionModal.title') }}</template>
          <template #body>
            {{ $t('webFormPreview.submissionModal.body') }}
            <div class="modal-actions">
              <button type="button" class="btn btn-primary" @click="previewModal.hide()">
                {{ $t('action.close') }}
              </button>
            </div>
          </template>
      </modal>
</template>

<script setup>
import { createApp, getCurrentInstance } from 'vue';
/* eslint-disable-next-line import/no-unresolved -- not sure why eslint is complaining about it */
import { OdkWebForm, webFormsPlugin } from '@getodk/web-forms';
import useForm from '../../request-data/form';
import { apiPaths } from '../../util/request';
import Modal from '../modal.vue';
import Loading from '../loading.vue';
import { modalData } from '../../util/reactivity';
import useRequest from '../../composables/request';

// Install WebFormsPlugin in the component instead of installing it at the
// application level so that @getodk/web-forms package is not loaded for every
// page, thus increasing the initial bundle
const app = createApp({});
app.use(webFormsPlugin);
const inst = getCurrentInstance();
// webFormsPlugin just adds config property to the appContext
inst.appContext.config = app._context.config;

defineOptions({
  name: 'FormPreview'
});

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  },
  draft: {
    type: Boolean,
    required: true
  }
});

const { form, formVersionXml } = useForm();
const { request } = useRequest();

const previewModal = modalData();

const fetchForm = () => {
  Promise.allSettled([
    form.request({ url: apiPaths.form(props.projectId, props.xmlFormId), extended: true, alert: false }),
    formVersionXml.request({ url: apiPaths.formXml(props.projectId, props.xmlFormId, props.draft) })
  ]);
};

fetchForm();

const handleSubmit = () => {
  previewModal.show();
};



/**
 * Web Form expects host application to provide a function that it can use to
 * fetch attachments. Signature of the function is (url) => Response; where
 * Response is subset of web standard  {@link Response}.
 */
const getAttachment = (url) => request({
  url: apiPaths.formAttachment(
    props.projectId,
    props.xmlFormId,
    props.draft,
    url.pathname.split('/').pop()
  ),
  alert: false
}).then(axiosResponse => {
  const { data, status, statusText, headers } = axiosResponse;

  const fetchHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (key === 'content-type') {
      // because web-forms doens't want space between media type and charset
      // https://github.com/getodk/web-forms/pull/259#discussion_r1887227207
      fetchHeaders.append(key, value.replace('; charset', ';charset'));
    } else {
      fetchHeaders.append(key, value);
    }
  }

  let body;
  if (typeof (data) === 'string') {
    body = data;
  } else if (headers['content-type'].includes('application/json') ||
             headers['content-type'].includes('application/geo+json')) {
    body = JSON.stringify(data);
  } else {
    // eslint-disable-next-line no-console
    console.error('response data is not a known text format');
  }

  return new Response(body, {
    status,
    statusText,
    headers: fetchHeaders,
  });
});
</script>

<style lang="scss">
:root {
  font-size: 16px;
}
html, body {
  background-color: var(--gray-200);
  box-shadow: none;
}
</style>

<i18n lang="json5">
  {
    "en": {
      "webFormPreview":{
        "submissionModal": {
          // This text is the title of a dialog box / modal shown when the user presses submit button on the preview of new Web Forms.
          "title": "ODK Web Forms Preview",
          // This text is the body of a dialog box / modal shown when the user presses submit button on the preview of new Web Forms.
          "body": "You have completed the Form using an early version of the new ODK Web Forms. The Submission was not sent: currently, you can only view your Forms in ODK Web Forms."
        }
      }
    }
  }
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "webFormPreview": {
      "submissionModal": {
        "title": "ODK Web Forms Vorschau",
        "body": "Sie haben das Formular mit einer frühen Version der neuen ODK Web Forms ausgefüllt. Die Übermittlung wurde nicht gesendet: Derzeit können Sie Ihre Formulare nur in ODK Web Forms ansehen."
      }
    }
  },
  "es": {
    "webFormPreview": {
      "submissionModal": {
        "title": "Vista previa de ODK Web Forms",
        "body": "Ha rellenado el formulario utilizando una versión provisional del nuevo ODK Web Forms. El Envío no se ha enviado: actualmente, sólo puedes ver tus Formularios en ODK Web Forms."
      }
    }
  },
  "fr": {
    "webFormPreview": {
      "submissionModal": {
        "title": "Aperçu avec ODK Web forms",
        "body": "Vous avez renseigné le formulaire avec une version préliminaire d'ODK Web Forms. La soumission n'a pas été envoyée : pour le moment, vous ne pouvez que visualiser vos formulaires avec ODK Web Forms."
      }
    }
  },
  "it": {
    "webFormPreview": {
      "submissionModal": {
        "title": "Anteprima di ODK Web Forms",
        "body": "Il formulario è stato compilato utilizzando una prima versione del nuovo ODK Web Forms. L'invio non è stato inviato: attualmente è possibile visualizzare i formulari solo in ODK Web Forms."
      }
    }
  },
  "zh-Hant": {
    "webFormPreview": {
      "submissionModal": {
        "title": "ODK Web 表單預覽",
        "body": "您已使用新 ODK Web 表單的早期版本填寫了該表單。提交內容未傳送：目前，您只能在 ODK Web 表單中檢視表單。"
      }
    }
  }
}
</i18n>
