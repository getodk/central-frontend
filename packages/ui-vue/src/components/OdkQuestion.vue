<!-- this renders all the leaf nodes -->

<template>
	<div class="flex flex-column gap-2">
		<label :for="'node'+question.nodeId"><span v-if="question.currentState.required">*</span> {{ label }}</label>
		<!-- <div>
			{{ question.currentState.label.asString }}
		</div> -->
		<InputText :id="'node'+question.nodeId" :required="question.currentState.required" variant="filled" :readonly="question.currentState.readonly" :value="question.currentState.value" @input="setValue" />
	</div>
</template>

<script setup lang="ts">
import type { AnyLeafNode, StringNode } from '@odk-web-forms/xforms-engine';
import InputText from 'primevue/inputtext';
import { computed } from 'vue';

const props = defineProps<{question: AnyLeafNode}>();

// TODO/sk: Label should be read from question.currentState.label?.asString only
const label = computed(() => {
	console.log(props.question.currentState.label);
	return props.question.currentState.label?.asString 
		|| props.question.definition.bodyElement?.label?.children[0].stringValue 
		|| props.question.currentState.reference
});

const setValue = (e:any) => {
	(props.question as StringNode).setValue(e.target.value);
}
</script>

<style>
input:read-only{
	cursor: not-allowed;
}
</style>