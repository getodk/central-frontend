<script setup lang="ts">
import type { AnyLeafNode } from '@getodk/xforms-engine';
const props = defineProps<{question: AnyLeafNode}>();
</script>

<template>
	<label :for="question.nodeId"><span v-if="question.currentState.required">*</span> {{ props.question.currentState.label?.asString }}</label>
</template>

