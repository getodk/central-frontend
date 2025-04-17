<script lang="ts" setup>
import type { TriggerNode } from '@getodk/xforms-engine';
import Checkbox from 'primevue/checkbox';
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
			<Checkbox
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
	outline: 1px solid var(--odk-border-color);
	border-radius: var(--odk-radius);
	padding: 12px;
	background: var(--odk-base-background-color);
	cursor: pointer;

	&:has(.p-checkbox-input:hover),
	&:has(.p-checkbox-input:focus-visible) {
		outline-color: var(--odk-primary-border-color);
		background-color: var(--odk-primary-light-background-color);
	}

	&.active {
		outline: 2px solid var(--odk-primary-border-color);
		background-color: var(--odk-primary-lighter-background-color);
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
		width: 0; /* Checkbox isn't visible */
	}

	.label-text {
		margin-left: 0;
	}
}
</style>
