<template>
	<label :for="question.nodeId"><span v-if="question.currentState.required">*</span> {{ props.question.currentState.label?.asString }}</label>
</template>

<script setup lang="ts">
import type { AnyLeafNode } from '@odk-web-forms/xforms-engine';
const props = defineProps<{question: AnyLeafNode}>();
</script>
