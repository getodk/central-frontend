<script setup lang="ts">
import type { ActiveLanguage, FormLanguage } from '@getodk/xforms-engine';
import Dropdown from 'primevue/dropdown';

defineProps<{ languages: FormLanguage[], activeLanguage: ActiveLanguage }>();

defineEmits(['update:activeLanguage'])

</script>

<template>
	<Dropdown
		v-if="languages.length > 0"
		:model-value="activeLanguage"
		:options="languages"
		option-label="language"
		class="flex align-items-center rounded with-icon language-changer"
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
		font-size: 1.5rem;
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