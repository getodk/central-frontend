<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import Select from 'primevue/select';
import { computed, inject } from 'vue';
import MarkdownBlock from './MarkdownBlock.vue';
import { TRANSLATE } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { Translate } from '@getodk/web-forms/lib/locale/useLocale.ts';

interface SearchableDropdownProps {
	readonly question: SelectNode;
	readonly style?: string;
}

const t: Translate = inject(TRANSLATE)!;
const props = defineProps<SearchableDropdownProps>();

const DEFAULT_PRIMEVUE_ITEM_HEIGHT = 38;

defineEmits(['update:modelValue', 'change']);

const options = computed(() => {
	return props.question.currentState.valueOptions.map((option) => {
		return {
			value: option.value,
			label: option.label.formatted,
			search: option.label.asString,
		};
	});
});

const virtualScrollerOptions = computed(() => {
	if (props.question.currentState.valueOptions.length > 20) {
		return { itemSize: DEFAULT_PRIMEVUE_ITEM_HEIGHT };
	}
	// remove virtual scroller for small selects so primevue knows
	// what height to make the list container
	return undefined;
});

const selectedLabel = computed(() => {
	const value = props.question.currentState?.value?.[0];
	if (!value) {
		return [];
	}
	const option = props.question.getValueOption(value);
	return option?.label.formatted;
});

const selectValue = (value: string) => {
	props.question.selectValue(value);
};
</script>

<template>
	<Select
		:input-id="question.nodeId"
		class="dropdown"
		:filter="question.appearances.autocomplete"
		filter-match-mode="contains"
		:auto-filter-focus="true"
		:model-value="question.currentState.value[0]"
		:disabled="props.question.currentState.readonly"
		:options="options"
		option-label="search"
		option-value="value"
		:virtual-scroller-options="virtualScrollerOptions"
		@update:model-value="selectValue"
		@change="$emit('change')"
	>
		<template #option="slotProps">
			<MarkdownBlock v-for="elem in slotProps.option.label" :key="elem.id" :elem="elem" />
		</template>
		<template #value>
			<span v-if="!selectedLabel?.length" class="dropdown-placeholder">
				{{ t('searchable_dropdown.select.placeholder') }}
			</span>
			<MarkdownBlock v-for="elem in selectedLabel" :key="elem.id" :elem="elem" />
		</template>
	</Select>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;
@use '../../assets/styles/select-options';

.dropdown {
	width: 100%;
	border-radius: var(--odk-radius);
	border-color: var(--odk-border-color);

	&:not(.p-disabled):hover {
		border-color: var(--odk-primary-border-color);
	}

	@media screen and (min-width: #{pf.$md}) {
		width: 50%;
	}
}
</style>
