<!-- this renders all the leaf nodes -->

<template>
	<div class="flex flex-column gap-2">
		<label :for="question.nodeId"><span v-if="question.currentState.required">*</span> {{ props.question.currentState.label?.asString }}</label>
		<InputText 
			:id="question.nodeId" 
			:required="question.currentState.required" 
			:readonly="question.currentState.readonly" 
			:value="question.currentState.value" 
			variant="filled" 
			@input="setValue" 
		/>
	</div>
</template>

<script setup lang="ts">
import type { AnyLeafNode, StringNode } from '@odk-web-forms/xforms-engine';
import InputText from 'primevue/inputtext';

const props = defineProps<{question: AnyLeafNode}>();

const setValue = (e:Event) => {
	(props.question as StringNode).setValue((e.target as HTMLInputElement).value);
}
</script>

<style>
input:read-only{
	cursor: not-allowed;
}
</style>