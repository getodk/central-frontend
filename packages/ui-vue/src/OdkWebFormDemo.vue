<script setup lang="ts">
import { ref } from 'vue';
import OdkWebForm from './components/OdkWebForm.vue';

const formFixtureGlobImports = import.meta.glob<true, 'raw', string>('../../ui-solid/fixtures/xforms/**/*.xml', {
	query: '?raw',
	import: 'default',
	eager: true,
});
const demoForms = Object.entries(formFixtureGlobImports);

demoForms.forEach(f => {
	f[0] = f[0].replace('../../ui-solid/fixtures/xforms/', '')
})


const selectForm = ref<[string, string] | null>(null);

const handleSubmit = (data: string) => {
	alert(`Submit button was pressed. Data: ${data}`); // eslint-disable-line no-undef -- alert is defined globally
} 

</script>

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
		<OdkWebForm v-if="selectForm" :form-xml="selectForm[1]" @submit="handleSubmit" />  
	</div>
</template>

