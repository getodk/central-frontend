<script setup lang="ts">
import type { GroupNode } from '@odk-web-forms/xforms-engine';
import OdkPanel from './OdkPanel.vue';
import OdkQuestionList from './OdkQuestionList.vue';

defineProps<{ question: GroupNode }>();


</script>

<template>
	<OdkPanel :title="question.currentState.label?.asString" :no-ui="!question.currentState.label" class="group">
		<OdkQuestionList :questions="question.currentState.children" />
	</OdkPanel>
</template>

