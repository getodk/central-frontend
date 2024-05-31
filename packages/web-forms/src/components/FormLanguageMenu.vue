<script setup lang="ts">
import type { FormLanguage, RootNode } from '@getodk/xforms-engine';
import Dropdown, { type DropdownChangeEvent } from 'primevue/dropdown';

const props = defineProps<{ form: RootNode }>();

const languages = props.form.languages.filter(language => !language.isSyntheticDefault);

interface LanguageDropdownChangeEvent extends DropdownChangeEvent {
	readonly value: FormLanguage;
}

const handleLanguageChange = (event: LanguageDropdownChangeEvent) => {
	props.form.setLanguage(event.value);
};

</script>
<template>
	<Dropdown
		v-if="languages.length > 0"
		:model-value="form.currentState.activeLanguage"
		:options="languages"
		option-label="language"
		class="flex align-items-center rounded with-icon"
		aria-label="change language"
		@change="handleLanguageChange"
	>
		<template #value="slotProps">
			<span class="icon-language" />
			<span>
				{{ slotProps.value.language }}
			</span>
		</template>
		<template #option="slotProps">
			<span class="language-dd-label">{{ slotProps.option.language }}</span>
		</template>
	</Dropdown>
</template>

<style scoped lang="scss">
.p-dropdown.rounded {
	border-radius: 30px;
	border: none;
	width: 160px;
	color: #424242;

	&.p-focus {
		box-shadow: inset 0 0 0 1px var(--primary-500);
	}

	:deep(.p-dropdown-label) {
		padding: 5px 16px;
		span {
			vertical-align: middle;
		}
	}

	.icon-language {
		margin-right: 10px;
	}
}
</style>