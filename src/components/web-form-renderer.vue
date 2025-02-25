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
  <loading :state="initiallyLoading"/>
  <template v-if="!initiallyLoading">
    <OdkWebForm :form-xml="formVersionXml.data" :fetch-form-attachment="getAttachment" @submit="handleSubmit"/>
  </template>

  <modal v-bind="previewModal" hideable backdrop @hide="previewModal.hide()">
    <template #title>{{ $t('WebformFill.previewModal.title') }}</template>
    <template #body>
      {{ $t('WebformFill.previewModal.body') }}
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="previewModal.hide()">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>

    <modal v-bind="submissionModal" hideable backdrop @hide="submissionModal.hide()">
      <template #title>{{ $t('WebformFill.submissionModal.title') }}</template>
      <template #body>
        {{ $t('WebformFill.submissionModal.body') }}

        <div v-if="!primaryInstance.uploadSuccess === true">
          <div v-if="primaryInstance.uploadSuccess === false">
            <p>
              Submitting primary instance failed.
            </p>
            <button type="button" @click="postSubmission()">Retry</button>
          </div>
          <div v-else>
            <p>
              Submitting primary instance...
            </p>
          </div>
        </div>
        <div v-else>
          <p>
            Primary instance submitted, the ID of your submission is:<br>
            <pre>{{ primaryInstance.instanceId }}</pre>
          </p>
          <div v-if="Object.keys(attachmentUploads).length">
            <h3>File upload progress</h3>
            <div v-for="(uploadinfo, ix) in attachmentUploads" :key="ix">
              <label><progress max="100" :value="uploadinfo.progress"></progress>&nbsp;{{ uploadinfo.file.name }}</label>
              <template v-if="uploadinfo.uploadSuccess === false">
                <span class="icon-warning"></span><button type="button" @click="uploadAttachment(ix)">Retry</button>
              </template>
              <span v-if="uploadinfo.uploadSuccess" class="icon-check"></span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button v-if="primaryInstance.uploadSuccess && attachmentUploads.every(({ uploadSuccess }) => uploadSuccess)" type="button" class="btn btn-primary" @click="submissionModal.hide()">
            {{ $t('action.close') }}
          </button>
        </div>
      </template>
    </modal>
</template>

<script setup>
import { createApp, getCurrentInstance, reactive } from 'vue';
import { useRoute } from 'vue-router';
/* eslint-disable-next-line import/no-unresolved -- not sure why eslint is complaining about it */
import { OdkWebForm, webFormsPlugin } from '@getodk/web-forms';
import useForm from '../request-data/form';
import { apiPaths } from '../util/request';
import Loading from './loading.vue';
import Modal from './modal.vue';
import { modalData } from '../util/reactivity';
import useRequest from '../composables/request';
import { useRequestData } from '../request-data';

const { resourceStates } = useRequestData();
const { form, formVersionXml } = useForm();
const { request } = useRequest();
const previewModal = modalData();
const submissionModal = modalData();
const attachmentUploads = reactive([]);
const primaryInstance = reactive({ instanceId: null, uploadSuccess: null, file: null });
const route = useRoute();

defineOptions({
  name: 'WebFormRenderer'
});

const props = defineProps({
  actionType: String
});

// Install WebFormsPlugin in the component instead of installing it at the
// application level so that @getodk/web-forms package is not loaded for every
// page, thus increasing the initial bundle
const app = createApp({});
app.use(webFormsPlugin);
const inst = getCurrentInstance();
// webFormsPlugin just adds globalProperty ($primevue)
inst.appContext.config.globalProperties = {
  ...inst.appContext.config.globalProperties,
  ...app._context.config.globalProperties
};

const authHeaders =
  route.query.st ? { Authorization: `Bearer ${route.query.st}` } : {};

const { initiallyLoading } = resourceStates([form, formVersionXml]);

