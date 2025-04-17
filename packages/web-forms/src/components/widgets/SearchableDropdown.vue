<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import Select from 'primevue/select';
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
	<Select
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
@use 'primeflex/core/_variables.scss' as pf;

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
