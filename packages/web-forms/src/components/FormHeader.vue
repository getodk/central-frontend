<script setup lang="ts">
import {
	type FormLanguage,
	type RootNode,
	type SyntheticDefaultLanguage,
} from '@getodk/xforms-engine';
import Card from 'primevue/card';
import { ref } from 'vue';
import FormLanguageMenu from './FormLanguageMenu.vue';

const props = defineProps<{ form: RootNode }>();
const languageDialogState = ref(false);

const isFormLanguage = (lang: FormLanguage | SyntheticDefaultLanguage): lang is FormLanguage => {
	return !lang.isSyntheticDefault;
};

type DropdownItem = Array<{ label: string; icon: string; command: () => void }>;
const items = ref<DropdownItem>([]);

const languages = props.form.languages.filter(isFormLanguage);
if (languages.length > 0) {
	items.value.unshift({
		// TODO: translations
		label: 'Change language',
		icon: 'mdiWeb',
		command: () => (languageDialogState.value = true),
	});
}

const handleLanguageChange = (event: FormLanguage) => {
	props.form.setLanguage(event);
};
</script>

<template>
	<!-- for desktop -->
	<div class="hidden lg:inline larger-screens">
		<div class="flex justify-content-end flex-wrap gap-3">
			<FormLanguageMenu
				:active-language="form.currentState.activeLanguage"
				:languages="languages"
				@update:active-language="handleLanguageChange"
			/>
		</div>
		<Card class="form-title">
			<template #content>
				<!-- TODO/q: should the title be on the definition or definition.form be accessible instead of definition.bind.form -->
				<h1>{{ form.definition.bind.form.title }}</h1>
			<!-- last saved timestamp -->
			</template>
		</Card>
	</div>


	<!-- for mobile and tablet -->
	<div class="flex lg:hidden align-items-start justify-content-between smaller-screens">
		<h1>
			{{ form.definition.bind.form.title }}
		</h1>

		<div class="form-options">
			<FormLanguageMenu
				v-if="languages.length > 0"
				:active-language="form.currentState.activeLanguage"
				:languages="languages"
				@update:active-language="handleLanguageChange"
			/>
		</div>
	</div>
</template>

<style scoped lang="scss">
.p-menu-item-link,
.p-menu-item-link:hover {
	color: var(--odk-text-color);
}

.p-button.p-button-rounded {
	&:hover {
		background: var(--odk-primary-light-background-color);
		border-color: var(--odk-primary-border-color);
		outline: none;
	}

	&:active,
	&:focus {
		background: var(--odk-primary-lighter-background-color);
		border-color: var(--odk-primary-border-color);
		outline: none;
	}
}

.form-title {
	border-radius: var(--odk-radius);
	box-shadow: none;
	border-top: none;
	margin-top: 20px;

	:deep(.p-card-body) {
		padding-left: 3rem;
		padding-right: 3rem;

		h1 {
			font-size: var(--odk-title-font-size);
			font-weight: 500;
			margin: 10px 0;
		}
	}
}

.smaller-screens {
	background-color: var(--odk-base-background-color);
	border-bottom: 1px solid var(--odk-border-color);

	h1 {
		padding-left: 1.5rem;
		font-size: var(--odk-title-font-size);
		font-weight: 400;
		margin: 16px 0;
	}

	.form-options {
		padding-right: 10px;
		min-width: 50px;
		container-type: size;
		container-name: formOptionsContainer;
		height: 40px;
		margin-top: 10px;

		.language-changer {
			display: flex;
			justify-content: end;
			width: 45px;
			gap: 0.5rem;

			:deep(.p-select-label) {
				text-overflow: unset;
			}

			:deep(.p-select-label) span,
			:deep(.p-select-dropdown) {
				display: none;
			}

			:deep(.odk-icon) {
				margin-right: 0;
			}
		}

		@container formOptionsContainer (min-width: 260px) {
			.language-changer {
				max-width: 220px;
			}
		}
	}
}
</style>
