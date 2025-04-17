<script setup lang="ts">
import type { ActiveLanguage, FormLanguage } from '@getodk/xforms-engine';
import Select from 'primevue/select';

defineProps<{ languages: FormLanguage[]; activeLanguage: ActiveLanguage }>();

defineEmits(['update:activeLanguage']);
</script>

<template>
	<Select
		v-if="languages.length > 0"
		:model-value="activeLanguage"
		:options="languages"
		option-label="language"
		class="align-items-center with-icon language-changer"
		aria-label="change language"
		@update:model-value="$emit('update:activeLanguage', $event)"
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
	</Select>
</template>

<style scoped lang="scss">
.language-changer {
	display: flex;
}

.p-select.language-changer {
	border: none;
	width: max-content;
	max-width: 220px;
	color: var(--odk-text-color);

	&.p-focus {
		box-shadow: inset 0 0 0 1px var(--p-primary-500);
	}

	:deep(.p-select-label) {
		padding: 5px 16px;
		span {
			vertical-align: middle;
		}
	}

	.icon-language {
		margin-right: 10px;
		font-size: var(--odk-icon-size);
	}
}
</style>

<style>
@media print {
	.p-menu {
		display: none;
	}
}
</style>
