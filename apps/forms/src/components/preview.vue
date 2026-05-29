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
import { DefineComponent, ref, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export type Form = {
  xmlFormId: string,
  xform: string
};

type WebFormRendererComponent = DefineComponent<{
  projectId: number;
  form: Form
}>;

const route = useRoute();

const projectId: number = Number.parseInt(encodeURIComponent(route.params.projectId as string));
const formParam: string = encodeURIComponent(route.params.xmlFormId as string);
const useWebForms = route.query.webforms === 'true';
const loadingState = ref(true);
const webFormsEndabled = ref(true);
const form = ref<Form>();
const hideLoading = () => {
  loadingState.value = false;
};

const WebFormRenderer = shallowRef<WebFormRendererComponent | null>(null);
const EnketoIframe = shallowRef(null);

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
    /*
		EnketoIframe.value = (
			(await import('./enketo-iframe.vue'))
		).default;
    */
	} catch {
		throw new Error('todo');
	}
};

const getFormXml = async () => {
  const encodedFormId = formParam;
  const draftPath = '';
  const qs = '';
  const url = `/v1/projects/${projectId}/forms/${encodedFormId}${draftPath}.xml${qs}`;
  const response = await fetch(url);
  return await response.text();
};

const fetchForm = async () => {
  const encodedFormId = formParam;
  const draftPath = '';
  const qs = '';
  const url = `/v1/projects/${projectId}/forms/${encodedFormId}${draftPath}${qs}`;
  fetch(url)
    .then((response) => response.json())
    .then((formConfig) => {
      if (formConfig.webformsEnabled || useWebForms) {
        return Promise.all([getFormXml(), loadWebFormRenderer()])
          .then(([xform]) => { form.value = { xmlFormId: formConfig.xmlFormId, xform } });
      } else {
        webFormsEndabled.value = false;
        return loadEnketo();
      }
    })
    .then(() => {
      // TODO we want to put this off until after the async load happens
      loadingState.value = false;
    });
};

fetchForm();


// watch(() => form.initiallyLoading, (value) => {
//   if (!value) loadingState.value = form.dataExists;
// });
</script>

<template>
  <div v-if="loadingState">
    LOADING
  </div>
  <template v-else-if="webFormsEndabled && form">
    <component :is="WebFormRenderer" :projectId="projectId" :form="form"/>
  </template>
  <template v-else>
    LOAD ENKETO
    <!--<enketo-iframe :enketo-id="form.enketoId" action-type="preview" @loaded="hideLoading"/>-->
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