const fetchData = () => {
  let url = apiPaths.formXml(form.projectId, form.xmlFormId, !!form.draftToken);
  if (form.draftToken) {
    url = url.replace(/^\/v1\//, `/v1/test/${form.draftToken}/`);
  }
  formVersionXml.request({
    url,
    headers: {
      ...authHeaders
    }
  });
};

fetchData();

/**
 * Web Form expects host application to provide a function that it can use to
 * fetch attachments. Signature of the function is (url) => Response; where
 * Response is subset of web standard  {@link Response}.
 */
const getAttachment = (url) => request({
  url: apiPaths.formAttachment(
    form.projectId,
    form.xmlFormId,
    form.draftToken !== null,
    url.pathname.substring(1)
  ),
  ...authHeaders,
  alert: false
}).then(axiosResponse => {
  const { data, status, statusText, headers } = axiosResponse;

  const fetchHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (key === 'content-type') {
      // because web-forms doens't want space between media type and charset
      // https://github.com/getodk/web-forms/issues/269
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

const postPrimaryInstance = () => {
  let url = apiPaths.submissions(form.projectId, form.xmlFormId, form.draftToken, '');
  if (form.draftToken) {
    url = url.replace(/^\/v1\//, `/v1/test/${form.draftToken}/`);
  }
  return request({
    method: 'POST',
    url,
    data: primaryInstance.file,
    headers: {
      'content-type': 'text/xml'
    },
  })
    .catch((err) => { primaryInstance.uploadSuccess = false; throw err; })
    .then(({ data }) => {
      Object.assign(primaryInstance, { instanceId: data.instanceId, uploadSuccess: true });
      return true;
    });
};

const uploadAttachment = async (attachmentIndex) => {
  const attachmentDescriptor = attachmentUploads[attachmentIndex];
  await request({
    method: 'POST',
    url: apiPaths.submissionAttachment(form.projectId, form.xmlFormId, false, primaryInstance.instanceId, attachmentDescriptor.file.name),
    data: attachmentDescriptor.file,
    ...authHeaders,
    onUploadProgress: (progressEvent) => {
      attachmentDescriptor.progress = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
    },
  })
    .then(() => {
      attachmentDescriptor.uploadSuccess = true;
    })
    .catch(() => {
      Object.assign(attachmentDescriptor, { uploadSuccess: false, progress: null });
    });
};

const postSubmission = async () => {
  // TODO: add logic for edit submission

  if (await postPrimaryInstance()) {
    // eslint-disable-next-line no-unused-vars
    for (const [ix, _] of attachmentUploads.entries()) {
      // Post each attachment in turn, and not in parallel. Parallel transfers means more time spent per transfer, which
      // under adverse network conditions increases the probability that the transfer does not complete. And since uploads
      // as of yet are not resumable, this would mean restarting the upload from 0 again.
      // eslint-disable-next-line no-await-in-loop
      await uploadAttachment(ix);
    }
  }
};

/**
 * When WebForms's submit button is clicked, it dispatches an event which is handed to
 * this handler, which can then upload the form and its attachments as present in the
 * event payload.
 */
const handleSubmit = async (payload) => {
  if (props.actionType === 'preview') {
    previewModal.show();
  } else {
    submissionModal.show();
    // eslint-disable-next-line no-unused-vars
    const { data, definition, status, violations } = payload;
    if (status !== 'ready') {
      console.log('submission payload is not ready');
      // TODO: what to do now?
      return;
    }

    primaryInstance.file = data.instanceFile;
    data.attachments.forEach((file, ix) => { attachmentUploads[ix] = { file, progress: null, uploadSuccess: null }; });

    // demo code: mock attachments (webforms doesn't do uploads yet)
    // [
    //   new File([new ArrayBuffer(5 * 1024 * 1024)], 'some-attachment', { type: 'application/octet-stream' }),
    //   new File([new ArrayBuffer(5 * 1024 * 1024)], 'some-other-attachment', { type: 'application/octet-stream' }),
    // ].forEach((file, ix) => { attachmentUploads[ix] = { file, progress: null, uploadSuccess: null }; });
    // end demo mock

    await postSubmission();
  }
};

</script>

<style lang="scss">
@import '../assets/scss/_variables.scss';

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
      "WebformFill": {
        "previewModal": {
          // This text is the title of a dialog box / modal shown when the user presses submit button on the preview of Web Forms.
          "title": "ODK Web Forms Preview",
          // This text is the body of a dialog box / modal shown when the user presses submit button on the preview of Web Forms.
          "body": "You have completed the form preview using ODK Web Forms. The Submission was not sent."
        },
        "submissionModal": {
          // This text is the title of a dialog box / modal shown when the user presses submit button on Web Forms.
          "title": "ODK Web Forms Submission",
          // This text is the body of a dialog box / modal shown when the user presses submit button on Web Forms.
          "body": "You have completed filling out a form using ODK Web Forms."
        }
      }
    }
  }
</i18n>
