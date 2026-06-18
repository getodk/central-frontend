<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { captureException } from '@sentry/vue';
import {
  type Form,
  getFormByEnketoId,
  getFormByFormId,
  getFormXml,
  getProject,
  getSubmissionAttachmentNames,
  type Project,
  queryString,
  RequestError
} from '../utils/api.ts';
import Dialog from 'primevue/dialog';

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
const st = computed(() => route.query.st ? route.query.st as string : null);
const useWebForms = computed(() => route.query.webforms === 'true');
const offline = computed(() => route.params.offline === 'offline');
const webFormsEnabled = ref(true);

const form = ref<Form>();
const xform = ref<string>();
const submissionAttachments = ref<string[] | null>(null);

const loadingState = ref(true);
const errorCode = ref<number | null>(null);

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

const setDocumentTitle = (formConfig: Form) => {
  const formTitle = formConfig.name ?? formConfig.xmlFormId;
  const suffix = 'ODK Web Forms';
  const title = formTitle ? formTitle + ' | ' + suffix : suffix;
  document.title = title;
};

const fetchFormConfig = async (): Promise<Form> => {
  if (enketoId.value) {
    try {
      return await getFormByEnketoId(enketoId.value, st.value);
    } catch(e) {
      if (e instanceof RequestError && (e.statusCode === 401.2 || e.statusCode === 403.1)) {
        // a public form with an invalid st or revoked enketoId should show as form not found
        throw new RequestError('Form not found', 404);
      }
      throw e;
    }
  }
  if (projectId.value && formId.value) {
    const [project, form] = await Promise.all([
      getProject(projectId.value),
      getFormByFormId(projectId.value, formId.value, props.draft, st.value)
    ]);
    if (!hasAccess(project, form)) {
      throw new RequestError('Form not found', 404);
    }
    return form;
  }
  throw new RequestError('Form not found', 404);
};

