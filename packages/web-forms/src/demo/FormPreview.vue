<script setup lang="ts">
import { xformFixturesByCategory, XFormResource } from '@getodk/common/fixtures/xforms.ts';
import type {
	ChunkedInstancePayload,
	FetchFormAttachment,
	MissingResourceBehavior,
	MonolithicInstancePayload,
} from '@getodk/xforms-engine';
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

const handleSubmit = (payload: MonolithicInstancePayload) => {
	// eslint-disable-next-line no-console
	console.log('submission payload:', payload);

	alert(`Submit button was pressed`);
};

const handleSubmitChunked = (payload: ChunkedInstancePayload) => {
	// eslint-disable-next-line no-console
	console.log('CHUNKED submission payload:', payload);
};
</script>
<template>
	<template v-if="formPreviewState">
		<OdkWebForm
			:form-xml="formPreviewState.formXML"
			:fetch-form-attachment="formPreviewState.fetchFormAttachment"
			:missing-resource-behavior="formPreviewState.missingResourceBehavior"
			:submission-max-size="Infinity"
			@submit="handleSubmit"
			@submit-chunked="handleSubmitChunked"
		/>
		<FeedbackButton />
	</template>
	<div v-else>
		Loading...
	</div>
</template>
