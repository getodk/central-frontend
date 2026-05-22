<script setup lang="ts">
import type { SelectNode } from '@getodk/xforms-engine';
import Select1Control from './Select1Control.vue';
import SelectNControl from './SelectNControl.vue';

interface SelectControlProps {
	readonly question: SelectNode;
}

defineProps<SelectControlProps>();
</script>

<template>
	<Select1Control v-if="question.selectType === 'select1'" :question="question" />

	<SelectNControl v-else-if="question.selectType === 'select'" :question="question" />
</template>
