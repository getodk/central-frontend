<script setup lang="ts">
import type {
	AnyInputNode,
	AnyNoteNode,
	AnyControlNode as ControlNode,
	RankNode,
	SelectNode,
} from '@getodk/xforms-engine';
import { inject } from 'vue';
import InputControl from '@/components/form-elements/input/InputControl.vue';
import NoteControl from '../form-elements/NoteControl.vue';
import RangeControl from '@/components/form-elements/range/RangeControl.vue';
import RankControl from '../form-elements/RankControl.vue';
import SelectControl from '@/components/form-elements/select/SelectControl.vue';
import TriggerControl from '../form-elements/TriggerControl.vue';
import UploadControl from '@/components/form-elements/upload/UploadControl.vue';

defineProps<{ question: ControlNode }>();

const isInputNode = (node: ControlNode): node is AnyInputNode => node.nodeType === 'input';
const isSelectNode = (node: ControlNode): node is SelectNode => node.nodeType === 'select';
const isRankNode = (node: ControlNode): node is RankNode => node.nodeType === 'rank';
const isNoteNode = (node: ControlNode): node is AnyNoteNode => node.nodeType === 'note';
const isRangeNode = (node: ControlNode) => node.nodeType === 'range';
const isTriggerNode = (node: ControlNode) => node.nodeType === 'trigger';
const isUploadNode = (node: ControlNode) => node.nodeType === 'upload';

const submitPressed = inject<boolean>('submitPressed', false);
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

		<UploadControl v-else-if="isUploadNode(question)" :question="question" />

		<NoteControl v-else-if="isNoteNode(question)" :question="question" />

		<RangeControl v-else-if="isRangeNode(question)" :node="question" />

		<TriggerControl v-else-if="isTriggerNode(question)" :question="question" />
	</div>
</template>

<style scoped lang="scss">
.question-container {
	display: flex;
	flex-direction: column;
	padding: 0.5rem 1rem;
	scroll-margin-top: 4rem;
	border-radius: var(--odk-radius);

	&.highlight {
		background-color: var(--odk-error-background-color);
	}
}
</style>
