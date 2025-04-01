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
    <!-- update instanceId to rerender the component -->
    <OdkWebForm :key="instanceId" :form-xml="formVersionXml.data" :fetch-form-attachment="getAttachment" @submit="handleSubmit"/>
  </template>

  <modal id="web-form-renderer-submission-modal" v-bind="submissionModal" hideable backdrop @hide="hideSubmissionModal()">
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
        <p v-else>
          {{ $t(submissionModal.type + '.body') }}
        </p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="hideSubmissionModal()">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, createApp, getCurrentInstance, ref } from 'vue';
import { useRoute } from 'vue-router';
/* eslint-disable-next-line import/no-unresolved -- not sure why eslint is complaining about it */
import { OdkWebForm, webFormsPlugin } from '@getodk/web-forms';
import { apiPaths, isProblem, queryString } from '../util/request';
import Loading from './loading.vue';
import Modal from './modal.vue';
import { modalData } from '../util/reactivity';
import useRequest from '../composables/request';
import { useRequestData } from '../request-data';
import { noop } from '../util/util';
import { runSequentially } from '../util/promise';

const { resourceStates, form, createResource } = useRequestData();
const formVersionXml = createResource('formVersionXml');
const { request } = useRequest();
const submissionModal = modalData();
const instanceId = ref(null);
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

const { initiallyLoading } = resourceStates([formVersionXml]);

const isPublicLink = computed(() => !!route.query.st);

const withToken = (url) => {
  if (form.draftToken) {
    return url.replace(/^\/v1\//, `/v1/test/${form.draftToken}/`);
  }
  return `${url}${queryString({ st: route.query.st })}`;
};

const fetchData = () => {
  const url = withToken(apiPaths.formXml(form.projectId, form.xmlFormId, !!form.draftToken));
  formVersionXml.request({
    url
  }).catch(noop);
};

fetchData();

const hideSubmissionModal = () => {
  if (submissionModal.type !== 'errorModal') {
    instanceId.value = null;
  }
  submissionModal.hide();
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

const postPrimaryInstance = (file) => {
  const url = withToken(apiPaths.submissions(form.projectId, form.xmlFormId, !!form.draftToken, ''));
  return request({
    method: 'POST',
    url,
    data: file,
    headers: {
      'content-type': 'text/xml'
    },
    fulfillProblem: () => true
  })
    .then(({ data }) => {
      if (isProblem(data)) {
        submissionModal.show({ type: 'errorModal', errorMessage: data.message });
        return false;
      }
      instanceId.value = data.instanceId;
      return true;
    })
    .catch(noop);
};

const uploadAttachment = async (attachment) => {
  const url = withToken(apiPaths.submissionAttachment(form.projectId, form.xmlFormId, !!form.draftToken, instanceId.value, attachment.file.name));
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
const handleSubmit = async (payload) => {
  if (props.actionType === 'preview') {
    submissionModal.show({ type: 'previewModal' });
  } else {
    const { data, status } = payload;
    if (status !== 'ready') {
      // Status is not ready when Form is not valid and in that case submit button will be disabled,
      // hence this branch should never execute.
      return;
    }

    const submissionRequestResult = await postPrimaryInstance(data.instanceFile);

    if (submissionRequestResult) {
      const attachmentRequests = data.attachments.map(a => () => uploadAttachment(a));
      const attachmentResults = await runSequentially(attachmentRequests);

      // TODO: what to do if attachments upload fail - blocked, need to define requirements / UX
      if (attachmentResults.every(r => !isProblem(r))) {
        if (isPublicLink.value) {
          submissionModal.show({ type: 'thankYouModal' });
          formVersionXml.reset(); // hides the Form
        } else {
          submissionModal.show({ type: 'submissionModal' });
        }
      }
    }
  }
};

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
        "body": "Your data was not submitted. Error message: {errorMessage} You can close this dialog and try again. If the error keeps happening, please contact the person who asked you to fill this Form or {supportEmail}."
      }
    }
  }
</i18n>
