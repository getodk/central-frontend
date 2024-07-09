<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import Select1Control from './Select1Control.vue';
import SelectNControl from './SelectNControl.vue';

defineProps<{question: SelectNode}>();
</script>

<template>
	<Select1Control v-if="question.definition.bodyElement.type === 'select1'" :question="question" />

	<SelectNControl v-else-if="question.definition.bodyElement.type === 'select'" :question="question" />
</template>
