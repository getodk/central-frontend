<template>
	<div class="flex flex-column gap-2">
		<!-- TODO/sk: Label should be read from question.currentState.label?.asString only -->
		<label :for="'node'+question.nodeId"><span v-if="question.currentState.required">*</span> {{ label }}</label>
		<InputText :id="'node'+question.nodeId" :required="question.currentState.required" variant="filled" />
	</div>
</template>

<script setup lang="ts">
import type { AnyLeafNode } from '@odk-web-forms/xforms-engine';
import InputText from 'primevue/inputtext';
import { computed } from 'vue';

const props = defineProps<{question: AnyLeafNode}>();

const label = computed(() => {
	return props.question.currentState.label?.asString || props.question.definition.bodyElement?.label?.children[0].stringValue || props.question.currentState.reference
});
</script>

<style scoped>

</style>