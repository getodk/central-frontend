<script setup lang="ts">
import type { AnyLeafNode, StringNode } from '@odk-web-forms/xforms-engine';
import InputText from './controls/InputText.vue';
import UnsupportedControl from './controls/UnsupportedControl.vue';

defineProps<{question: AnyLeafNode}>();

const isStringNode = (n: AnyLeafNode) : n is StringNode => n.nodeType === 'string';


</script>

<template>
	<div class="flex flex-column gap-2">
		<InputText v-if="isStringNode(question)" :question="question" />

		<UnsupportedControl v-else :question="question" />
	</div>
</template>

<style>
input:read-only {
	cursor: not-allowed;
}
</style>