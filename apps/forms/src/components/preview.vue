<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';
import { getFormByFormId, getFormXml, type Form } from '../utils/api.ts';

// TODO probably better to pass all params as props instead?
const props = defineProps({
  draft: Boolean,
});

const WebFormRenderer = defineAsyncComponent(() => import('./web-form-renderer.vue'));
const EnketoIframe = defineAsyncComponent(() => import('./enketo-iframe.vue'));

const route = useRoute();

const projectId: number = Number.parseInt(encodeURIComponent(route.params.projectId as string));
const formId: string = encodeURIComponent(route.params.xmlFormId as string);

const useWebForms = route.query.webforms === 'true';
const loadingState = ref(true);
const webFormsEnabled = ref(true); // TODO put this in the `form` (below)
const form = ref<Form>();
const xform = ref<string>();

const fetchForm = async () => {
  const formConfig = await getFormByFormId(projectId, formId, props.draft);
  if (formConfig.webformsEnabled || useWebForms) {
    xform.value = await getFormXml(projectId, formId, props.draft);
    webFormsEnabled.value = true;
  } else {
    webFormsEnabled.value = false;
  }
  form.value = formConfig;
  loadingState.value = false;
};

fetchForm();


// watch(() => form.initiallyLoading, (value) => {
//   if (!value) loadingState.value = form.dataExists;
// });
</script>

<template>
  <div v-if="loadingState || !form">
    LOADING
  </div>
  <template v-else-if="webFormsEnabled">
    <WebFormRenderer :form="form" :xform="xform!" action-type="preview"/>
  </template>
  <template v-else>
    <EnketoIframe :form="form" :enketo-id="form.enketoId" action-type="preview"/>
  </template>
</template>

<style lang="scss">
:root {
  font-size: 16px;
}
html, body {
  box-shadow: none;
}
</style>
