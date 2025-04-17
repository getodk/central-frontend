<script setup lang="ts">
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
defineProps<{ question: QuestionNode }>();
</script>

<template>
	<div v-if="question.currentState.hint" class="hint">
		{{ question.currentState.hint?.asString }}
	</div>
</template>

<style scoped lang="scss">
.hint {
	font-size: var(--odk-hint-font-size);
	font-weight: 300;
	color: var(--odk-muted-text-color);
	margin: 4px 0 10px 0;
	line-height: calc(var(--odk-hint-font-size) * 1.45);
}
</style>
