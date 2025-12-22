<script setup lang="ts">
import MarkdownBlock from '@/components/common/MarkdownBlock.vue';
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
import { computed } from 'vue';
const props = defineProps<{ question: QuestionNode }>();

const label = computed(() => props.question.currentState.hint?.formatted);
</script>

<template>
	<div v-if="question.currentState.hint" class="hint">
		<MarkdownBlock v-for="elem in label" :key="elem.id" :elem="elem" />
	</div>
</template>

<style scoped lang="scss">
.hint {
	font-size: var(--odk-hint-font-size);
	font-weight: 300;
	color: var(--odk-muted-text-color);
	margin: 4px 0 10px 0;
	line-height: calc(var(--odk-hint-font-size) * 1.45);
	word-wrap: break-word;
	white-space: pre-wrap;
}
</style>
