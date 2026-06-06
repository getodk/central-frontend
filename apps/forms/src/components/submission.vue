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
  <template v-else-if="webFormsEnabled">
    <WebFormRenderer :projectId="projectId" :form="form" :action-type="'new'" :instance-id="instanceId"/>
  </template>
  <template v-else>
    <EnketoIframe :enketo-id="form.enketoId" action-type="'new'"/>
  </template>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { type Form } from './preview.vue';

// TODO probably better to pass all params as props instead?
const props = defineProps({
  draft: Boolean,
});

const WebFormRenderer = defineAsyncComponent(() => import('./web-form-renderer.vue'));
const EnketoIframe = defineAsyncComponent(() => import('./enketo-iframe.vue'));

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
const router = useRouter();

const projectId: number | null = route.params.projectId ? Number.parseInt(route.params.projectId as string) : null;
const formId: string | null = route.params.xmlFormId ? encodeURIComponent(route.params.xmlFormId as string) : null;
const instanceId: string | null = route.params.instanceId ? encodeURIComponent(route.params.instanceId as string) : null;
const enketoId: string | null = route.params.enketoId ? encodeURIComponent(route.params.enketoId as string) : null;
const actionType: string = route.params.actionType as string; // TODO validate (as above)
const useWebForms = route.query.webforms === 'true';
const offline: boolean = route.params.offline === 'offline';
const webFormsEnabled = ref(true); 

const form = ref<Form>();

const loadingState = ref(true);

const getFormXml = async (projectId:number, formId:string, draft:boolean) => {
  const draftPath = draft ? '/draft' : '';
  const qs = queryString({ st: route.query.st });
  const url = `/v1/projects/${projectId}/forms/${formId}${draftPath}.xml${qs}`;
  const response = await fetch(url);
  return await response.text();
};

const newSubmissionPath = (projectId:string, xmlFormId:string, draft:boolean) => {
  const suffix = draft ? 'draft/submissions/new' : 'submissions/new';
  return `/projects/${projectId}/forms/${xmlFormId}/${suffix}`;
};

const formPreviewPath = (projectId:string, xmlFormId:string, draft:boolean) => {
  const suffix = draft ? 'draft/preview' : 'preview';
  return `/projects/${projectId}/forms/${xmlFormId}/${suffix}`;
};

const offlineSubmissionPath = (projectId:string, xmlFormId:string, draft:boolean) => {
  return `${newSubmissionPath(projectId, xmlFormId, draft)}/offline`;
};

// TODO make common
const queryString = (query:any) => {
  if (query == null) return '';
  const entries = Object.entries(query);
  if (entries.length === 0) return '';
  const params = new URLSearchParams();
  for (const [name, value] of entries) {
    if (Array.isArray(value)) {
      for (const element of value)
        params.append(name, element === null ? 'null' : element.toString());
    } else if (value != null) {
      params.set(name, value.toString());
    }
  }
  const qs = params.toString();
  return qs !== '' ? `?${qs}` : qs;
};

// TODO handle this in a separate component
const redirectEnketoUrls = (formConfig:any) => {
  let target;
  if (route.path.startsWith('/f/') && !route.query.st && formConfig) {
    if (actionType === 'new') {
      target = newSubmissionPath(formConfig.projectId, formConfig.xmlFormId, !formConfig.publishedAt);
    } else if (actionType === 'preview') {
      target = formPreviewPath(formConfig.projectId, formConfig.xmlFormId, !formConfig.publishedAt);
    } else if (actionType === 'offline') {
      target = offlineSubmissionPath(formConfig.projectId, formConfig.xmlFormId, !formConfig.publishedAt);
    } else if (actionType === 'public-link') {
    // if it is public link without st and we got the data then it means user is logged in
      target = newSubmissionPath(formConfig.projectId, formConfig.xmlFormId, !formConfig.publishedAt);
    }
  }
  if (target) {
    const { instance_id: _, ...query } = route.query;
    router.replace(`${target}${queryString(query)}`);
  }
};

const getFormConfig = async () => {
  const draftPath = props.draft ? '/draft' : '';
  const qs = queryString({ st: route.query.st });

  let url:string;
  if (enketoId) {
    url = `/v1/form-links/${enketoId}/form${qs}`;
  } else {
    url = `/v1/projects/${projectId}/forms/${formId}${draftPath}${qs}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('failed to fetch form');
  }
  return await response.json();
};

const fetchForm = async () => {
  const formConfig = await getFormConfig();
  const formParam:Form = {
    xmlFormId: formConfig.xmlFormId,
    enketoId: formConfig.enketoId,
    projectId: formConfig.projectId,
    draft: !formConfig.publishedAt,
    enketoOnceId: formConfig.enketoOnceId
  };
  redirectEnketoUrls(formConfig);

  if (formConfig.webformsEnabled || useWebForms) {
    formParam.xform = await getFormXml(formConfig.projectId, formConfig.xmlFormId, !formConfig.publishedAt)
    webFormsEnabled.value = true;
  } else {
    if (offline) {
      window.location.replace(`/-/x/${formConfig.enketoId}${queryString(route.query)}`);
      return;
    }
    webFormsEnabled.value = false;
    // TODO also need form.enketoOnceId
  }
  form.value = formParam;
  loadingState.value = false;
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
