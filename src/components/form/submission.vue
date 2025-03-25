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
  <loading :state="form.initiallyLoading"/>
  <component :is="component" v-if="component != null" v-bind="bindings"/>
</template>

<script setup>
import { defineProps, defineOptions, ref, shallowRef, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import Loading from '../loading.vue';
import useForm from '../../request-data/form';
import useProject from '../../request-data/project';
import useRoutes from '../../composables/routes';

import { noop } from '../../util/util';
import { apiPaths, queryString } from '../../util/request';
import { loadAsync } from '../../util/load-async';

const route = useRoute();
const router = useRouter();
const { project } = useProject();
const { form } = useForm();
const { t } = useI18n();
const { formPath, submissionPath } = useRoutes();

defineOptions({
  name: 'FormSubmission'
});

const props = defineProps({
  projectId: String,
  xmlFormId: String,
  instanceId: String,
  // This will be not null when this component needs to render an Enketo form (redirected by nginx)
  // or to render web-forms for a public link. The value could be:
  // ':enketoId', ':enketoId/new', ':enketoId/edit', ':enketoId/single' or ':enketoId/offline'.
  // see main.nginx.conf "Enketo URL redirection" section
  path: {
    type: String,
    default: ''
  }
});

const component = shallowRef();
const bindings = ref();

const fetchProject = () => project.request({
  url: apiPaths.project(props.projectId),
  extended: true,
}).catch(noop);

const fetchForm = () => {
  const [enketoId, actionType] = props.path.split('/');

  let formUrl = '';
  if (props.projectId && props.xmlFormId) {
    formUrl = apiPaths.form(props.projectId, props.xmlFormId);
  } else {
    formUrl = `/v1/enketo-ids/${enketoId}/form${queryString({ st: route.query.st })}`;
  }

  form.request({
    url: formUrl,
    problemToAlert: (problem) =>
      (problem.code === 404.1 ? t('formNotFound') : null)
  }).then(() => {
    if (form.data.webformsEnabled) {
      // change the route if it is /f/... and it is for "New / Edit Submission"
      if (route.path.startsWith('/f/')) {
        if (!actionType && !form.data.draftToken) {
          router.replace(formPath(form.data.projectId, form.data.xmlFormId, 'submissions/new'));
        } else if (actionType === 'edit' && route.query.instance_id) {
          router.replace(submissionPath(form.data.projectId, form.data.xmlFormId, route.query.instance_id, 'edit'));
        }
      }
      component.value = defineAsyncComponent(loadAsync('WebFormRenderer'));
    } else {
      component.value = defineAsyncComponent(loadAsync('EnketoIframe'));
      bindings.value = {
        enketoId,
        actionType: actionType ?? ''
      };
    }
  }).catch(noop);
};

// To facilate validateData in route guard
if (props.projectId) {
  fetchProject().then(() => {
    fetchForm();
  });
} else {
  fetchForm();
}


</script>

<i18n lang="json5">
  {
    "en": {
      "formNotFound": "No Form found with this URL, please double check."
    }
  }
</i18n>
