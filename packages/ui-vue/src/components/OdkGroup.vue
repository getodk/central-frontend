<template>
	<!-- TODO/sk: maybe pass label instead of asString
			 asString can be computed as empty string which 
			 will remove the UI Panel

			 or have a separate prop to decide UI Panel render
	-->
	<OdkPanel :title="question.currentState.label?.asString" :no-ui="!question.currentState.label">
		<OdkQuestionList :questions="question.currentState.children" />
	</OdkPanel>
</template>

<script setup lang="ts">
import type { GroupNode } from '@odk-web-forms/xforms-engine';
import OdkPanel from './OdkPanel.vue';
import OdkQuestionList from './OdkQuestionList.vue';

defineProps<{ question: GroupNode }>();


</script>

<style scoped>

</style>