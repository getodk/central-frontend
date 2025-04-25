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
  <template v-if="dataExists">
    <OdkWebForm
      :form-xml="formVersionXml.data"
      :edit-instance="editInstanceOptions"
      :fetch-form-attachment="getAttachment"
      @submit="handleSubmit"/>
  </template>

  <modal id="sending-data" v-bind="sendingDataModal" backdrop>
    <template #title>{{ $t('sendingDataModal.title') }}</template>
    <template #body>
      {{ $t('sendingDataModal.body') }}
    </template>
  </modal>

  <modal id="web-form-renderer-submission-modal" v-bind="submissionModal" hideable backdrop @hide="hideModals()">
    <template #title>{{ $t(submissionModal.type + '.title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <i18n-t v-if="submissionModal.type === 'errorModal'" tag="p" keypath="errorModal.body">
          <template #errorMessage>
            <br><br>
              <pre>{{ submissionModal.errorMessage }}</pre>
          </template>
          <template #supportEmail>
            <a href="emailto:support@getodk.org">support@getodk.org</a>
          </template>
        </i18n-t>
        <i18n-t v-else-if="submissionModal.type === 'sessionTimeoutModal'" tag="p" keypath="sessionTimeoutModal.body.full">
          <template #here>
              <a href="/login" target="_blank">{{ $t('sessionTimeoutModal.body.here') }}</a>
          </template>
        </i18n-t>
        <p v-else>
          {{ $t(submissionModal.type + '.body') }}
        </p>
      </div>
      <div v-if="submissionModal.type === 'submissionModal'" class="modal-actions">
        <button type="button" class="btn btn-primary" @click="hideModals()">
          {{ $t('submissionModal.action.fillOutAgain') }}
        </button>
        <button type="button" class="btn btn-link" @click="closeWindow()">
          {{ $t('action.close') }}
        </button>
      </div>
      <div v-else class="modal-actions">
        <button type="button" class="btn btn-primary" @click="hideModals()">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, createApp, getCurrentInstance, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
/* eslint-disable-next-line import/no-unresolved -- not sure why eslint is complaining about it */
import { OdkWebForm, webFormsPlugin, POST_SUBMIT__NEW_INSTANCE } from '@getodk/web-forms';
import Loading from './loading.vue';
import Modal from './modal.vue';

import { apiPaths, isProblem, queryString } from '../util/request';
import { modalData } from '../util/reactivity';
import { noop } from '../util/util';
import { runSequentially } from '../util/promise';
import { useRequestData } from '../request-data';
import useRequest from '../composables/request';
import useRoutes from '../composables/routes';

const { resourceStates, form, createResource } = useRequestData();
const formVersionXml = createResource('formVersionXml');
const { request } = useRequest();
const submissionAttachments = createResource('submissionAttachments');
const submissionModal = modalData();
const sendingDataModal = modalData();
const route = useRoute();
const router = useRouter();
const { submissionPath } = useRoutes();

defineOptions({
  name: 'WebFormRenderer'
});

const props = defineProps({
  actionType: {
    type: String,
    required: true
  },
  instanceId: String
});

// Install WebFormsPlugin in the component instead of installing it at the
// application level so that @getodk/web-forms package is not loaded for every
// page, thus increasing the initial bundle
const app = createApp({});
app.use(webFormsPlugin);
const inst = getCurrentInstance();
// webFormsPlugin just adds globalProperty ($primevue)
Object.assign(inst.appContext.config.globalProperties, app._context.config.globalProperties);


const { initiallyLoading, dataExists } = props.actionType === 'edit' ? resourceStates([formVersionXml, submissionAttachments]) : resourceStates([formVersionXml]);

const isPublicLink = computed(() => !!route.query.st);

const withToken = (url) => `${url}${queryString({ st: route.query.st })}`;

const isEdit = computed(() => props.actionType === 'edit');

/**
 * Convert AxiosResponse into subset of web standard  {@link Response} that satisfies Web-Forms'
 * requirements
 */
