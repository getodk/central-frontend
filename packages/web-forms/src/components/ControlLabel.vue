<script setup lang="ts">
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
const props = defineProps<{ question: QuestionNode }>();
</script>

<template>
	<label :for="question.nodeId">
		<span v-if="question.currentState.required" class="required">* </span>
		<span>{{ props.question.currentState.label?.asString }}</span>
	</label>
</template>

<style scoped lang="scss">
label {
	font-weight: 400;
	line-height: 1.8rem;

	.required {
		color: var(--error-text-color);
	}
}
</style>
