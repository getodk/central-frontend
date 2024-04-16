<template>
	<OdkControlLabel :question="question" />

	<InputText 
		:id="question.nodeId" 
		:required="question.currentState.required" 
		:readonly="question.currentState.readonly" 
		:value="question.currentState.value" 
		variant="filled" 
		@input="setValue" 
	/>
</template>

<script setup lang="ts">
import type { StringNode } from '@odk-web-forms/xforms-engine';
import InputText from 'primevue/inputtext';
import OdkControlLabel from '../OdkControlLabel.vue';

const props = defineProps<{question: StringNode}>();

const setValue = (e:Event) => {
	props.question.setValue((e.target as HTMLInputElement).value);
}

</script>
