<script setup lang="ts">
import type { AnyControlNode as QuestionNode, SelectNode, StringNode } from '@getodk/xforms-engine';
import InputText from './controls/InputText.vue';
import SelectControl from './controls/SelectControl.vue';
import UnsupportedControl from './controls/UnsupportedControl.vue';

defineProps<{question: QuestionNode}>();

const isStringNode = (n: QuestionNode): n is StringNode => n.nodeType === 'string';
const isSelectNode = (n: QuestionNode): n is SelectNode => n.nodeType === 'select';


</script>

<template>
	<div :id="question.nodeId + '_container'" class="question-container" :class="{ invalid: question.validationState.violation?.valid === false}">
		<InputText v-if="isStringNode(question)" :question="question" />

		<SelectControl v-else-if="isSelectNode(question)" :question="question" />

		<UnsupportedControl v-else :question="question" />
		
		<div class="validation-placeholder">
			<span class="validation-message">
				{{ question.validationState.violation?.message.asString }}
			</span>
		</div>
	</div>
</template>

<style scoped lang="scss">

.question-container {
	display: flex;
	flex-direction: column;
	padding: 0.5rem 1rem 0 1rem;
	scroll-margin-top: 60px;
}

.validation-placeholder{
	height: 2rem;

	.validation-message {
		display: none;
		color: var(--error-text-color);
		margin-top: 0.5rem;
	}
}

.invalid:has(.dirty) {	
	.validation-message {
		display: block;
	}
}

:global(.odk-form.submit-pressed .invalid){
	background-color: var(--error-bg-color);
	border-radius: 10px;
}

:global(.odk-form.submit-pressed .invalid .validation-message){
	display: block;
}
</style>