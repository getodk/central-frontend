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
import { InstanceData, MonolithicInstancePayload } from '@getodk/xforms-engine';
import { type Form } from './preview.vue';
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
// const route = useRoute();
// const router = useRouter();
// const { submissionPath } = useRoutes();

// const projectParam = route.params.projectId; // TODO don't trust anything!

defineOptions({
  name: 'WebFormRenderer'
});

export interface WebFormsRendererProps {
  projectId: number;
  form: Form;
  actionType: string; // TODO type this? ['new', 'edit', 'public-link', 'offline', 'preview']
  instanceId?: string;
}

const props = defineProps<WebFormsRendererProps>();

// const emit = defineEmits(['loaded']);

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
const submissionResult:any = {};
let clearForm:Function;
const loading = ref<boolean>(true);
const isEdit = computed(() => props.actionType === 'edit');
const attachmentNames = ref<string[]>();

// const withToken = (url) => `${url}${queryString({ st: route.query.st })}`;
// const getFormXml = () => {
//   const encodedFormId = encodeURIComponent(formParam);
//   const draftPath = '';
//   const qs = '';
//   const url = `/v1/projects/${projectParam}/forms/${encodedFormId}${draftPath}.xml${qs}`;
//   fetch(url)
//     .then((response) => response.text())
//     .then((xml) => { formXml.value = xml })
//     .catch((e) => console.err);
// };

const getAttachment = (requestUrl: URL) => {
  const encodedName = encodeURIComponent(requestUrl.pathname.split('/').pop()!);
  const draftPath = '';
  const url = `/v1/projects/${props.projectId}/forms/${props.form.xmlFormId}${draftPath}/attachments/${encodedName}`;
  return fetch(url);
};

const postPrimaryInstance = async (file:File) => {
  const draftPath = '';
  const qs = '';
  let url;
  let method;
  if (isEdit.value) {
    url = `/v1/projects/${props.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}${qs}`;
    method = 'PUT';
  } else {
    url = `/v1/projects/${props.projectId}/forms/${props.form.xmlFormId}${draftPath}/submissions${qs}`;
    method = 'POST';
  }
  const headers = {
    'Content-Type': 'text/xml',
    'odk-client': `odk-web-forms/${__WEB_FORMS_VERSION__}`,
    'Accept': 'application/json, text/plain, */*',
    'X-Requested-With': 'XMLHttpRequest'
  };
  const response = await fetch(url, { body: file, headers, method });
  if (response.ok) {
    const data = await response.json();
    return { success: true, data };
  }
  return {
    success: false,
    data: 'i think we need an error message here?'
  };
};

const showModal = (opts:any) => {
  console.log(opts);
  alert('show modal');
};

const handleResult = () => {
  /*
  const attachmentResultArr = [...submissionResult.attachmentResult.values()];
  // Success handler
  if (submissionResult.primaryInstanceResult.success && attachmentResultArr.every(r => r.success)) {
    */clearForm();/*
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
*/
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
  //     showModal({ type: 'retryModal', hideable: false });
  //   }
  // }
};

const uploadAttachment = async (attachment: File, instanceId: string) => {
  // const url = withToken(apiPaths.submissionAttachment(form.projectId, form.xmlFormId, !form.publishedAt, instanceId, attachment.name));

  const draftPath = '';
  const encodedInstanceId = encodeURIComponent(instanceId);
  const encodedName = encodeURIComponent(attachment.name);

  const url = `/v1/projects/${props.projectId}/forms/${props.form.xmlFormId}${draftPath}/submissions/${encodedInstanceId}/attachments/${encodedName}`;

  let result;
  try {
    const headers = {
      'Content-Type': attachment.type,
      'X-Requested-With': 'XMLHttpRequest'
    };
    const response = await fetch(url, { body: attachment, headers, method: 'POST' });
    if (response.ok) {
      const data = await response.json();
      result = { success: true, data };
    }
  } catch (error) {
    result = { success: false, data: error };
  }

  return { name: attachment.name, result };
};

const submitData = async (data: any, clearFormCallback: Function) => {
  // showModal({ type: 'sendingDataModal', hideable: false });
  const instanceFile = data.instanceFile as File;
  const attachments = data.attachments as File[];
  
  submissionResult.primaryInstanceResult = {
    success: false
  };

  submissionResult.attachmentResult = new Map();
  attachments.forEach(attachment => {
    submissionResult.attachmentResult.set(attachment.name, {
      success: false
    });
  });

  clearForm = () => {
    clearFormCallback({ next: POST_SUBMIT__NEW_INSTANCE });
  };

  if (!submissionResult.primaryInstanceResult.success) {
    submissionResult.primaryInstanceResult = await postPrimaryInstance(instanceFile);
  }

  if (submissionResult.primaryInstanceResult.success) {
    const instanceId = submissionResult.primaryInstanceResult.data.instanceId;
    const attachmentRequests = attachments
      .filter(a => !submissionResult.attachmentResult.get(a.name).success)
      .map(a => uploadAttachment(a, instanceId));
    const attachmentResult = await Promise.all(attachmentRequests);
    attachmentResult.forEach(r => {
      submissionResult.attachmentResult.set(r.name, r.result);
    });
  }

  handleResult();
};

const handleSubmit = async (
  payload: MonolithicInstancePayload,
	clearFormCallback: Function
) => {
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

  await submitData(data, clearFormCallback);
};

/**
 * Convert AxiosResponse into subset of web standard  {@link Response} that satisfies Web-Forms'
 * requirements
 */
const transformAttachmentResponse = async (response: Response) => {
  const { status, statusText, headers } = response;

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
  const contentType = headers.get('content-type');
  if (contentType && (contentType.includes('application/json') || contentType.includes('application/geo+json'))) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return new Response(body, {
    status,
    statusText,
    headers: fetchHeaders,
  });
};

const fetchSubmissionXml = async () => {
  // const encodedFormId = encodeURIComponent(props.form.xmlFormId);
  // const encodedInstanceId = encodeURIComponent(props.instanceId);
  const qs = '';//queryString(query);
  const url = `/v1/projects/${props.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}.xml${qs}`;
  const response = await fetch(url);
  return await response.text();
};

const fetchSubmissionAttachments = async () => {
  const qs = '';//queryString(query);
  const url = `/v1/projects/${props.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}/attachments${qs}`;
  const response = await fetch(url);
  const attachments = await response.json();
  attachmentNames.value = attachments
    .filter((a:any) => a.exists)
    .map((a:any) => a.name);
};

const fetchSubmissionAttachment = async (attachmentName: string) => {
  // Draft is always false because we don't support editing of draft submissions
  const encodedName = encodeURIComponent(attachmentName);
  const url = `/v1/projects/${props.projectId}/forms/${props.form.xmlFormId}/submissions/${props.instanceId}/attachments/${encodedName}`;
  const response = await fetch(url);
  return transformAttachmentResponse(response);
};

const editInstanceOptions = computed(() => {
  if (isEdit.value) {
    return {
      resolveInstance: fetchSubmissionXml,
      attachmentFileNames: attachmentNames.value,
      resolveAttachment: fetchSubmissionAttachment
    };
  }
  return null;
}); 


if (isEdit.value) {
  fetchSubmissionAttachments().then(() => {
    loading.value = false;
  })
} else {
  loading.value = false;
}

// getFormXml();

</script>

<template>
  <template v-if="!loading">
    <OdkWebForm
      :form-xml="props.form.xform"
      :edit-instance="editInstanceOptions"
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
