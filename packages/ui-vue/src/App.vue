<template>
	<ul v-if="!selectForm">
		<li v-for="form in demoForms" :key="form[0]">
			{{ form[0] }}
			<button @click="selectForm = form">
				Show
			</button>
		</li>
	</ul>
	<div v-else>
		<button @click="selectForm = null">
			Back
		</button>
		<OdkForm v-if="selectForm" :form-xml="selectForm[1]" @submit="handleSubmit" />  
	</div>
</template>

<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue';
import OdkForm from './components/OdkForm.vue';

declare global {
	var playwrightCapturedErrors: Error[] | undefined;
}
onErrorCaptured((error) => {
	globalThis.playwrightCapturedErrors?.push(error);
});

const formFixtureGlobImports = import.meta.glob('../../ui-solid/fixtures/xforms/**/*.xml', {
    query: '?raw',
    import: 'default',
    eager: true,
});
const demoForms = Object.entries(formFixtureGlobImports) as Array<[string, string]>;

demoForms.forEach(f => {
    f[0] = f[0].replace('../../ui-solid/fixtures/xforms/', '')
})


const selectForm = ref<[string, string] | null>(null);

const handleSubmit = (data: string) => {
    alert(`Submit button was pressed. Data: ${data}`); // eslint-disable-line no-undef -- alert is defined globally
} 

</script>


<style>

</style>
