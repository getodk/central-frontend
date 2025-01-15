<script setup lang="ts" generic="V extends ValueType">
import type { SelectItemValue, SelectNode, ValueType } from '@getodk/xforms-engine';
import PrimeDropdown from 'primevue/dropdown';
import { computed } from 'vue';

const props = defineProps<{
	readonly question: SelectNode<V>;
	readonly style?: string;
}>();

defineEmits(['update:modelValue', 'change']);

const options = computed(() => {
	return props.question.currentState.valueOptions.map((option) => option.value);
});

const selectValue = (value: SelectItemValue<V>) => {
	props.question.selectValue(value);
};

const getOptionLabel = (value: SelectItemValue<V>) => {
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
