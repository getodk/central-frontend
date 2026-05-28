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
import { ref, shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// import { useRequestData } from '../../request-data';
// import { apiPaths } from '../../util/request';
// import { noop } from '../../util/util';

// import PageBody from '../page/body.vue';


// defineOptions({
//   name: 'FormPreview'
// });

// const props = defineProps({
//   projectId: {
//     type: String,
//     required: true
//   },
//   xmlFormId: {
//     type: String,
//     required: true
//   },
//   draft: {
//     type: Boolean,
//     required: true
//   }
// });
const route = useRoute();
const router = useRouter();

const projectParam = route.params.projectId; // TODO don't trust anything!
const formParam = route.params.xmlFormId;
const useWebForms = route.query.webforms === 'true';
const formXml = ref<string>();
const loadingState = ref(true);
const hideLoading = () => {
  loadingState.value = false;
};

// const { form } = useRequestData();

const WebFormRenderer = shallowRef(null);
const EnketoIframe = shallowRef(null);

const loadWebFormRenderer = async () => {
	try {
		WebFormRenderer.value = (
			(await import('./web-form-renderer.vue'))
		).default;
	} catch {
		throw new Error('todo');
	}
};

const loadEnketo = async () => {
	try {
		EnketoIframe.value = (
			(await import('./enketo-iframe.vue'))
		).default;
	} catch {
		throw new Error('todo');
	}
};

const getFormXml = () => {
  const encodedFormId = encodeURIComponent(formParam);
  const draftPath = '';
  const qs = '';
  const url = `/v1/projects/${projectParam}/forms/${encodedFormId}${draftPath}.xml${qs}`;
  fetch(url)
    .then((response) => response.text())
    .then((xml) => { formXml.value = xml })
    .catch((e) => console.err);
};


const fetchForm = () => {
  const encodedFormId = encodeURIComponent(formParam);
  const draftPath = '';
  const qs = '';
  const url = `/v1/projects/${projectParam}/forms/${encodedFormId}${draftPath}${qs}`;
  fetch(url)
    .then((response) => response.json())
    .then((form) => {
      if (form.webformsEnabled || useWebForms) {
        loadWebFormRenderer();
      } else {
        loadEnketo();
      }
      // TODO we want to put this off until after the async load happens
      loadingState.value = false;
    })
    .catch((e) => console.err);
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
  <template v-else-if="!loadingState && WebFormRenderer.value !== null">
 		<component :is="WebFormRenderer" @loaded="hideLoading"/>
  </template>
  <template v-else-if="!loadingState">
    <enketo-iframe :enketo-id="form.enketoId" action-type="preview" @loaded="hideLoading"/>
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
