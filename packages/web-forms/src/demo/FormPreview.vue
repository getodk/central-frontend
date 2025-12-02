<script setup lang="ts">
import { xformFixturesByCategory, XFormResource } from '@getodk/common/fixtures/xforms.ts';
import type {
	ChunkedInstancePayload,
	FetchFormAttachment,
	MissingResourceBehavior,
	MonolithicInstancePayload,
	PreloadProperties,
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
		if (typeof formXML !== 'string') {
			throw new Error('Wrong XML Form type. Expected a string');
		}

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

const handleSubmit = async (payload: MonolithicInstancePayload) => {
	// eslint-disable-next-line no-console
	console.log('submission payload:', payload);
	for (const value of payload.data[0].values()) {
		// eslint-disable-next-line no-console
		console.log(await value.text());
	}
	alert('Submit button was pressed');
};

const handleSubmitChunked = (payload: ChunkedInstancePayload) => {
	// eslint-disable-next-line no-console
	console.log('CHUNKED submission payload:', payload);
};

const preloadProperties: PreloadProperties = {
	email: 'fake@fake.fake',
	phoneNumber: '+1235556789',
	username: 'nousername',
};
</script>
<template>
	<template v-if="formPreviewState">
		<OdkWebForm
			:form-xml="formPreviewState.formXML"
			:fetch-form-attachment="formPreviewState.fetchFormAttachment"
			:missing-resource-behavior="formPreviewState.missingResourceBehavior"
			:submission-max-size="Infinity"
			:preload-properties="preloadProperties"
			:track-device="true"
			@submit="handleSubmit"
			@submit-chunked="handleSubmitChunked"
		/>
		<FeedbackButton />
	</template>
	<div v-else>
		Loading...
	</div>
</template>
