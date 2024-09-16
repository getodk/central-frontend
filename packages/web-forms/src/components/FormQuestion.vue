<script setup lang="ts">
import type {
	AnyControlNode,
	AnyUnsupportedControlNode,
	NoteNode,
	SelectNode,
	StringNode,
} from '@getodk/xforms-engine';
import { inject } from 'vue';
import InputText from './controls/InputText.vue';
import NoteControl from './controls/NoteControl.vue';
import SelectControl from './controls/SelectControl.vue';
import UnsupportedControl from './controls/UnsupportedControl.vue';

type ControlNode = AnyControlNode | AnyUnsupportedControlNode;

defineProps<{ question: ControlNode }>();

const isStringNode = (n: ControlNode): n is StringNode => n.nodeType === 'string';
const isSelectNode = (n: ControlNode): n is SelectNode => n.nodeType === 'select';
const isNoteNode = (n: ControlNode): n is NoteNode => n.nodeType === 'note';

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

		<NoteControl v-else-if="isNoteNode(question)" :question="question" />

		<UnsupportedControl v-else :question="question" />
	</div>
</template>

<style scoped lang="scss">
.question-container {
	display: flex;
	flex-direction: column;
	padding: 0.5rem 1rem;
	scroll-margin-top: 4rem;
	border-radius: 10px;

	&.highlight {
		background-color: var(--error-bg-color);
	}
}

:global(.p-panel-content .question-container) {
	// Accommodates the spacing for validation background of questions inside groups/repeat
	margin-left: -1rem;
}
</style>
