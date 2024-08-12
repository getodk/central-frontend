<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import OdkWebForm from '../components/OdkWebForm.vue';

const route = useRoute()

const formFixtureGlobImports = import.meta.glob<false, 'raw', string>('../../../ui-solid/fixtures/xforms/**/*.xml', {
	query: '?raw',
	import: 'default',
	eager: false,
});

const categoryParam = route.params.category as string;
const formParam = route.params.form as string;
const formPath = '../../../ui-solid/fixtures/xforms/' + (route.params.category != 'Other' ? `${categoryParam}/${formParam}` : formParam) + '.xml';

const form = ref();
formFixtureGlobImports[formPath]()
	.then((xml:string) => {
		form.value = xml;
	})
	.catch(() => { 
		alert('Failed to load the Form XML');
	});

const handleSubmit = () => {
	alert(`Submit button was pressed`);  
}

</script>

<template>
	<OdkWebForm v-if="form" :form-xml="form" @submit="handleSubmit" />
	<div v-else>
		Loading...
	</div>  
</template>