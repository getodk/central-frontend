<script setup lang="ts">
import { xformFixturesByCategory, XFormResource } from '@getodk/common/fixtures/xforms.ts';
import type { FetchFormAttachment, MissingResourceBehavior } from '@getodk/xforms-engine';
import { constants as ENGINE_CONSTANTS } from '@getodk/xforms-engine';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import OdkWebForm from '../components/OdkWebForm.vue';
import FeedbackButton from './FeedbackButton.vue';

const route = useRoute();

const categoryParam = route.params.category as string;
const formParam = route.params.form as string;

interface FormPreviewState {
	readonly formXML: string;
	readonly fetchFormAttachment: FetchFormAttachment;
	readonly missingResourceBehavior: MissingResourceBehavior;
}

const formPreviewState = ref<FormPreviewState>();

let missingResourceBehavior: MissingResourceBehavior =
	ENGINE_CONSTANTS.MISSING_RESOURCE_BEHAVIOR.DEFAULT;

let xformResource: XFormResource<'local'> | XFormResource<'remote'> | undefined;

if (route.query.url) {
	xformResource = XFormResource.fromRemoteURL(route.query.url.toString());
	missingResourceBehavior = ENGINE_CONSTANTS.MISSING_RESOURCE_BEHAVIOR.BLANK;
} else if (formParam) {
	xformResource = xformFixturesByCategory.get(categoryParam)?.find((fixture) => {
		return fixture.identifier === formParam;
	});
}

xformResource
	?.loadXML()
	.then((formXML) => {
		formPreviewState.value = {
			formXML,
			fetchFormAttachment: xformResource.fetchFormAttachment,
			missingResourceBehavior,
		};
	})
	.catch((error) => {
		// eslint-disable-next-line no-console
		console.error('Failed to load the Form XML', error);

		alert('Failed to load the Form XML');
	});

const handleSubmit = () => {
	alert(`Submit button was pressed`);
};
</script>
<template>
	<template v-if="formPreviewState">
		<OdkWebForm
			:form-xml="formPreviewState.formXML"
			:fetch-form-attachment="formPreviewState.fetchFormAttachment"
			:missing-resource-behavior="formPreviewState.missingResourceBehavior"
			@submit="handleSubmit"
		/>
		<FeedbackButton />
	</template>
	<div v-else>
		Loading...
	</div>
</template>
