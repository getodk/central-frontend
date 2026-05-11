<script setup lang="ts">
import type { AnyControlNode as QuestionNode } from '@getodk/xforms-engine';
import ControlHint from './ControlHint.vue';
import ControlLabel from './ControlLabel.vue';

defineProps<{ question: QuestionNode }>();
</script>

<template>
	<div class="control-text">
		<ControlLabel :question="question" />
		<ControlHint :question="question" />
	</div>
</template>

<style scoped lang="scss">
.control-text {
	margin-bottom: 0.75rem;
}
</style>
