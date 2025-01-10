<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import PrimeDropdown from 'primevue/dropdown';
import { computed } from 'vue';

interface SearchableDropdownProps {
	readonly question: SelectNode;
	readonly style?: string;
}

const props = defineProps<SearchableDropdownProps>();

defineEmits(['update:modelValue', 'change']);

const options = computed(() => {
	return props.question.currentState.valueOptions.map((option) => option.value);
});

const selectValue = (value: string) => {
	props.question.selectValue(value);
};

const getOptionLabel = (value: string) => {
	const option = props.question.getValueOption(value);

	if (option == null) {
		throw new Error(`Failed to find option for value: ${value}`);
	}

	return option.label.asString;
};
</script>

<template>
	<PrimeDropdown
		:id="question.nodeId"
		class="dropdown"
		:filter="question.appearances.autocomplete"
		:auto-filter-focus="true"
		:model-value="question.currentState.value[0]"
		:options="options"
		:option-label="getOptionLabel"
		@update:model-value="selectValue"
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
