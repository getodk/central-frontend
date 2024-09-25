<script setup lang="ts">
import { xformFixturesByCategory, XFormResource } from '@getodk/common/fixtures/xforms.ts';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import OdkWebForm from '../components/OdkWebForm.vue';
import FeedbackButton from './FeedbackButton.vue';

const route = useRoute();

const categoryParam = route.params.category as string;
const formParam = route.params.form as string;

const formXML = ref<string>();

let xformResource: XFormResource<'local'> | XFormResource<'remote'> | undefined;

if (route.query.url) {
	xformResource = XFormResource.fromRemoteURL(route.query.url.toString());
} else if (formParam) {
	xformResource = xformFixturesByCategory.get(categoryParam)?.find((fixture) => {
		return fixture.identifier === formParam;
	});
}

xformResource
	?.loadXML()
	.then((fixtureXML) => {
		formXML.value = fixtureXML;
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
	<template v-if="formXML">
		<OdkWebForm :form-xml="formXML" @submit="handleSubmit" />
		<FeedbackButton />
	</template>
	<div v-else>
		Loading...
	</div>
</template>
