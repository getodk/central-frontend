<template>
      <template v-if="formVersionXml.dataExists">
        <OdkWebForm :form-xml="formVersionXml.data" @submit="handleSubmit"/>
      </template>

      <modal id="owf-submission-preview" :state="previewState" hideable backdrop
          @hide="previewState = false">
          <template #title>ODK Web Forms Preview</template>
          <template #body>
            This is the preview of new ODK Web Forms, currently you can only view your forms with it.
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
</script>

<style lang="scss">
:root {
  font-size: 16px;
}
html, body {
  background-color: var(--gray-200);
}
</style>
