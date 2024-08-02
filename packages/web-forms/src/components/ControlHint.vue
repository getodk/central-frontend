<script setup lang="ts">
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
defineProps<{question: QuestionNode}>();
</script>

<template>
	<div v-if="question.currentState.hint" class="hint">
		{{ question.currentState.hint?.asString }}
	</div>
</template>

<style scoped lang="scss">

.hint {
	font-size: 0.85rem;
	color: var(--surface-600);
}

</style>
