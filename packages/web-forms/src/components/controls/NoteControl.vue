<script setup lang="ts">
import type { NoteNode } from '@getodk/xforms-engine';
import ControlHint from '../ControlHint.vue';
import ControlLabel from '../ControlLabel.vue';

defineProps<{question: NoteNode}>();
</script>

<template>
	<div class="note-control">
		<ControlLabel :question="question" />
		<ControlHint :question="question" />

		<div v-if="question.currentState.value" class="note-value">
			{{ question.currentState.value }}
		</div>
	</div>
</template>
