<script setup lang="ts">
import type { GroupNode } from '@odk-web-forms/xforms-engine';
import FormPanel from './FormPanel.vue';
import QuestionList from './QuestionList.vue';

defineProps<{ question: GroupNode }>();


</script>

<template>
	<FormPanel :title="question.currentState.label?.asString" :no-ui="!question.currentState.label" class="group">
		<QuestionList :questions="question.currentState.children" />
	</FormPanel>
</template>

