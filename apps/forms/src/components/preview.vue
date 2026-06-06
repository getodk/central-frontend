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

// TODO probably better to pass all params as props instead?
const props = defineProps({
  draft: Boolean,
});

// TODO pull this out into common component somewhere
export type Form = {
  xmlFormId: string;
  xform?: string;
  projectId: number;
  enketoId: string;
  enketoOnceId?: string;
  draft: boolean;
};

const WebFormRenderer = defineAsyncComponent(() => import('./web-form-renderer.vue'));
const EnketoIframe = defineAsyncComponent(() => import('./enketo-iframe.vue'));

const route = useRoute();

const projectId: number = Number.parseInt(encodeURIComponent(route.params.projectId as string));
const formId: string = encodeURIComponent(route.params.xmlFormId as string);

const useWebForms = route.query.webforms === 'true';
const loadingState = ref(true);
const webFormsEnabled = ref(true); // TODO put this in the `form` (below)
const form = ref<Form>();

const getFormXml = async () => {
  const draftPath = props.draft ? '/draft' : '';
  const qs = '';
  const url = `/v1/projects/${projectId}/forms/${formId}${draftPath}.xml${qs}`;
  const response = await fetch(url);
  return await response.text();
};

const fetchForm = async () => {
  const draftPath = props.draft ? '/draft' : '';
  const qs = '';
  const url = `/v1/projects/${projectId}/forms/${formId}${draftPath}${qs}`;
  const response = await fetch(url);
  const formConfig = await response.json();
  const formParam:Form = {
    xmlFormId: formConfig.xmlFormId,
    enketoId: formConfig.enketoId,
    projectId: formConfig.projectId,
    draft: !formConfig.publishedAt,
    enketoOnceId: formConfig.enketoOnceId
  };

  if (formConfig.webformsEnabled || useWebForms) {
    formParam.xform = await getFormXml();
    webFormsEnabled.value = true;
  } else {
    webFormsEnabled.value = false;
    // TODO also need form.enketoOnceId
  }
  form.value = formParam;
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
    <WebFormRenderer :projectId="projectId" :form="form" :action-type="'preview'"/>
  </template>
  <template v-else>
    <EnketoIframe :enketo-id="form.enketoId" action-type="'new'"/>
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
