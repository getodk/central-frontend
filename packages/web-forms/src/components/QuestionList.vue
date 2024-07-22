<script setup lang="ts">
import type { GeneralChildNode, GroupNode, AnyControlNode as QuestionNode, RepeatRangeNode } from '@getodk/xforms-engine';
import FormGroup from './FormGroup.vue';
import FormQuestion from './FormQuestion.vue';
import RepeatRange from './RepeatRange.vue';

defineProps<{ nodes: readonly GeneralChildNode[]}>();

const isQuestionNode = (node: GeneralChildNode): node is QuestionNode => {
	return node.nodeType === 'string' || node.nodeType === 'select';
};

const isGroupNode = (node: GeneralChildNode): node is GroupNode => {
	return node.nodeType === 'group';
};

const isRepeatRangeNode = (node: GeneralChildNode): node is RepeatRangeNode => {
	return node.nodeType === 'repeat-range';
};
</script>

<template>
	<template v-for="node in nodes" :key="node.nodeId">
		<template v-if="node.currentState.relevant">
			<!-- Render leaf nodes like string, select, etc -->
			<FormQuestion v-if="isQuestionNode(node)" :question="node" />

			<!-- Render group nodes -->
			<FormGroup v-if="isGroupNode(node)" :node="node" />

			<!-- Render repeat nodes -->
			<RepeatRange v-if="isRepeatRangeNode(node)" :node="node" />
		</template>
	</template>
</template>

