<script setup lang="ts">
import type { GroupNode } from '@getodk/xforms-engine';
import FormPanel from './FormPanel.vue';
import QuestionList from './QuestionList.vue';

defineProps<{ node: GroupNode }>();


</script>

<template>
	<FormPanel :title="node.currentState.label?.asString" :no-ui="!node.currentState.label" class="group">
		<QuestionList :nodes="node.currentState.children" />
	</FormPanel>
</template>

