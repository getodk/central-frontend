<script setup lang="ts">
import type { AnyControlNode, SelectNode, StringNode } from '@getodk/xforms-engine';
import { inject } from 'vue';
import InputText from './controls/InputText.vue';
import SelectControl from './controls/SelectControl.vue';
import UnsupportedControl from './controls/UnsupportedControl.vue';

defineProps<{question: AnyControlNode}>();

const isStringNode = (n: AnyControlNode): n is StringNode => n.nodeType === 'string';
const isSelectNode = (n: AnyControlNode): n is SelectNode => n.nodeType === 'select';

const submitPressed = inject('submitPressed');
</script>

<template>
	<div
		:id="question.nodeId + '_container'" 
		:class="{
			'question-container': true,
			'highlight': submitPressed && question.validationState.violation?.valid === false,
		}"
	>
		<InputText v-if="isStringNode(question)" :question="question" />

		<SelectControl v-else-if="isSelectNode(question)" :question="question" />

		<UnsupportedControl v-else :question="question" />
	</div>
</template>

<style scoped lang="scss">

.question-container {
	display: flex;
	flex-direction: column;
	padding: 0.5rem 1rem 0 1rem;
	scroll-margin-top: 4rem;
	border-radius: 10px;	

	&.highlight {
		background-color: var(--error-bg-color);
	}
}

:global(.p-panel-content .question-container) {
	padding-left: 0;
}


</style>