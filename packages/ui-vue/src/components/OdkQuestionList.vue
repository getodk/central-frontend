<template>
	<template v-for="question in questions" :key="question.nodeId">
		<template v-if="question.definition.bodyElement && question.currentState.relevant">
			<!-- Render leaf nodes like string, select, etc -->
			<OdkQuestion v-if="isLeafNode(question)" :question="question" />
							
			<!-- Render group nodes -->
			<OdkGroup v-if="isGroupNode(question)" :question="question" />

			<!-- Render repeat nodes -->
			<OdkRepeat v-if="isRepeatRangeNode(question)" :question="question" />
		</template>
	</template>
</template>

<script setup lang="ts">
import type { AnyLeafNode, GeneralChildNode, GroupNode, RepeatRangeNode } from '@odk-web-forms/xforms-engine';
import OdkGroup from './OdkGroup.vue';
import OdkQuestion from './OdkQuestion.vue';
import OdkRepeat from './OdkRepeat.vue';

defineProps<{ questions: readonly GeneralChildNode[]}>();

const isLeafNode = (n: GeneralChildNode) : n is AnyLeafNode => n.definition.type === 'value-node';
const isGroupNode = (n: GeneralChildNode) : n is GroupNode => n.definition.type === 'subtree';
const isRepeatRangeNode = (n: GeneralChildNode) : n is RepeatRangeNode => n.definition.type === 'repeat-sequence';


</script>

<style scoped>

</style>