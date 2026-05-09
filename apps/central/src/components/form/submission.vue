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
  <page-body v-if="loadingState">
    <loading :state="true"/>
  </page-body>
  <not-found v-if="dataExists && !form.webformsEnabled && actionType === 'edit'"/>
  <web-form-renderer v-else-if="dataExists && form.webformsEnabled && hasAccess"
    :action-type="actionType"
    :instance-id="instanceId"
    @loaded="hideLoading"/>
  <!-- enketoId can be enketoOnceId so first try to read it from the prop (route.params)-->
  <enketo-iframe v-else-if="dataExists && !form.webformsEnabled && hasAccess"
    :enketo-id="enketoId ?? form.enketoId"
    :action-type="actionType"
    :instance-id="instanceId"
    @loaded="hideLoading"/>
</template>

<script setup>
import { defineAsyncComponent, watchEffect, computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import Loading from '../loading.vue';
import PageBody from '../page/body.vue';
import notFound from '../not-found.vue';

import { noop } from '../../util/util';
import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { useRequestData } from '../../request-data';
import useEnketoRedirector from '../../composables/enketo-redirector';

defineOptions({
  name: 'FormSubmission'
});

const props = defineProps({
  projectId: String,
  xmlFormId: String,
  instanceId: String,
  /**
 * Specifies the action to be performed. The possible values and their purposes are:
 *
 * **preview**:     Displays the Form in preview mode. Submissions cannot be created.
 *
 * **edit**:        Displays the Form pre-filled with data from an existing Submission (instance),
 *                  which can be modified. Only OWF is supported via central-frontend
 *
 * **public-link**: Displays the Form for creating a new Submission. After a successful Submission,
 *                  a thank-you message/page is shown. This route is intended for anonymous users;
 *                  a session token (`st`) is included in the query parameters for backend
 *                  authentication.
 *
 * **new**:         Displays the Form to create a new Submission, with the option to create multiple
 *                  Submissions. This action is intended for authenticated (logged-in) users as
 *                  oppose to `public-link`.
 *
 * **offline**:     An extension of the `new` action type where submissions can be created while
 *                  offline and synced once the device is back online. Currently, only Enketo
 *                  supports this action.
 */
  actionType: {
    type: String,
    required: true,
    validator(value) {
      return ['new', 'edit', 'public-link', 'offline', 'preview'].includes(value);
    }
  },
  enketoId: String,
  draft: Boolean
});

const route = useRoute();
const router = useRouter();
const { project, resourceStates, form } = useRequestData();
const { t } = useI18n();
const { ensureEnketoOfflinePath, ensureCanonicalPath } = useEnketoRedirector();

const resources = computed(() => (props.projectId ? [project, form] : [form]));

const loadingState = ref(true);
const hideLoading = () => {
  loadingState.value = false;
};

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
  extended: true
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
      const redirected = ensureEnketoOfflinePath(props.actionType);
      if (redirected) {
        project.cancelRequest();
      } else {
        ensureCanonicalPath(props.actionType);
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

  if (!project.permits('form.read') && project.permits('open_form.read') && form.state !== 'open')
    result = false;

  return result;
});

watch(() => initiallyLoading.value, (value) => {
  if (!value) loadingState.value = dataExists.value;
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

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "formNotFound": "Für diese URL wurde kein Formular gefunden, bitte überprüfen Sie dies noch einmal."
  },
  "es": {
    "formNotFound": "No se ha encontrado ningún formulario con esta URL, vuelva a comprobarlo."
  },
  "fr": {
    "formNotFound": "Aucun Formulaire trouvé avec cette URL, merci de vérifier."
  },
  "it": {
    "formNotFound": "Non è stato trovato alcun modulo con questo URL, si prega di ricontrollare."
  },
  "pt": {
    "formNotFound": "Nenhum Formulário encontrado com esse endereço, por favor verifique."
  },
  "zh": {
    "formNotFound": "未找到与此URL对应的表单，请仔细核对。"
  },
  "zh-Hant": {
    "formNotFound": "此 URL 未找到表單，請仔細檢查。"
  }
}
</i18n>
