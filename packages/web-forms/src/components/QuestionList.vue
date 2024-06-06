<script setup lang="ts">
import type { AnyLeafNode, GeneralChildNode, GroupNode, RepeatRangeNode, StringNode } from '@getodk/xforms-engine';
import FormGroup from './FormGroup.vue';
import FormQuestion from './FormQuestion.vue';
import RepeatRange from './RepeatRange.vue';

defineProps<{ nodes: readonly GeneralChildNode[]}>();

/**
 * @todo This has been updated to most closely match the expected API use for
 * what was previously expressed. It was not updated to be correct (it should
 * filter out {@link StringNode}s with no body element.) This can be addressed
 * too, but is deferred to keep a lighter touch pending review.
 */
const isLeafNode = (node: GeneralChildNode): node is AnyLeafNode => {
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
		<template v-if="node.definition.bodyElement && node.currentState.relevant">
			<!-- Render leaf nodes like string, select, etc -->
			<FormQuestion v-if="isLeafNode(node)" :question="node" />

			<!-- Render group nodes -->
			<FormGroup v-if="isGroupNode(node)" :node="node" />

			<!-- Render repeat nodes -->
			<RepeatRange v-if="isRepeatRangeNode(node)" :node="node" />
		</template>
	</template>
</template>

