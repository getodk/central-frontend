<script lang="ts" setup>
import type { SelectItem, SelectNode } from '@getodk/xforms-engine';
import PrimeRadioButton from 'primevue/radiobutton';

const props = defineProps<{ question: SelectNode}>();
defineEmits(['update:modelValue']);

const setSelect1Value = (item: SelectItem) => {
	props.question.select(item);
}

</script>

<template>
	<label
		v-for="option in question.currentState.valueOptions"
		:key="option.value"
		:for="question.nodeId + '_' + option.value" 
		:class="{
			'value-option': true,
			active: question.currentState.value[0] === option,
			disabled: question.currentState.readonly,
			'no-buttons': question.appearances['no-buttons']
		}"
	>
		<PrimeRadioButton
			:input-id="question.nodeId + '_' + option.value"
			:value="option"
			:name="question.nodeId"
			:disabled="question.currentState.readonly"
			:model-value="question.currentState.value[0]"
			@update:model-value="setSelect1Value"
		/>
		<span class="label-text">
			{{ option.label?.asString }} 
		</span>
	</label>
</template>

<style lang="scss" scoped>

.value-option {
  display: flex;
	align-items: center;
  outline: 1px solid var(--surface-300);
	border-radius: 10px;
  padding: 15px;
	margin: 20px 0;
  cursor: pointer;

  .label-text {
		margin-left: 10px;
	}

  &:has(.p-radiobutton-input:hover),
	&:has(.p-radiobutton-input:focus-visible) {
		outline-color: var(--primary-500);
		background-color: var(--primary-100);
	}

	:deep(.p-radiobutton:not(.p-disabled):has(.p-radiobutton-input:focus-visible)),
	:deep(.p-radiobutton:not(.p-disabled):has(.p-radiobutton-input:hover)) {
		box-shadow: none;
	}

	&:deep(:has(.p-radiobutton-input:focus-visible)),
	&:hover{
		outline-color: var(--primary-500);
		background-color: var(--primary-50);
	}

	&.active {
		outline: 2px solid var(--primary-500);
		background-color: var(--primary-50);
	}

  &.disabled,
	&.disabled label {
		cursor: not-allowed;
	}
}

.no-buttons {
	:deep(.p-radiobutton) {
		opacity: 0;
		margin-left: -15px;
	}

	.label-text {
		margin-left: 0;
	}
}
</style>