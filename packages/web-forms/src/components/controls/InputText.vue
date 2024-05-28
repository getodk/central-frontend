<script setup lang="ts">
import type { StringNode } from '@getodk/xforms-engine';
import InputText from 'primevue/inputtext';
import ControlLabel from '../ControlLabel.vue';

const props = defineProps<{question: StringNode}>();

const setValue = (value = '') => {
	props.question.setValue(value);
};

</script>

<template>
	<ControlLabel :question="question" />

	<InputText
		:id="question.nodeId"
		:required="question.currentState.required"
		:readonly="question.currentState.readonly"
		variant="filled"
		:model-value="question.currentState.value"
		@update:model-value="setValue"
	/>
</template>

