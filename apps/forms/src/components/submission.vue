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
  <div v-if="loadingState || !form">
    LOADING
  </div>
  <!--<not-found v-if="dataExists && !form.webformsEnabled && actionType === 'edit'"/>-->
  <component
    :is="WebFormRenderer"
    v-else-if="/*dataExists &&*/ webFormsEnabled && form /*&& hasAccess*/"
    :instance-id="instanceId"
    :action-type="actionType"
    :form="form"
  />
  <!-- enketoId can be enketoOnceId so first try to read it from the prop (route.params)-->
  <enketo-iframe v-else-if="/*dataExists && */!webFormsEnabled && form/* && hasAccess*/"
    :enketo-id="form.enketoId"
    :action-type="actionType"
    :instance-id="instanceId"
    @loaded="hideLoading"/>
</template>

<script setup lang="ts">
import { DefineComponent, watchEffect, computed, shallowRef, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Form } from './preview.vue';

// import Loading from '../loading.vue';
// import PageBody from '../page/body.vue';
// import notFound from '../not-found.vue';

// import { noop } from '../../util/util';
// import { apiPaths } from '../../util/request';
// import { useRequestData } from '../../request-data';
// import useEnketoRedirector from '../../composables/enketo-redirector';


type WebFormRendererComponent = DefineComponent<{
  form: Form;
  instanceId?: string | null;
  actionType: string;
}>;

type EnketoIframeComponent = DefineComponent<{
  enketoId: string;
  actionType: string;
  instanceId?: string | null;
}>;

const loadWebFormRenderer = async () => {
	try {
		WebFormRenderer.value = (
			(await import('./web-form-renderer.vue'))
		).default as WebFormRendererComponent;
	} catch {
		throw new Error('todo');
	}
};

const loadEnketo = async () => {
	try {
		EnketoIframe.value = (
			(await import('./enketo-iframe.vue'))
		).default as EnketoIframeComponent;
	} catch {
		throw new Error('todo');
	}
};

defineOptions({
  name: 'FormSubmission'
});


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
const route = useRoute();
// const router = useRouter();

const projectId: number | null = route.params.projectId ? Number.parseInt(route.params.projectId as string) : null;
const formId: string | null = route.params.xmlFormId ? encodeURIComponent(route.params.xmlFormId as string) : null;
const instanceId: string | null = route.params.instanceId ? encodeURIComponent(route.params.instanceId as string) : null;
const enketoId: string | null = route.params.enketoId ? encodeURIComponent(route.params.enketoId as string) : null;
const actionType: string = route.params.actionType as string; // TODO validate (as above)
const useWebForms = route.query.webforms === 'true';
const webFormsEnabled = ref(true); 

// const { project, resourceStates, form } = useRequestData();
// const { t } = useI18n();
// const { ensureEnketoOfflinePath, ensureCanonicalPath } = useEnketoRedirector();

// const resources = computed(() => (props.projectId ? [project, form] : [form]));
const form = ref<Form>();

const loadingState = ref(true);
const hideLoading = () => {
  loadingState.value = false;
};

// const { initiallyLoading, dataExists } = computed(() => {
//   const state = resourceStates(resources.value);
//   return {
//     initiallyLoading: state.initiallyLoading,
//     dataExists: state.dataExists
//   };
// }).value;

const WebFormRenderer = shallowRef<WebFormRendererComponent | null>(null);
const EnketoIframe = shallowRef<EnketoIframeComponent | null>(null);

// const fetchProject = () => project.request({
//   url: apiPaths.project(props.projectId),
//   extended: true
// }).catch(noop);


const getFormXml = async (projectId:number, formId:string) => {
  const url = `/v1/projects/${projectId}/forms/${formId}.xml`;
  const response = await fetch(url);
  return await response.text();
};

const fetchForm = async () => {
  const draftPath = '';
  const qs = '';

  let url = '';

  if (enketoId) {
    url = `/v1/form-links/${enketoId}/form${qs}`;

  } else {
    url = `/v1/projects/${projectId}/forms/${formId}${draftPath}${qs}`;
  }

  fetch(url)
    .then((response) => response.json())
    .then((formConfig) => {
      if (formConfig.webformsEnabled || useWebForms) {
        return Promise.all([getFormXml(formConfig.projectId, formConfig.xmlFormId), loadWebFormRenderer()])
          .then(([xform]) => {
            form.value = { xmlFormId: formConfig.xmlFormId, xform, enketoId: formConfig.enketoId, projectId: formConfig.projectId };
          });
      } else {
        return loadEnketo().then(() => {
          webFormsEnabled.value = false;
          // TODO also need form.enketoOnceId
          form.value = { xmlFormId: formConfig.xmlFormId, xform: '', enketoId: formConfig.enketoId, projectId: formConfig.projectId };
        });
      }
    })
    .then(() => {
      // TODO we want to put this off until after the async load happens
      loadingState.value = false;
    });
};

// const hasAccess = computed(() => {
//   if (!project.dataExists || !form.dataExists) return true;

//   let result = true;

//   if ((route.name === 'SubmissionNew' || route.name === 'DraftSubmissionNew') &&
//       !project.permits('submission.create'))
//     result = false;

//   if (route.name === 'SubmissionEdit' && !project.permits(['submission.read', 'submission.update']))
//     result = false;

//   if (!project.permits('form.read') && !project.permits('open_form.read'))
//     result = false;

//   if (!project.permits('form.read') && project.permits('open_form.read') && form.state !== 'open')
//     result = false;

//   return result;
// });

// watch(() => initiallyLoading.value, (value) => {
//   if (!value) loadingState.value = dataExists.value;
// });

// watchEffect(() => {
//   if (dataExists.value) {
//     if (!hasAccess.value) {
//       router.push('/');
//     }
//   }
// });

// Required to check permissions in hasAccess
// if (projectId) fetchProject();

// if (!form.dataExists) fetchForm();
fetchForm();
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
