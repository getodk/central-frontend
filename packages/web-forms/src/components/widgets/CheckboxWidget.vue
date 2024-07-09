<script lang="ts" setup>
import type { SelectItem, SelectNode } from '@getodk/xforms-engine';
import PrimeCheckbox from 'primevue/checkbox';

const props = defineProps<{ question: SelectNode, style?: string}>();
defineEmits(['update:modelValue']);

const setSelectNValue = (values: SelectItem[]) => {
	for(const v of props.question.currentState.value){
		props.question.deselect(v);
	}
	for(const v of values) {
		props.question.select(v);
	}
}
</script>

<template>
	<label 
		v-for="option of question.currentState.valueOptions"
		:key="option.value"
		:class="[{ 
			'value-option': true,
			active: question.currentState.value.find(v => v.value === option.value), 
			disabled: question.currentState.readonly,
			'no-buttons': question.appearances['no-buttons'] }]"
		:for="question.nodeId + '_' + option.value"
	>
		<PrimeCheckbox
			:input-id="question.nodeId + '_' + option.value"
			:name="question.nodeId"
			:value="option"
			:disabled="question.currentState.readonly"
			:model-value="question.currentState.value"
			@update:model-value="setSelectNValue"
		/>
		<span class="label-text">
			{{ option.label?.asString }}
		</span>
	</label>
</template>

<style scoped lang="scss">
.value-option {
	display: flex;
	align-items: center;
	outline: 1px solid var(--surface-300);
	border-radius: 10px;
	padding: 15px;
	margin: 20px 0;
	cursor: pointer;

  &:has(.p-checkbox-input:hover),
	&:has(.p-checkbox-input:focus-visible) {
		outline-color: var(--primary-500);
		background-color: var(--primary-100);
	}

	&.active {
		outline: 2px solid var(--primary-500);
		background-color: var(--primary-50);
	}

	.label-text {
		margin-left: 10px;
	}

	&.disabled,
	&.disabled label {
		cursor: not-allowed;
	}
	:deep(.p-checkbox:not(.p-disabled):has(.p-checkbox-input:hover)) {
		box-shadow: none;
	}
}

.no-buttons {
	:deep(.p-checkbox) {
		opacity: 0;
		margin-left: -15px;
	}

	.label-text {
		margin-left: 0;
	}
}
</style>