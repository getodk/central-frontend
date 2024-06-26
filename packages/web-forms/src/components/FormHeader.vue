<script setup lang="ts">
import { type FormLanguage, type RootNode, type SyntheticDefaultLanguage } from '@getodk/xforms-engine';
import PrimeButton from 'primevue/button';
import PrimeCard from 'primevue/card';
import PrimeMenu from 'primevue/menu';
import { ref } from 'vue';
import FormLanguageDialog from './FormLanguageDialog.vue';
import FormLanguageMenu from './FormLanguageMenu.vue';

const props = defineProps<{form: RootNode}>();
const languageDialogState = ref(false);
const menu = ref<PrimeMenu>();

const isFormLanguage = (lang: FormLanguage | SyntheticDefaultLanguage) : lang is FormLanguage => {
	return !lang.isSyntheticDefault;
}

const languages = props.form.languages.filter(isFormLanguage);

const print = () => window.print();

const items = ref([
	{
		label: 'Print',
		icon: 'icon-local_printshop',
		command: print
	}
]);

if(languages.length > 0){
	items.value.unshift({
		label: 'Change language',
		icon: 'icon-language',
		command: () => languageDialogState.value = true
	})
}

const handleLanguageChange = (event: FormLanguage) => {
	props.form.setLanguage(event);
};
</script>

<template>
	<!-- for desktop -->
	<div class="hidden lg:flex justify-content-end flex-wrap gap-3 larger-screens">
		<PrimeButton class="print-button" severity="secondary" rounded icon="icon-local_printshop" @click="print" />
		<FormLanguageMenu 
			:active-language="form.currentState.activeLanguage" 
			:languages="languages" 
			@update:active-language="handleLanguageChange"
		/>
	</div>
	<PrimeCard class="form-title hidden lg:block">
		<template #content>
			<!-- TODO/q: should the title be on the definition or definition.form be accessible instead of definition.bind.form -->
			<h1>{{ form.definition.bind.form.title }}</h1>
			<!-- last saved timestamp -->
		</template>
	</PrimeCard>

	<!-- for mobile and tablet -->
	<div class="flex lg:hidden align-items-center smaller-screens">
		<h1 class="flex-grow-1">
			{{ form.definition.bind.form.title }}
		</h1>

		<!-- for tablet -->
		<div class="form-options hidden md:flex justify-content-end gap-3">
			<PrimeButton class="print-button" severity="secondary" rounded icon="icon-local_printshop" @click="print" />
			<FormLanguageMenu 
				:active-language="form.currentState.activeLanguage" 
				:languages="languages" 
				@update:active-language="handleLanguageChange"
			/>
		</div>
			
		<!-- for mobile -->
		<div class="form-options flex md:hidden">
			<PrimeButton v-if="languages.length > 0" icon="icon-menu" class="btn-menu" text rounded aria-label="Menu" @click="menu?.toggle" />
			<PrimeButton v-else class="print-button" severity="secondary" rounded icon="icon-local_printshop" @click="print" />
			<PrimeMenu id="overlay_menu" ref="menu" :model="items" :popup="true" />
			<FormLanguageDialog 
				v-model:state="languageDialogState" 
				:active-language="form.currentState.activeLanguage" 
				:languages="languages" 
				@update:active-language="handleLanguageChange"
			/>
		</div>
	</div>
</template>

<style scoped lang="scss">
.p-button.p-button-icon-only.p-button-rounded {
		height: 2.5rem;
		width: 2.5rem;
		min-width: 2.5rem;
		font-size: 1.5rem;

		&:hover{
			background: var(--primary-100);
		}
		&:active, &:focus {
			background: var(--primary-50);
		}
	}

	
.form-title {
	// var(--light-elevation-1);

	border-radius: 10px;
	box-shadow: var(--light-elevation-1);
	border-top: none;
	margin-top: 20px;

	:deep(.p-card-content) {
		padding: 0 1rem;

		h1 {
			font-size: 1.5rem;
			font-weight: 500;
			margin: 10px 0;
		}
	}
}

.smaller-screens {
	background-color: var(--surface-0);
	filter: drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.15)) drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.30)) ;

	h1 {
		padding-left: 10px;
		font-size: 1.5rem;
	}

	.form-options{
		padding-right: 10px;
	}
	
	.btn-menu{
		color: var(--surface-900);
	}
}

</style>
