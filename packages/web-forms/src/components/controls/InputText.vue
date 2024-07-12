<script setup lang="ts">
import type { StringNode } from '@getodk/xforms-engine';
import InputText from 'primevue/inputtext';
import { ref } from 'vue';
import ControlLabel from '../ControlLabel.vue';

const props = defineProps<{question: StringNode}>();

const setValue = (value = '') => {
	props.question.setValue(value);
};

const isDirty = ref(false);

</script>

<template>
	<ControlLabel :question="question" />

	<div class="textbox-container" :class="{ dirty: isDirty }">
		<InputText
			:id="question.nodeId"
			:required="question.currentState.required" 
			:disabled="question.currentState.readonly"
			variant="filled"
			:model-value="question.currentState.value"			
			@update:model-value="setValue"
			@change="isDirty = true"
		/>
		<i class="icon-error" />
	</div>
</template>

<style scoped lang="scss">
.textbox-container {
	position: relative;
	margin-top: 0.5rem;

	input.p-inputtext {
		width: 100%;
		&:read-only {
			cursor: not-allowed;
		}

		&.p-variant-filled:enabled:focus {
			background-color: var(--surface-100);
		}
	}

	i {
		position: absolute;
		right: 10px;
		top: 15px;
		display: none;
		color: var(--error-text-color);
		font-size: 1.2rem;
	}
}

:global(.odk-form.submit-pressed .invalid .textbox-container i), 
:global(.invalid .dirty .textbox-container i) {
	display: block;
}
</style>