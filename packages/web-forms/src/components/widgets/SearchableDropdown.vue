<script setup lang="ts">
import type { SelectItem, SelectNode } from '@getodk/xforms-engine';
import PrimeDropdown from 'primevue/dropdown';

interface SearchableDropdownProps {
	readonly question: SelectNode;
	readonly style?: string;
}

const props = defineProps<SearchableDropdownProps>();

defineEmits(['update:modelValue', 'change']);

const selectItem = (item: SelectItem) => {
	props.question.selectValue(item.value);
};

const getOptionLabel = (item: SelectItem) => {
	return item.label.asString;
};
</script>

<template>
	<PrimeDropdown
		:id="question.nodeId"
		class="dropdown"
		:filter="question.appearances.autocomplete"
		:auto-filter-focus="true"
		:model-value="question.currentState.value[0]"
		:options="question.currentState.valueOptions"
		:option-label="getOptionLabel"
		@update:model-value="selectItem"
		@change="$emit('change')"
	/>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

.dropdown {
	width: 100%;
	border-radius: 10px;
	border-color: var(--surface-300);

	&:not(.p-disabled):hover {
		border-color: var(--primary-500);
	}

	@media screen and (min-width: #{$md}) {
		width: 50%;
	}
}
</style>
