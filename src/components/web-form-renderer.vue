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
  <template v-if="formVersionXml.dataExists">
    <!-- update primaryInstance.instanceId to rerender the component -->
    <OdkWebForm :key="primaryInstance.instanceId" :form-xml="formVersionXml.data" :fetch-form-attachment="getAttachment" @submit="handleSubmit"/>
  </template>

  <modal v-bind="submissionModal" hideable backdrop @hide="hideSubmissionModal()">
    <template #title>{{ $t(submissionModal.type + '.title') }}</template>
    <template #body>
      <i18n-t v-if="submissionModal.type === 'errorModal'" tag="p" keypath="errorModal.body">
        <template #errorMessage>
          <br><br>
            {{ submissionModal.errorMessage }}
          <br><br>
        </template>
        <template #supportEmail>
          <a href="emailto:support@getodk.org">support@getodk.org</a>
        </template>
      </i18n-t>
      <p v-else>
        {{ $t(submissionModal.type + '.body') }}
      </p>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="hideSubmissionModal()">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, createApp, getCurrentInstance, reactive } from 'vue';
import { useRoute } from 'vue-router';
/* eslint-disable-next-line import/no-unresolved -- not sure why eslint is complaining about it */
import { OdkWebForm, webFormsPlugin } from '@getodk/web-forms';
import useForm from '../request-data/form';
import { apiPaths, isProblem } from '../util/request';
import Loading from './loading.vue';
import Modal from './modal.vue';
import { modalData } from '../util/reactivity';
import useRequest from '../composables/request';
import { useRequestData } from '../request-data';
import { noop } from '../util/util';

const { resourceStates } = useRequestData();
const { form, formVersionXml } = useForm();
const { request } = useRequest();
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

const { initiallyLoading } = resourceStates([form, formVersionXml]);

const isPublicLink = computed(() => !!route.query.st);

const fetchData = () => {
  let url = apiPaths.formXml(form.projectId, form.xmlFormId, !!form.draftToken);
  if (form.draftToken) {
    url = url.replace(/^\/v1\//, `/v1/test/${form.draftToken}/`);
  }
  if (route.query.st) {
    url += `?st=${route.query.st}`;
  }
  formVersionXml.request({
    url
  });
};

fetchData();

const showModal = (type) => {
  submissionModal.state = true;
  submissionModal.type = `${type}Modal`;
};

const hideSubmissionModal = () => {
  submissionModal.hide();
  primaryInstance.instanceId = null;
};

/**
 * Web Form expects host application to provide a function that it can use to
 * fetch attachments. Signature of the function is (url) => Response; where
 * Response is subset of web standard  {@link Response}.
 */
const getAttachment = (url) => {
  let requestUrl = apiPaths.formAttachment(
    form.projectId,
    form.xmlFormId,
    form.draftToken !== null,
    url.pathname.substring(1)
  );
  if (form.draftToken) {
    requestUrl = requestUrl.replace(/^\/v1\//, `/v1/test/${form.draftToken}/`);
  }
  if (route.query.st) {
    requestUrl += `?st=${route.query.st}`;
  }
  return request({
    url: requestUrl,
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
};

const postPrimaryInstance = () => {
  let url = apiPaths.submissions(form.projectId, form.xmlFormId, form.draftToken, '');
  if (form.draftToken) {
    url = url.replace(/^\/v1\//, `/v1/test/${form.draftToken}/`);
  }
  if (route.query.st) {
    url += `?st=${route.query.st}`;
  }
  return request({
    method: 'POST',
    url,
    data: primaryInstance.file,
    headers: {
      'content-type': 'text/xml'
    },
    fulfillProblem: () => true
  })
    .then(({ data }) => {
      if (isProblem(data)) {
        primaryInstance.uploadSuccess = false;
        submissionModal.errorMessage = data.message;
        showModal('error');
        return false;
      }
      Object.assign(primaryInstance, { instanceId: data.instanceId, uploadSuccess: true });
      return true;
    })
    .catch(noop);
};

const uploadAttachment = async (attachmentIndex) => {
  const attachmentDescriptor = attachmentUploads[attachmentIndex];
  let url = apiPaths.submissionAttachment(form.projectId, form.xmlFormId, false, primaryInstance.instanceId, attachmentDescriptor.file.name);
  if (form.draftToken) {
    url = url.replace(/^\/v1\//, `/v1/test/${form.draftToken}/`);
  }
  if (route.query.st) {
    url += `?st=${route.query.st}`;
  }
  await request({
    method: 'POST',
    url,
    data: attachmentDescriptor.file,
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

    return true;
  }

  return false;
};


/**
 * When WebForms's submit button is clicked, it dispatches an event which is handed to
 * this handler, which can then upload the form and its attachments as present in the
 * event payload.
 */
const handleSubmit = async (payload) => {
  // TODO: waiting for web-forms v0.7, current version doesn't return any payload.
  // eslint-disable-next-line no-constant-condition
  if (props.actionType === 'preview') {
    showModal('preview');
  } else {
    // eslint-disable-next-line no-unused-vars
    const { data, definition, status, violations } = payload;
    if (status !== 'ready') {
      // Status is not ready when Form is not valid and in that case submit button will be disabled,
      // hence this branch should never execute.
      return;
    }

    primaryInstance.file = data.instanceFile;
    data.attachments.forEach((file, ix) => { attachmentUploads[ix] = { file, progress: null, uploadSuccess: null }; });

    const result = await postSubmission();

    if (result) {
      if (isPublicLink.value) {
        showModal('thankYou');
        formVersionXml.reset();
      } else {
        showModal('submission');
      }
    }

    // TODO: redirect or clear Form or say do nothing based on the workflow new/edit/public-link
    // related issue getodk/central#928
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
      },
      "previewModal": {
        "title": "Data is valid",
        "body": "The data you entered is valid, but it was not submitted because this is a Form preview."
      },
      "submissionModal": {
        "title": "Submission successful",
        "body": "Your data was submitted."
      },
      "thankYouModal": {
        "title": "Thank you for participating!",
        "body": "You can close this window now."
      },
      "editSubmissionModal": {
        "title": "Submission successful",
        "body": "You will now be redirected."
      },
      "errorModal": {
        "title": "Submission error",
        "body": "Your data was not submitted. Error message: {errorMessage} You can close this dialog and try again. If the error keeps happening, please contact the person who asked you to fill this form or {supportEmail}."
      }
    }
  }
</i18n>
