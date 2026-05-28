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


<script setup lang="ts">

import { computed, getCurrentInstance, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
/* eslint-disable-next-line import/no-unresolved -- not sure why eslint is complaining about it */
import { OdkWebForm, /*webFormsPlugin,*/ POST_SUBMIT__NEW_INSTANCE } from '@getodk/web-forms';
// import Modal from './modal.vue';

// import { apiPaths, isProblem, queryString, requestAlertMessage } from '../util/request';
// import { modalData } from '../util/reactivity';
// import { noop } from '../util/util';
// import { runSequentially } from '../util/promise';
// import { useRequestData } from '../request-data';
// import useRequest from '../composables/request';
// import useRoutes from '../composables/routes';

// const { resourceStates, form, createResource } = useRequestData();
// const formVersionXml = createResource('formVersionXml');
// const { request } = useRequest();
// const submissionAttachments = createResource('submissionAttachments');
// const submissionModal = modalData();
const route = useRoute();
const router = useRouter();
// const { submissionPath } = useRoutes();

const projectParam = route.params.projectId; // TODO don't trust anything!
const formParam = route.params.xmlFormId;

defineOptions({
  name: 'WebFormRenderer'
});

// const props = defineProps({
//   actionType: {
//     type: String,
//     required: true
//   },
//   instanceId: String
// });

const emit = defineEmits(['loaded']);

// Install webFormsPlugin lazily here (not at app startup) to avoid loading @getodk/web-forms on every page.
// This is safe because this component is already loaded asynchronously.
// const inst = getCurrentInstance();
// inst.appContext.app.use(webFormsPlugin);

// const { i18n } = inject('container');

// const { initiallyLoading, dataExists } = props.actionType === 'edit' ? resourceStates([formVersionXml, submissionAttachments]) : resourceStates([formVersionXml]);

// watch(() => initiallyLoading.value, (value) => {
//   if (!value) emit('loaded');
// });

// const isPublicLink = computed(() => !!route.query.st);

const formXml = ref<string>();
const submissionResult = {};
let submissionData = {};
let clearForm;

const withToken = (url) => `${url}${queryString({ st: route.query.st })}`;
const getFormXml = () => {
  const encodedFormId = encodeURIComponent(formParam);
  const draftPath = '';
  const qs = '';
  const url = `/v1/projects/${projectParam}/forms/${encodedFormId}${draftPath}.xml${qs}`;
  fetch(url)
    .then((response) => response.text())
    .then((xml) => { formXml.value = xml })
    .catch((e) => console.err);
};

const getAttachment = (requestUrl) => {
  const encodedFormId = encodeURIComponent(formParam);
  const encodedName = encodeURIComponent(requestUrl.pathname.split('/').pop());
  const draftPath = '';
  const url = `/v1/projects/${projectParam}/forms/${encodedFormId}${draftPath}/attachments/${encodedName}`;
  return fetch(url)
    .catch((e) => console.err);
};

const postPrimaryInstance = async (file) => {
  const encodedFormId = encodeURIComponent(formParam);
  const draftPath = '';
  const qs = '';
  const extension = '';
  const url = `/v1/projects/${projectParam}/forms/${encodedFormId}${draftPath}/submissions${extension}${qs}`;
  // isEdit.value ? 'PUT' : 'POST',
  const headers = {
    'Content-Type': 'text/xml',
    'odk-client': `odk-web-forms/${__WEB_FORMS_VERSION__}`,
    'Accept': 'application/json, text/plain, */*',
    'X-Requested-With': 'XMLHttpRequest'
  };
  const response = await fetch(url, { body: file, headers, method: 'POST' });
  if (response.ok) {
    const data = await response.json();
    return { success: true, data };
  }
  return {
    success: false,
    data: 'i think we need an error message here?'
  };
};

const showModal = (opts) => {
  alert('show modal');
};

const handleResult = () => {
  const attachmentResultArr = [...submissionResult.attachmentResult.values()];
  // Success handler
  if (submissionResult.primaryInstanceResult.success && attachmentResultArr.every(r => r.success)) {
    clearForm();
    // if (isPublicLink.value) {
    //   showModal({ type: 'thankYouModal', hideable: false });
    // } else if (isEdit.value) {
    //   showModal({ type: 'editSubmissionModal', hideable: false });
    //   setTimeout(() => {
    //     router.push(submissionPath(form.projectId, form.xmlFormId, props.instanceId));
    //   }, 2000);
    // } else {
      showModal({ type: 'submissionModal', hideable: false });
    // }
  }

  // Error handler - Primary Instance
  // if (!submissionResult.primaryInstanceResult.success) {
  //   const error = submissionResult.primaryInstanceResult.data;
  //   if (error.response && isProblem(error.response.data) && error.response.data.code === 401.2) {
  //     showModal({ type: 'sessionTimeoutModal' });
  //   } else {
  //     showModal({ type: 'errorModal', errorMessage: requestAlertMessage(i18n, error) });
  //   }
  // }

  // // Error handler - Attachments
  // if (attachmentResultArr.some(r => !r.success)) {
  //   const isSessionTimeout = attachmentResultArr.some(r => {
  //     const error = r.data;
  //     return error.response && isProblem(error.response.data) && error.response.data.code === 401.2;
  //   });
  //   if (isSessionTimeout) {
  //     showModal({ type: 'sessionTimeoutModal', hideable: false });
  //   } else {
  //     showModal({ type: 'retryModal', hideable: false });postPrimaryInstance
  //   }
  // }
};

const uploadAttachment = async (attachment, instanceId) => {
  throw new Error('todo');
  // const url = withToken(apiPaths.submissionAttachment(form.projectId, form.xmlFormId, !form.publishedAt, instanceId, attachment.name));
  // const result = {};
  // try {
  //   const requestOptions = {
  //     method: 'POST',
  //     url,
  //     data: attachment,
  //     alert: false,
  //     headers: {
  //       'content-type': attachment.type
  //     }
  //   };
  //   const { data } = await request(requestOptions);
  //   result.success = true;
  //   result.data = data;
  // } catch (error) {
  //   result.success = false;
  //   result.data = error;
  // }

  // return { name: attachment.name, result };
};

const submitData = async () => {
  // showModal({ type: 'sendingDataModal', hideable: false });

  if (!submissionResult.primaryInstanceResult.success) {
    submissionResult.primaryInstanceResult = await postPrimaryInstance(submissionData.instanceFile);
  }
/*
  if (submissionResult.primaryInstanceResult.success) {
    const attachmentRequests = submissionData.attachments
      .filter(a => !submissionResult.attachmentResult.get(a.name).success)
      .map(a => () => uploadAttachment(a, submissionResult.primaryInstanceResult.data.instanceId));
    const attachmentResult = await runSequentially(attachmentRequests);
    attachmentResult.forEach(r => {
      submissionResult.attachmentResult.set(r.name, r.result);
    });
  }
*/
  handleResult();
};

const initializeSubmissionState = (data, clearFormCallback) => {
  submissionData = data;

  submissionResult.primaryInstanceResult = {
    success: false
  };

  submissionResult.attachmentResult = new Map();
  data.attachments.forEach(attachment => {
    submissionResult.attachmentResult.set(attachment.name, {
      success: false
    });
  });

  clearForm = () => {
    clearFormCallback({ next: POST_SUBMIT__NEW_INSTANCE });
  };
};


const handleSubmit = async (payload, callback) => {
  // if (props.actionType === 'preview') {
  //   showModal({ type: 'previewModal' });
  //   return;
  // }
  const { data: [data], status } = payload;
  if (status !== 'ready') {
    // Status is not ready when Form is not valid and in that case submit button will be disabled,
    // hence this branch should never execute.
    return;
  }

  initializeSubmissionState(data, callback);
  await submitData();
};

getFormXml();

</script>
<!--
    <OdkWebForm
      :form-xml="formXml"
      :edit-instance="editInstanceOptions"
      :fetch-form-attachment="getAttachment"
      :track-device="true"
      @submit="handleSubmit"/>
-->

<template>
  <template v-if="formXml">
    <OdkWebForm
      :form-xml="formXml"
      :fetch-form-attachment="getAttachment"
      :track-device="true"
      @submit="handleSubmit"/>
  </template>
<!--
  <modal id="web-form-renderer-submission-modal" :state="submissionModal.state" :hideable="submissionModal.hideable" backdrop @hide="hideModal()">
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
        <i18n-t v-else-if="submissionModal.type === 'retryModal'" tag="p" keypath="retryModal.body">
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
        <button type="button" class="btn btn-link" @click="closeWindow()">
          {{ $t('action.close') }}
        </button>
        <button type="button" class="btn btn-primary" @click="hideModal()">
          {{ $t('submissionModal.action.fillOutAgain') }}
        </button>
      </div>
      <!-- Any type of error while sending attachments --
      <div v-else-if="submissionModal.type === 'retryModal'
        || (submissionModal.type === 'sessionTimeoutModal' && !submissionModal.hideable)"
        class="modal-actions">
        <button type="button" class="btn btn-primary" @click="submitData()">
          {{ $t('action.tryAgain') }}
        </button>
      </div>
      <!-- Preview modal or any type of error while submitting primary instance --
      <div v-else-if="submissionModal.type === 'previewModal'
        || submissionModal.type === 'errorModal'
        || submissionModal.type === 'sessionTimeoutModal' && submissionModal.hideable"
        class="modal-actions">
        <button type="button" class="btn btn-primary" @click="hideModal()">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
-->
</template>
