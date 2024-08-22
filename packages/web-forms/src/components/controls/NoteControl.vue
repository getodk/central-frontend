<script setup lang="ts">
import type { NoteNode } from '@getodk/xforms-engine';
import ControlText from '../ControlText.vue';

defineProps<{question: NoteNode}>();
</script>

<template>
	<div class="note-control">
		<ControlText :question="question" />

		<div v-if="question.currentState.value" class="note-value">
			{{ question.currentState.value }}
		</div>
	</div>
</template>

<style scoped lang="scss">
	:deep(.control-text) {
		margin-bottom: 0;
	}
</style>
