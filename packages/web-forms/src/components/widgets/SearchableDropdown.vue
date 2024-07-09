<script setup lang="ts">
import type { SelectItem, SelectNode } from '@getodk/xforms-engine';
import PrimeDropdown from 'primevue/dropdown';

const props = defineProps<{ question: SelectNode, style?: string}>();
defineEmits(['update:modelValue']);

const setSelect1Value = (item: SelectItem) => {
	props.question.select(item);	
}
const getOptionLabel = (o:SelectItem) => {
	return o.label?.asString;
}
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
		@update:model-value="setSelect1Value"
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