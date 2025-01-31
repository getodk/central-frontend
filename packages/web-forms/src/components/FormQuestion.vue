<script setup lang="ts">
import type {
	AnyControlNode,
	AnyInputNode,
	AnyNoteNode,
	AnyUnsupportedControlNode,
	SelectNode,
	RankNode,
} from '@getodk/xforms-engine';
import { inject } from 'vue';
import InputControl from './controls/Input/InputControl.vue';
import NoteControl from './controls/NoteControl.vue';
import RangeControl from './controls/Range/RangeControl.vue';
import SelectControl from './controls/SelectControl.vue';
import RankControl from './controls/RankControl.vue';
import TriggerControl from './controls/TriggerControl.vue';
import UnsupportedControl from './controls/UnsupportedControl.vue';

type ControlNode = AnyControlNode | AnyUnsupportedControlNode;

defineProps<{ question: ControlNode }>();

const isInputNode = (node: ControlNode): node is AnyInputNode => node.nodeType === 'input';
const isSelectNode = (node: ControlNode): node is SelectNode => node.nodeType === 'select';
const isRankNode = (node: ControlNode): node is RankNode => node.nodeType === 'rank';
const isNoteNode = (node: ControlNode): node is AnyNoteNode => node.nodeType === 'note';
const isRangeNode = (node: ControlNode) => node.nodeType === 'range';
const isTriggerNode = (node: ControlNode) => node.nodeType === 'trigger';

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
		<InputControl v-if="isInputNode(question)" :node="question" />

		<SelectControl v-else-if="isSelectNode(question)" :question="question" />

		<RankControl v-else-if="isRankNode(question)" :question="question" />

		<NoteControl v-else-if="isNoteNode(question)" :question="question" />

		<RangeControl v-else-if="isRangeNode(question)" :node="question" />

		<TriggerControl v-else-if="isTriggerNode(question)" :question="question" />

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
