<template>
      <template v-if="formVersionXml.dataExists">
        <OdkWebForm :form-xml="formVersionXml.data" @submit="handleSubmit"/>
      </template>

      <modal id="owf-submission-preview" :state="previewState" hideable backdrop
          @hide="previewState = false">
          <template #title>{{ $t('webFormPreview.submissionModal.title') }}</template>
          <template #body>
            {{ $t('webFormPreview.submissionModal.body') }}
            <div class="modal-actions">
              <button type="button" class="btn btn-primary" @click="closeModal()">
                {{ $t('action.close') }}
              </button>
            </div>
          </template>
      </modal>
</template>

<script setup>
import { ref, createApp, getCurrentInstance } from 'vue';
/* eslint-disable-next-line import/no-unresolved -- not sure why eslint is complaining about it */
import { OdkWebForm, webFormsPlugin } from '@getodk/web-forms';
import useForm from '../../request-data/form';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import Modal from '../modal.vue';

// Install WebFormsPlugin in the component instead of installing it at the
// application level so that @getodk/web-forms package is not loaded for every
// page, thus increasing the initial bundle
const app = createApp({});
app.use(webFormsPlugin);
const inst = getCurrentInstance();
// webFormsPlugin just adds config property to the appContext
inst.appContext.config = app._context.config;

defineOptions({
  name: 'FormPreview'
});

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  xmlFormId: {
    type: String,
    required: true
  }
});

const { form, formVersionXml } = useForm();

const previewState = ref(false);

const defPath = (extension) => {
  const { projectId, xmlFormId, publishedAt } = form;

  return publishedAt != null
    ? apiPaths.formVersionDef(projectId, xmlFormId, form.version, extension)
    : apiPaths.formDraftDef(projectId, xmlFormId, extension);
};

const fetchForm = () => {
  const url = apiPaths.form(props.projectId, props.xmlFormId);
  form.request({ url, extended: true })
    .then(() => {
      formVersionXml.request({ url: defPath('.xml') });
    })
    .catch(noop);
};

fetchForm();

const handleSubmit = () => {
  previewState.value = true;
};

const closeModal = () => {
  previewState.value = false;
};
</script>

<style lang="scss">
:root {
  font-size: 16px;
}
html, body {
  background-color: var(--gray-200);
}
</style>

<i18n lang="json5">
  {
    "en": {
      "webFormPreview":{
        "submissionModal": {
          // This text is the title of a dialog box / modal shown when the user presses submit button on the preview of new Web Forms.
          "title": "ODK Web Forms Preview",
          // This text is the body of a dialog box / modal shown when the user presses submit button on the preview of new Web Forms.
          "body": "This is the preview of new ODK Web Forms, currently you can only view your forms with it."
        }
      }
    }
  }
</i18n>
