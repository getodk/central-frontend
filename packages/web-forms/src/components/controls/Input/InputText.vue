<script setup lang="ts">
import type { StringInputNode, TemporaryStringValueInputNode } from '@getodk/xforms-engine';
import InputText from 'primevue/inputtext';
import { computed, inject } from 'vue';

// prettier-ignore
type TextInputNode =
	| StringInputNode
	| TemporaryStringValueInputNode;

interface InputTextProps {
	readonly node: TextInputNode;
}

const props = defineProps<InputTextProps>();

const setValue = (value = '') => {
	props.node.setValue(value);
};

const doneAnswering = inject<boolean>('doneAnswering');
const submitPressed = inject<boolean>('submitPressed');
const invalid = computed(() => props.node.validationState.violation?.valid === false);
</script>

<template>
	<InputText
		:id="node.nodeId"
		:required="node.currentState.required"
		:disabled="node.currentState.readonly"
		:class="{'inside-highlighted': invalid && submitPressed}"
		:model-value="node.currentState.value"
		@update:model-value="setValue"
		@input="doneAnswering = false"
		@blur="doneAnswering = true"
	/>
</template>

<style scoped>
.p-inputtext {
	width: 100%;
}
</style>
