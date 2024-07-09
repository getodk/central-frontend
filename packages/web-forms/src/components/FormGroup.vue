<script setup lang="ts">
import type { GroupNode } from '@getodk/xforms-engine';
import { computed } from 'vue';
import FormPanel from './FormPanel.vue';
import QuestionList from './QuestionList.vue';

const props = defineProps<{ node: GroupNode }>();

const classes = ['group'];
if(props.node.appearances['field-list']){
	// classes.push('field-list');
}

const tableLayout = computed(() => {
	return !!props.node.currentState.children.find(c => 
		c.nodeType === "select" && 
		(c.appearances.label || c.appearances['list-nolabel'] || c.appearances.list))
})
</script>

<template>
	<FormPanel :title="node.currentState.label?.asString" :no-ui="!node.currentState.label" :class="classes">
		<div :class="{ 'table-layout': tableLayout }">
			<QuestionList :nodes="node.currentState.children" />
		</div>
	</FormPanel>
</template>


<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

.table-layout {
	width: max-content;
	min-width: 50%;
	display: table;
	max-width: 100%;
}
</style>
