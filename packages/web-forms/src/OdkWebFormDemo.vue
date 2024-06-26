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

const handleSubmit = () => {
	alert(`Submit button was pressed`);  
} 

const showForm = (form: [string, string]) => {
	selectForm.value = form;
	history.pushState({form: form }, "", "/" + form[0]);
}

interface PopStateEventWithForm extends PopStateEvent {
	state: {form: [string, string]};
}

window.addEventListener("popstate", (event:PopStateEventWithForm) => {
	if(!event.state) {
		selectForm.value = null;
	}
	else {
		selectForm.value = event.state.form;
	}
});

if(location.pathname != '/'){
	const demoForm = demoForms.find(f => `/${f[0]}` === location.pathname) ?? null;
	if(demoForm) {
		selectForm.value = demoForm;
	}
	else{
		history.replaceState(null, "", "/");
	}
}
</script>

<template>	
	<div v-if="!selectForm">
		<h1>Demo Forms</h1>
		<ul class="form-list">
			<li v-for="form in demoForms" :key="form[0]" @click="showForm(form)">
				{{ form[0] }}
			</li>
		</ul>
	</div>
	<div v-else>
		<OdkWebForm v-if="selectForm" :form-xml="selectForm[1]" @submit="handleSubmit" />  
	</div>
</template>

<style>
ul.form-list {
	padding: 0;

	li {
		list-style: none;
		padding: 10px;
		margin: 10px;
		border: 1px solid var(--primary-500);
		border-radius: 10px;
		cursor: pointer;
		background-color: var(--surface-0);
	}

	li:hover {
		background-color: var(--primary-50);
	}
	
}
</style>