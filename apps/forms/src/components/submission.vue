<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  type Form,
  getFormByEnketoId,
  getFormByFormId,
  getFormXml,
  getProject,
  type Project,
  queryString,
  RequestError
} from '../utils/api.ts';

const props = defineProps({
  draft: Boolean,
  actionType: String
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

const projectId = computed(() => route.params.projectId ? Number.parseInt(route.params.projectId as string) : null);
const formId = computed(() => route.params.xmlFormId ? encodeURIComponent(route.params.xmlFormId as string) : null);
const instanceId = computed(() => route.params.instanceId ? encodeURIComponent(route.params.instanceId as string) : null);
const enketoId = computed(() => route.params.enketoId ? encodeURIComponent(route.params.enketoId as string) : null);
const useWebForms = computed(() => route.query.webforms === 'true');
const offline = computed(() => route.params.offline === 'offline');
const webFormsEnabled = ref(true);

const form = ref<Form>();
const xform = ref<string>();

const loadingState = ref(true);
const errorState = ref(false);

const newSubmissionPath = (projectId:number, xmlFormId:string, draft:boolean) => {
  const suffix = draft ? 'draft/submissions/new' : 'submissions/new';
  return `/projects/${projectId}/forms/${xmlFormId}/${suffix}`;
};

const formPreviewPath = (projectId:number, xmlFormId:string, draft:boolean) => {
  const suffix = draft ? 'draft/preview' : 'preview';
  return `/projects/${projectId}/forms/${xmlFormId}/${suffix}`;
};

const offlineSubmissionPath = (projectId:number, xmlFormId:string, draft:boolean) => {
  return `${newSubmissionPath(projectId, xmlFormId, draft)}/offline`;
};

const redirectEnketoUrls = (form:Form) => {
  let target;
  if (route.path.startsWith('/f/') && !route.query.st && form) {
    if (props.actionType === 'new') {
      target = newSubmissionPath(form.projectId, form.xmlFormId, form.draft);
    } else if (props.actionType === 'preview') {
      target = formPreviewPath(form.projectId, form.xmlFormId, form.draft);
    } else if (props.actionType === 'offline') {
      target = offlineSubmissionPath(form.projectId, form.xmlFormId, form.draft);
    } else if (props.actionType === 'public-link') {
    // if it is public link without st and we got the data then it means user is logged in
      target = newSubmissionPath(form.projectId, form.xmlFormId, form.draft);
    }
  }
  if (target) {
    const { instance_id: _, ...query } = route.query;
    router.replace(`${target}${queryString(query)}`);
  }
};

const fetchForm = async (): Promise<Form | undefined> => {
  const st = route.query.st as string ?? null;
  let formConfig;
  if (enketoId.value) {
    formConfig = await getFormByEnketoId(enketoId.value, st);
  } else if (projectId.value && formId.value) {
    formConfig = await getFormByFormId(projectId.value, formId.value, props.draft, st);
  } else {
    throw new RequestError('Form not found', 404);
  }

  redirectEnketoUrls(formConfig);

  if (formConfig.webformsEnabled || useWebForms.value) {
    xform.value = await getFormXml(formConfig.projectId, formConfig.xmlFormId, formConfig.draft, st)
    webFormsEnabled.value = true;
  } else {
    if (offline.value) {
      // TODO: Update once Web Forms has support for offline
      window.location.replace(`/-/x/${formConfig.enketoId}${queryString(route.query)}`);
      return;
    }
    webFormsEnabled.value = false;
  }
  return formConfig;

};

const permits = (project: Project, verbs: string[]) => {
  return verbs.every(verb => project.verbs.includes(verb));
}

const hasAccess = async (form:Form | undefined) => {
  if (!projectId.value || !form) {
    return true;
  }
  const project = await getProject(projectId.value);

  if ((route.name === 'SubmissionNew' || route.name === 'DraftSubmissionNew') && !permits(project, ['submission.create'])) {
    return false;
  }

  if (route.name === 'SubmissionEdit' && !permits(project, ['submission.read', 'submission.update'])) {
    return false;
  }

  if (!permits(project, ['form.read']) && !permits(project, ['open_form.read'])) {
    return false;
  }

  if (!permits(project, ['form.read']) && permits(project, ['open_form.read']) && form.state !== 'open') {
    return false;
  }

  return true;
};

const load = async () => {
  loadingState.value = true;
  errorState.value = false;
  try {
    const formConfig = await fetchForm();
    const access = await hasAccess(formConfig);
    if (!access) {
      window.location.replace('/');
    } else {
      form.value = formConfig;
      loadingState.value = false;
    }
  } catch (e) {
    if (e instanceof RequestError && e.statusCode >= 401 && e.statusCode < 404) {
      // not logged in
      const relativeUrl = window.location.href.substring(window.location.origin.length);
      window.location.href = '/login?next=/wf' + relativeUrl;
    } else {
      // unknown error
      errorState.value = true;
      loadingState.value = false;
    }
  }
};

load();
</script>

<template>
  <div v-if="loadingState" class="loading-container">
    <span class="spinner"></span>
  </div>
  <div v-else-if="errorState || (props.actionType === 'edit' && !webFormsEnabled)" class="form-load-error">
    {{ $t('formNotFound') }}
  </div>
  <template v-else-if="webFormsEnabled">
    <WebFormRenderer :form="form!" :xform="xform!" :instance-id="instanceId" :action-type="props.actionType ?? 'new'"/>
  </template>
  <template v-else>
    <EnketoIframe :form="form!" :enketo-id="enketoId" :action-type="props.actionType ?? 'new'"/>
  </template>
</template>

<style>
.loading-container {
  text-align: center;
  padding-top: 35vh;
}
.spinner {
  width: 60px;
  height: 60px;
  border: 8px solid #f1f5f9;
  border-bottom-color: #3e9fcc;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}
@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

<style lang="scss">
.form-load-error {
  text-align: center;
  width: 100%;
  font-weight: bold;
  padding: 50px;
}
</style>

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
