<!-- this renders all the leaf nodes -->

<template>
	<div class="flex flex-column gap-2">
		<InputText v-if="isStringNode(question)" :question="question" />

		<UnsupportedControl v-if="isUnsupportedNode(question)" :question="question" />
	</div>
</template>

<script setup lang="ts">
import type { AnyLeafNode, StringNode } from '@odk-web-forms/xforms-engine';
import InputText from './controls/InputText.vue';
import UnsupportedControl from './controls/UnsupportedControl.vue';

const supportedNodeTypes = ['string'];

const props = defineProps<{question: AnyLeafNode}>();

const isStringNode = (n: AnyLeafNode) : n is StringNode => n.nodeType === 'string';

const isUnsupportedNode = (n: AnyLeafNode): n is AnyLeafNode => !supportedNodeTypes.includes(props.question.nodeType);


</script>

<style>
input:read-only {
	cursor: not-allowed;
}
</style>