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
  <web-form-renderer v-if="form.dataExists && form.webformsEnabled" action-type="actionType"/>
  <enketo-iframe v-if="form.dataExists && !form.webformsEnabled"
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
import { apiPaths, queryString } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { useRequestData } from '../../request-data';

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

const { initiallyLoading, dataExists } = resourceStates(props.projectId ? [project, form] : [form]);

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
    formUrl = `/v1/enketo-ids/${props.enketoId}/form${queryString({ st: route.query.st })}`;
  }

  form.request({
    url: formUrl,
    resend: false,
    problemToAlert: (problem) =>
      (problem.code === 404.1 ? t('formNotFound') : null)
  }).catch(noop);
};

const hasAccess = computed(() => {
  if (!project.dataExists || !form.dataExists) return true;

  if (route.name === 'SubmissionNew' && !project.permits('submission.create'))
    return false;

  if (route.name === 'SubmissionEdit' && !project.permits(['submission.read', 'submission.update']))
    return false;

  if (!project.permits('form.read') && !project.permits('open_form.read'))
    return false;

  if (!project.permits('form.read') && project.permits('open_form.read') && form.state === 'closed')
    return false;

  return true;
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