const transformAttachmentResponse = (axiosResponse) => {
  const { data, status, statusText, headers } = axiosResponse;

  const fetchHeaders = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (key === 'content-type') {
      // because web-forms doesn't want space between media type and charset
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
};

const fetchFormXml = () => {
  const url = withToken(apiPaths.formXml(form.projectId, form.xmlFormId, !!form.draftToken));
  return formVersionXml.request({
    url
  }).catch(noop);
};

const fetchSubmissionXml = () => {
  const requestUrl = apiPaths.submissionXml(form.projectId, form.xmlFormId, props.instanceId);
  return request({
    url: requestUrl,
    alert: false
  })
    .then(({ data }) => data)
    .catch(noop);
};

const fetchSubmissionAttachments = () => {
  const requestUrl = apiPaths.submissionAttachments(form.projectId, form.xmlFormId, props.instanceId);
  return submissionAttachments.request({
    url: requestUrl,
    alert: false
  })
    .then(transformAttachmentResponse)
    .catch(noop);
};

const fetchSubmissionAttachment = (name) => {
  // Draft is always false because we don't support editing of draft submissions
  const requestUrl = apiPaths.submissionAttachment(form.projectId, form.xmlFormId, false, props.instanceId, name);
  return request({
    url: requestUrl,
    alert: false
  })
    .then(({ data }) => data) // TODO: prob same things as getFormAttachment fn
    .catch(noop);
};

const editInstanceOptions = computed(() => {
  if (isEdit.value && submissionAttachments.dataExists) {
    return {
      resolveInstance: fetchSubmissionXml,
      attachmentFileNames: submissionAttachments.data,
      resolveAttachment: fetchSubmissionAttachment
    };
  }
  return null;
});

const fetchData = () => {
  fetchFormXml();
  if (isEdit.value) fetchSubmissionAttachments();
};

fetchData();

/**
 * Hide all modals
 */
const hideModals = () => {
  submissionModal.hide();
  sendingDataModal.hide();
};

/**
 * Displays the specified modal while hiding all others.
 * Ensures that only one modal is visible at a time.
 *
 * @param {Object} modal - The modal instance to display.
 * @param {Object} [options] - Optional parameters to pass to modal.show().
 */
const showModal = (modal, options) => {
  hideModals();
  modal.show(options);
};

const closeWindow = () => {
  window.close();
};

/**
 * Web Form expects host application to provide a function that it can use to
 * fetch attachments. Signature of the function is (url) => Response; where
 * Response is subset of web standard  {@link Response}.
 */
const getAttachment = (url) => {
  const requestUrl = withToken(apiPaths.formAttachment(
    form.projectId,
    form.xmlFormId,
    !form.publishedAt,
    url.pathname.split('/').pop()
  ));
  return request({
    url: requestUrl,
    alert: false
  }).then(transformAttachmentResponse);
};

const postPrimaryInstance = (file) => {
  let url = apiPaths.submissions(form.projectId, form.xmlFormId, !form.publishedAt, '');

  if (isEdit.value) {
    url = apiPaths.submission(form.projectId, form.xmlFormId, props.instanceId);
  }
  url = withToken(url);
  return request({
    method: isEdit.value ? 'PUT' : 'POST',
    url,
    data: file,
    headers: {
      'content-type': 'text/xml'
    },
    fulfillProblem: () => true
  })
    .then(({ data }) => {
      if (isProblem(data)) {
        if (data.code === 403.1) {
          showModal(submissionModal, { type: 'sessionTimeoutModal' });
        } else {
          showModal(submissionModal, { type: 'errorModal', errorMessage: data.message });
        }
        return false;
      }
      return data.currentVersion.instanceId;
    })
    .catch(noop);
};

const uploadAttachment = async (attachment, instanceId) => {
  const url = withToken(apiPaths.submissionAttachment(form.projectId, form.xmlFormId, !form.publishedAt, instanceId, attachment.file.name));
  return request({
    method: 'POST',
    url,
    data: attachment.file,
    fulfillProblem: () => true
  })
    .then(({ data }) => data)
    .catch(noop);
};

/**
 * When WebForms's submit button is clicked, it dispatches an event which is handed to
 * this handler, which can then upload the form and its attachments as present in the
 * event payload.
 */
const handleSubmit = async (payload, callback) => {
  if (props.actionType === 'preview') {
    showModal(submissionModal, { type: 'previewModal' });
  } else {
    const { data: [data], status } = payload;
    showModal(sendingDataModal);
    if (status !== 'ready') {
      // Status is not ready when Form is not valid and in that case submit button will be disabled,
      // hence this branch should never execute.
      return;
    }

    const instanceId = await postPrimaryInstance(data.instanceFile);

    if (instanceId) {
      const attachmentRequests = data.attachments.map(a => () => uploadAttachment(a));
      const attachmentResults = await runSequentially(attachmentRequests);

      // TODO: what to do if attachments upload fail - blocked, need to define requirements / UX
      if (attachmentResults.every(r => !isProblem(r))) {
        callback({ next: POST_SUBMIT__NEW_INSTANCE }); // tell OWF to clear out the Form
        if (isPublicLink.value) {
          showModal(submissionModal, { type: 'thankYouModal' });
          formVersionXml.reset(); // hides the Form
        } else if (isEdit.value) {
          router.push(submissionPath(form.projectId, form.xmlFormId, props.instanceId));
        } else {
          showModal(submissionModal, { type: 'submissionModal' });
        }
      }
    }
  }
};

// hack to remove ODK Web Form css styles
onUnmounted(() => {
  document.querySelectorAll('style').forEach(styleTag => {
    if (styleTag.textContent.includes('form-initialization-status')) {
      styleTag.remove();
    }
  });
});
</script>

<style lang="scss">
@import '../assets/scss/_variables.scss';

:root:has(.odk-form) {
  font-size: 16px;
}
html, body {
  &:has(.odk-form) {
    background-color: var(--gray-200);
    box-shadow: none;
  }
}

#web-form-renderer-submission-modal pre {
  white-space: pre-wrap;
}

</style>

<i18n lang="json5">
  {
    "en": {
      "previewModal": {
        "title": "Data is valid",
        "body": "The data you entered is valid, but it was not submitted because this is a Form preview."
      },
      "submissionModal": {
        "title": "Form successfully sent!",
        "body": "You can fill this Form out again or close if you’re done.",
        "action": {
          "fillOutAgain": "Fill out again"
        }
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
        "body": "Your data was not submitted. Error message: {errorMessage} You can close this dialog and try again. If the error keeps happening, please contact the person who asked you to fill this Form or {supportEmail}."
      },
      "sendingDataModal": {
        "title": "Sending Submission",
        "body": "Your data is being submitted. Please don’t close this window until it’s finished."
      },
      "sessionTimeoutModal": {
        "title": "Session expired",
        "body": {
          "full": "Please log in {here} in a different browser tab and try again.",
          "here": "here"
        }
      }
    }
  }
</i18n>
