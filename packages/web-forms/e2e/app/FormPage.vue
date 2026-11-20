<script setup lang="ts">
import { useRoute } from 'vue-router';
import { getFormXml, getAttachment } from '../../tests/helpers.js';
import { ref } from 'vue';
import OdkWebForm from '../../src/components/OdkWebForm.vue';
import type { PreloadProperties } from '@getodk/xforms-engine';
import { DEFAULT_MAP_PROVIDER, type MapProvider } from '../../src/lib/client-options.js';
const route = useRoute();
const formId = route.params.formId as string;

const GOOGLE_MAP_PROVIDER: MapProvider = { name: 'google', apiKey: 'e2e-stubbed-key' };
const mapProvider = route.query.mapProvider === 'google' ? GOOGLE_MAP_PROVIDER : DEFAULT_MAP_PROVIDER;

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
			:fetch-form-attachment="getAttachment"
			:device-id="deviceId"
			:preload-properties="preloadProperties"
			:map-provider="mapProvider"
			@submit="handleSubmit"
		/>
	</template>
	<template v-else>
		No form found with id "{{ formId }}"
	</template>
</template>
