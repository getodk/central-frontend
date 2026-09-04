<script setup lang="ts">
import { QUESTION_HAS_ERROR, SUBMIT_PRESSED, TOUCHED_QUESTIONS } from '@getodk/web-forms/lib/constants/injection-keys.ts';
import { containerId } from '@getodk/web-forms/lib/format/ids.ts';
import type {
	AnyInputNode,
	AnyNoteNode,
	AnyControlNode as ControlNode,
	RankNode,
	SelectNode,
} from '@getodk/xforms-engine';
import { computed, inject, provide, reactive, type Ref, ref, watch } from 'vue';
import InputControl from '@getodk/web-forms/components/form-elements/input/InputControl.vue';
import NoteControl from '../form-elements/NoteControl.vue';
import RangeControl from '@getodk/web-forms/components/form-elements/range/RangeControl.vue';
import RankControl from '../form-elements/RankControl.vue';
import SelectControl from '@getodk/web-forms/components/form-elements/select/SelectControl.vue';
import TriggerControl from '../form-elements/TriggerControl.vue';
import UploadControl from '@getodk/web-forms/components/form-elements/upload/UploadControl.vue';

const props = defineProps<{ question: ControlNode }>();

const isInputNode = (node: ControlNode): node is AnyInputNode => node.nodeType === 'input';
const isSelectNode = (node: ControlNode): node is SelectNode => node.nodeType === 'select';
const isRankNode = (node: ControlNode): node is RankNode => node.nodeType === 'rank';
const isNoteNode = (node: ControlNode): node is AnyNoteNode => node.nodeType === 'note';
const isRangeNode = (node: ControlNode) => node.nodeType === 'range';
const isTriggerNode = (node: ControlNode) => node.nodeType === 'trigger';
const isUploadNode = (node: ControlNode) => node.nodeType === 'upload';

const submitPressed = inject<Ref<boolean>>(SUBMIT_PRESSED, ref(false));

// Shared across the form so the touched state survives page changes that unmount this component.
const touchedQuestions = inject<Set<string>>(TOUCHED_QUESTIONS, () => reactive(new Set<string>()), true);
watch(
	() => props.question.currentState.instanceValue,
	() => touchedQuestions.add(props.question.nodeId)
);

const questionHasError = computed(() => {
	return (
		(touchedQuestions.has(props.question.nodeId) || submitPressed.value) &&
		props.question.validationState.violation?.valid === false
	);
});
provide(QUESTION_HAS_ERROR, questionHasError);
</script>

<template>
	<div
		:id="containerId(question.nodeId)"
		tabindex="-1"
		:class="{
			'question-container': true,
			'highlight': questionHasError,
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
