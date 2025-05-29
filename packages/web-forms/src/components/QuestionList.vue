<script setup lang="ts">
import type {
	AnyControlNode as ControlNode,
	GeneralChildNode,
	GroupNode,
	RepeatRangeNode,
} from '@getodk/xforms-engine';
import FormGroup from './FormGroup.vue';
import FormQuestion from './FormQuestion.vue';
import RepeatRange from './RepeatRange.vue';
import ExpectModelNode from './dev-only/ExpectModelNode.vue';

defineProps<{ nodes: readonly GeneralChildNode[] }>();

const isGroupNode = (node: GeneralChildNode): node is GroupNode => {
	return node.nodeType === 'group';
};

type NonGroupNode = Exclude<GeneralChildNode, GroupNode>;

const isRepeatRangeNode = (node: NonGroupNode): node is RepeatRangeNode => {
	return (
		node.nodeType === 'repeat-range:controlled' || node.nodeType === 'repeat-range:uncontrolled'
	);
};

type NonStructuralNode = Exclude<NonGroupNode, RepeatRangeNode>;

const isControlNode = (node: NonStructuralNode): node is ControlNode => {
	const { nodeType } = node;

	return (
		nodeType === 'input' ||
		nodeType === 'note' ||
		nodeType === 'select' ||
		nodeType === 'trigger' ||
		nodeType === 'range' ||
		nodeType === 'rank' ||
		nodeType === 'upload'
	);
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
			<FormQuestion v-else-if="isControlNode(node)" :question="node" />

			<ExpectModelNode v-else :node="node" />
		</template>
	</template>
</template>

