<script setup lang="ts">
import { useRoute } from 'vue-router';
import { getFormXml, getAttachment } from '../helpers.js';
import { ref } from 'vue';
import OdkWebForm from '../../src/components/OdkWebForm.vue';
import type { PreloadProperties } from '@getodk/xforms-engine';
const route = useRoute();
const formId = route.params.formId as string;

const formXml = ref<string | null>(null);
const init = () => {
	getFormXml(formId)
		.then(xml => {
			formXml.value = xml;
		})
		.catch(err => {
			// eslint-disable-next-line no-console
			console.error(err);
		});
};

const fetchFormAttachment = (requestUrl: URL) => {
	const attachment = getAttachment(requestUrl.toString());
	return Promise.resolve(new Response(attachment));
};

const deviceId = 'wf:0123456789ABCDEF';

const preloadProperties: PreloadProperties = {
	email: 'fake@fake.fake',
	phoneNumber: '+1235556789',
	username: 'nousername',
};

const handleSubmit = () => {
	// eslint-disable-next-line no-console
	console.log('submitting');
};
init();
</script>
<template>
	<template v-if="formXml">
		<OdkWebForm
			:form-xml="formXml"
			:fetch-form-attachment="fetchFormAttachment"
			:device-id="deviceId"
			:preload-properties="preloadProperties"
			@submit="handleSubmit"
		/>
	</template>
	<template v-else>
		No form found with id "{{ formId }}"
	</template>
</template>
