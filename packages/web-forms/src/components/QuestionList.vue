<script setup lang="ts">
import type {
	GeneralChildNode,
	GroupNode,
	ModelValueNode,
	RepeatRangeNode,
	SubtreeNode,
} from '@getodk/xforms-engine';
import FormGroup from './FormGroup.vue';
import FormQuestion from './FormQuestion.vue';
import RepeatRange from './RepeatRange.vue';

defineProps<{ nodes: readonly GeneralChildNode[] }>();

const isGroupNode = (node: GeneralChildNode): node is GroupNode => {
	return node.nodeType === 'group';
};

const isRepeatRangeNode = (node: GeneralChildNode): node is RepeatRangeNode => {
	return (
		node.nodeType === 'repeat-range:controlled' || node.nodeType === 'repeat-range:uncontrolled'
	);
};

const isModelOnlyNode = (node: GeneralChildNode): node is ModelValueNode | SubtreeNode => {
	return node.nodeType === 'model-value' || node.nodeType === 'subtree';
};
</script>

<template>
	<template v-for="node in nodes" :key="node.nodeId">
		<template v-if="node.currentState.relevant">
			<!-- Render group nodes -->
			<FormGroup v-if="isGroupNode(node)" :node="node" />

			<!-- Render repeat nodes -->
			<RepeatRange v-else-if="isRepeatRangeNode(node)" :node="node" />


			<!-- Render leaf nodes like string, select, etc -->
			<FormQuestion v-else-if="!isModelOnlyNode(node)" :question="node" />
		</template>
	</template>
</template>

