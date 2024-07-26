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
	<div class="flex flex-column gap-2">
		<InputText v-if="isStringNode(question)" :question="question" />

		<SelectControl v-else-if="isSelectNode(question)" :question="question" />

		<UnsupportedControl v-else :question="question" />
	</div>
</template>
