<script lang="ts" setup>
import { selectOptionId } from '@/lib/format/selectOptionId.ts';
import type { SelectNode } from '@getodk/xforms-engine';
import RadioButton from 'primevue/radiobutton';
interface RadioButtonProps {
	readonly question: SelectNode;
}

const props = defineProps<RadioButtonProps>();

defineEmits(['update:modelValue', 'change']);

const selectValue = (value: string) => {
	props.question.selectValue(value);
};
</script>

<template>
	<label
		v-for="option in question.currentState.valueOptions"
		:key="option.value"
		:for="selectOptionId(question, option)"
		:class="{
			'value-option': true,
			active: question.currentState.value[0] === option.value,
			disabled: question.currentState.readonly,
			'no-buttons': question.appearances['no-buttons']
		}"
	>
		<RadioButton
			:input-id="selectOptionId(question, option)"
			:value="option.value"
			:name="question.nodeId"
			:disabled="question.currentState.readonly"
			:model-value="question.currentState.value[0]"
			@update:model-value="selectValue"
			@change="$emit('change')"
		/>
		<span class="label-text">
			{{ option.label.asString }}
		</span>
	</label>
</template>

<style lang="scss" scoped>
.value-option {
	display: flex;
	align-items: center;
	outline: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	padding: 12px;
	cursor: pointer;
	background: var(--odk-base-background-color);

	.label-text {
		margin-left: 10px;
	}

	&:has(.p-radiobutton-input:hover),
	&:has(.p-radiobutton-input:focus-visible) {
		outline-color: var(--odk-primary-border-color);
		background-color: var(--odk-primary-light-background-color);
	}

	:deep(.p-radiobutton:not(.p-disabled):has(.p-radiobutton-input:focus-visible)),
	:deep(.p-radiobutton:not(.p-disabled):has(.p-radiobutton-input:hover)) {
		box-shadow: none;
	}

	&:deep(:has(.p-radiobutton-input:focus-visible)),
	&:hover {
		outline-color: var(--odk-primary-border-color);
		background-color: var(--odk-primary-lighter-background-color);
	}

	&.active {
		outline: 2px solid var(--odk-primary-border-color);
		background-color: var(--odk-primary-lighter-background-color);
	}

	&.disabled,
	&.disabled label {
		cursor: not-allowed;
	}
}

.no-buttons {
	:deep(.p-radiobutton) {
		opacity: 0;
		width: 0; /* Radio button isn't visible */
	}

	.label-text {
		margin-left: 0;
	}
}
</style>
