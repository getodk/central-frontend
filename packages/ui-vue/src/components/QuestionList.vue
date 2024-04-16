<script setup lang="ts">
import type { AnyLeafNode, GeneralChildNode, GroupNode, RepeatRangeNode } from '@odk-web-forms/xforms-engine';
import FormGroup from './FormGroup.vue';
import FormQuestion from './FormQuestion.vue';
import RepeatRange from './RepeatRange.vue';

defineProps<{ nodes: readonly GeneralChildNode[]}>();

const isLeafNode = (n: GeneralChildNode) : n is AnyLeafNode => n.definition.type === 'value-node';
const isGroupNode = (n: GeneralChildNode) : n is GroupNode => n.definition.type === 'subtree';
const isRepeatRangeNode = (n: GeneralChildNode) : n is RepeatRangeNode => n.definition.type === 'repeat-sequence';


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

