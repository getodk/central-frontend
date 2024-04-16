<script setup lang="ts">
import type { AnyLeafNode, GeneralChildNode, GroupNode, RepeatRangeNode } from '@odk-web-forms/xforms-engine';
import FormGroup from './FormGroup.vue';
import FormQuestion from './FormQuestion.vue';
import RepeatRange from './RepeatRange.vue';

defineProps<{ questions: readonly GeneralChildNode[]}>();

const isLeafNode = (n: GeneralChildNode) : n is AnyLeafNode => n.definition.type === 'value-node';
const isGroupNode = (n: GeneralChildNode) : n is GroupNode => n.definition.type === 'subtree';
const isRepeatRangeNode = (n: GeneralChildNode) : n is RepeatRangeNode => n.definition.type === 'repeat-sequence';


</script>

<template>
	<template v-for="question in questions" :key="question.nodeId">
		<template v-if="question.definition.bodyElement && question.currentState.relevant">
			<!-- Render leaf nodes like string, select, etc -->
			<FormQuestion v-if="isLeafNode(question)" :question="question" />
							
			<!-- Render group nodes -->
			<FormGroup v-if="isGroupNode(question)" :question="question" />

			<!-- Render repeat nodes -->
			<RepeatRange v-if="isRepeatRangeNode(question)" :question="question" />
		</template>
	</template>
</template>

