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
  <web-form-renderer v-if="dataExists && form.webformsEnabled && hasAccess" :action-type="actionType"/>
  <enketo-iframe v-if="dataExists && !form.webformsEnabled && hasAccess"
    :enketo-id="form.enketoId"
    :action-type="offline ? 'offline' : actionType"
    :instance-id="instanceId"/>
</template>

<script setup>
import { defineOptions, defineAsyncComponent, watchEffect, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import Loading from '../loading.vue';

import { noop } from '../../util/util';
import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { useRequestData } from '../../request-data';
import useRoutes from '../../composables/routes';

defineOptions({
  name: 'FormSubmission'
});

const props = defineProps({
  projectId: String,
  xmlFormId: String,
  instanceId: String,
  actionType: String,
  enketoId: String,
  draft: Boolean,
  offline: {
    type: Boolean,
    default: false
  }
});

const route = useRoute();
const router = useRouter();
const { project, resourceStates, form } = useRequestData();
const { t } = useI18n();
const { newSubmissionPath, offlineSubmissionPath } = useRoutes();

const resources = computed(() => (props.projectId ? [project, form] : [form]));

const { initiallyLoading, dataExists } = computed(() => {
  const state = resourceStates(resources.value);
  return {
    initiallyLoading: state.initiallyLoading,
    dataExists: state.dataExists
  };
}).value;

const WebFormRenderer = defineAsyncComponent(loadAsync('WebFormRenderer'));
const EnketoIframe = defineAsyncComponent(loadAsync('EnketoIframe'));

const fetchProject = () => project.request({
  url: apiPaths.project(props.projectId),
  extended: true,
}).catch(noop);


const fetchForm = () => {
  let formUrl = '';
  if (props.projectId && props.xmlFormId) {
    formUrl = props.draft ? apiPaths.formDraft(props.projectId, props.xmlFormId) : apiPaths.form(props.projectId, props.xmlFormId);
  } else {
    formUrl = apiPaths.formByEnketoId(props.enketoId, { st: route.query.st });
  }

  form.request({
    url: formUrl,
    resend: false,
    problemToAlert: (problem) =>
      (problem.code === 404.1 ? t('formNotFound') : null)
  })
    .then(() => {
      // if it is public link without st and we got the data then it means user is logged in,
      // let's send user to the canonical path
      // Note: it can be true for WebFormDirectLink route
      if (!props.projectId && !route.query.st && form.dataExists) {
        const targetPath = props.offline ? offlineSubmissionPath : newSubmissionPath;
        router.replace(targetPath(form.projectId, form.xmlFormId, !form.publishedAt));
      }
    })
    .catch(noop);
};

const hasAccess = computed(() => {
  if (!project.dataExists || !form.dataExists) return true;

  let result = true;

  if ((route.name === 'SubmissionNew' || route.name === 'DraftSubmissionNew') &&
      !project.permits('submission.create'))
    result = false;

  if (route.name === 'SubmissionEdit' && !project.permits(['submission.read', 'submission.update']))
    result = false;

  if (!project.permits('form.read') && !project.permits('open_form.read'))
    result = false;

  if (!project.permits('form.read') && project.permits('open_form.read') && form.state === 'closed')
    result = false;

  return result;
});

watchEffect(() => {
  if (dataExists.value) {
    if (!hasAccess.value) {
      router.push('/');
    }
  }
});

// Required to check permissions in hasAccess
if (props.projectId) fetchProject();

if (!form.dataExists) fetchForm();
</script>

<i18n lang="json5">
  {
    "en": {
      "formNotFound": "No Form found with this URL, please double check."
    }
  }
</i18n>