const fetchForm = async (): Promise<Form | undefined> => {
  const formConfig = await fetchFormConfig();

  redirectEnketoUrls(formConfig);
  setDocumentTitle(formConfig);

  if (formConfig.webformsEnabled || useWebForms.value) {
    const formXmlPromise = getFormXml(formConfig.projectId, formConfig.xmlFormId, formConfig.draft, st.value);
    const promises: Promise<any>[] = [ formXmlPromise ];
    if (props.actionType === 'edit' && instanceId.value) {
      promises.push(getSubmissionAttachmentNames(formConfig.projectId, formConfig.xmlFormId, instanceId.value));
    }
    const [ formXml, attachments ] = await Promise.all(promises);
    xform.value = formXml;
    if (attachments) {
      submissionAttachments.value = attachments;
    }
    webFormsEnabled.value = true;
  } else {
    if (props.actionType === 'edit') {
      // editing in Enketo isn't supported
      throw new RequestError('Form not found', 404);
    }
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

const hasAccess = (project: Project, form: Form) => {
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
  errorCode.value = null;
  try {
    form.value = await fetchForm();
    loadingState.value = false;
  } catch (e) {
    if (e instanceof RequestError) {
      if (e.statusCode >= 401 && e.statusCode < 404) {
        // not logged in
        const relativeUrl = window.location.href.substring(window.location.origin.length);
        window.location.href = '/login?next=/wf' + relativeUrl;
      } else if (e.statusCode >= 404 && e.statusCode < 405) {
        // form not found
        errorCode.value = 404;
      } else {
        // unknown error
        errorCode.value = e.statusCode ?? 500;
      }
    } else {
      captureException(e);
      errorCode.value = 500;
    }
    loadingState.value = false;
  }
};

load();
</script>

<style lang="scss" scoped>
.error-code {
  font-size: 14px;
  color: #64748b;
}
</style>

<template>
  <template v-if="!loadingState">
    <Dialog modal v-if="errorCode === 404" :draggable="false" :closable="false" :visible="true">
      <template #header>
        {{ $t('formNotFound') }}
      </template>
      <template #default>
        {{ $t('formNotFound.body') }}
      </template>
    </Dialog>
    <Dialog modal v-else-if="errorCode" :draggable="false" :closable="false" :visible="true">
      <template #header>
        {{ $t('errorNotProblem') }}
      </template>
      <template #default>
        <p>{{ $t('errorNotProblem.body') }}</p>
        <p class="error-code">{{ $t('errorNotProblem.status', { status: errorCode }) }}</p>
      </template>
    </Dialog>
    <template v-else-if="webFormsEnabled">
      <WebFormRenderer
        :form="form!"
        :xform="xform!"
        :instance-id="instanceId"
        :action-type="props.actionType ?? 'new'"
        :submission-attachments="submissionAttachments"
        :st="st"
      />
    </template>
    <template v-else>
      <EnketoIframe
        :form="form!"
        :enketo-id="enketoId"
        :action-type="props.actionType ?? 'new'"
      />
    </template>
  </template>
</template>

<i18n lang="json5">
  {
    "en": {
      "formNotFound": "Unable to open form",
      "formNotFound.body": "Please check that the link is correct. The form may no longer be available, or your access may have expired. If the problem continues, contact the person who sent you the form link.",
      "errorNotProblem": "Something went wrong",
      "errorNotProblem.body": "Please try again later. If the problem continues, contact the person who sent you the form link.",
      "errorNotProblem.status": "Error code: {status}",
    }
  }
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "formNotFound": "Für diese URL wurde kein Formular gefunden, bitte überprüfen Sie dies noch einmal.",
    "errorNotProblem": "Etwas ging schief",
    "errorNotProblem.status": "Fehlercode {status}",
  },
  "es": {
    "formNotFound": "No se puede abrir el formulario",
    "formNotFound.body": "Por favor, verifique que el enlace es correcto. Es posible que el formulario ya no esté disponible o que su acceso haya expirado. Si el problema persiste, comuníquese con la persona que le envió el enlace del formulario.",
    "errorNotProblem": "Algo salió mal",
    "errorNotProblem.body": "Inténtelo de nuevo más tarde. Si el problema persiste, comuníquese con la persona que le envió el enlace del formulario.",
    "errorNotProblem.status": "Código de error: {status}",
  },
  "fr": {
    "formNotFound": "Impossible d'ouvrir le formulaire",
    "formNotFound.body": "Veuillez vérifier que le lien est correct. Il est possible que le formulaire ne soit plus disponible ou que votre accès ait expiré. Si le problème persiste, veuillez contacter la personne qui vous a envoyé le lien vers le formulaire.",
    "errorNotProblem": "Quelque-chose s'est mal passé",
    "errorNotProblem.body": "Veuillez réessayer plus tard. Si le problème persiste, veuillez contacter la personne qui vous a envoyé le lien vers le formulaire.",
    "errorNotProblem.status": "Code d'erreur: {status}",
  },
  "id": {
    "formNotFound": "Tidak dapat membuka formulir",
    "formNotFound.body": "Pastikan tautan sudah benar. Formulir mungkin sudah tidak tersedia, atau akses Anda mungkin telah kedaluwarsa. Jika masalah berlanjut, hubungi orang yang mengirimkan tautan formulir tersebut kepada Anda.",
    "errorNotProblem": "Terjadi kesalahan",
    "errorNotProblem.body": "Coba lagi nanti. Jika masalah berlanjut, hubungi orang yang mengirimkan tautan formulir tersebut kepada Anda.",
    "errorNotProblem.status": "Kode error: {status}",
  },
  "it": {
    "formNotFound": "Non è stato trovato alcun modulo con questo URL, si prega di ricontrollare.",
    "errorNotProblem": "Qualcosa è andato storto",
    "errorNotProblem.status": "Codice error {status}",
  },
  "pt": {
    "formNotFound": "Nenhum Formulário encontrado com esse endereço, por favor verifique.",
    "errorNotProblem": "Algo deu errado",
    "errorNotProblem.status": "Código de erro {status}",
  },
  "zh": {
    "formNotFound": "未找到与此URL对应的表单，请仔细核对。",
    "errorNotProblem": "出现错误：错误代码",
    "errorNotProblem.status": "{status}",
  },
  "zh-Hant": {
    "formNotFound": "此 URL 未找到表單，請仔細檢查。",
    "errorNotProblem": "出了點問題：錯誤代碼",
    "errorNotProblem.status": "{status}",
  }
}
</i18n>
