<script setup lang="ts">
import type { StringNode } from '@getodk/xforms-engine';
import InputText from 'primevue/inputtext';
import { computed, inject, ref } from 'vue';
import ControlLabel from '../ControlLabel.vue';
import ControlHint from '../ControlHint.vue';
import ValidationMessage from '../ValidationMessage.vue';

const props = defineProps<{question: StringNode}>();

const setValue = (value = '') => {
	props.question.setValue(value);
};

const doneAnswering = ref(false);
const submitPressed = inject<boolean>('submitPressed');
const invalid = computed(() => props.question.validationState.violation?.valid === false);
</script>

<template>
	<div class="label-and-hint">
		<ControlLabel :question="question" />
		<ControlHint :question="question" />
	</div>

	<div class="textbox-container">
		<InputText
			:id="question.nodeId"
			:required="question.currentState.required" 
			:disabled="question.currentState.readonly"
			:class="{'inside-highlighted': invalid && submitPressed}"
			variant="filled"
			:model-value="question.currentState.value"			
			@update:model-value="setValue"
			@input="doneAnswering = false"
			@blur="doneAnswering = true"
		/>
		<i v-show="invalid && (doneAnswering || submitPressed)" class="icon-error" />
	</div>
	<ValidationMessage :message="question.validationState.violation?.message.asString" :show-message="doneAnswering || submitPressed" />
</template>

<style scoped lang="scss">
.label-and-hint {
	margin-bottom: 0.75rem;
}

.textbox-container {
	position: relative;

	input.p-inputtext {
		width: 100%;
		background-color: var(--surface-100);

		&.inside-highlighted {
			background-color: var(--surface-0);
		}

		&:read-only {
			cursor: not-allowed;
			opacity: 1;
			background-color: var(--surface-50);
			background-image: none;
		}

		&.p-variant-filled:enabled:hover,
		&.p-variant-filled:enabled:focus {
			background-color: var(--surface-50);
		}
	}

	.icon-error {
		position: absolute;
		inset-inline-end: 10px;
		top: 15px;
		color: var(--error-text-color);
		font-size: 1.2rem;
	}
}
</style>