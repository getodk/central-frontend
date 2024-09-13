<script lang="ts" setup>
import type { TriggerNode } from '@getodk/xforms-engine';
import PrimeCheckbox from 'primevue/checkbox';
import ControlText from '../ControlText.vue';

const props = defineProps<{ question: TriggerNode; style?: string }>();
defineEmits(['update:modelValue', 'change']);

const setValue = (value: boolean) => {
	props.question.setValue(value);
};
</script>

<template>
	<ControlText :question="question" />
	<p>
		<label
			:class="{
				'value-option': true,
				active: question.currentState.value === true,
				disabled: question.currentState.readonly,
				'no-buttons': question.appearances['no-buttons']
			}"
			:for="question.nodeId + '_checkbox'"
		>
			<PrimeCheckbox
				:input-id="question.nodeId + '_checkbox'"
				:binary="true"
				:name="question.nodeId"
				:value="true"
				:disabled="question.currentState.readonly"
				:model-value="question.currentState.value === true"
				@update:model-value="setValue"
				@change="$emit('change')"
			/>
			<span class="label-text">
				<!-- TODO: translations -->
				Okay
			</span>
		</label>
	</p>
</template>

<style scoped lang="scss">
.value-option {
	display: flex;
	align-items: center;
	outline: 1px solid var(--surface-300);
	border-radius: 10px;
	padding: 15px;
	background: var(--surface-0);
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
