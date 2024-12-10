<script setup lang="ts">
import type { IntInputNode } from '@getodk/xforms-engine';
import { computed } from 'vue';
import InputNumeric from './InputNumeric.vue';

interface InputIntProps {
	readonly node: IntInputNode;
}

const props = defineProps<InputIntProps>();

const numericValue = computed((): number | null => {
	const { value } = props.node.currentState;

	if (value == null) {
		return null;
	}

	return Number(value);
});

const setNumberValue = (value: number | null): void => {
	props.node.setValue(value);
};
</script>

<template>
	<InputNumeric
		:node="node"
		:numeric-value="numericValue"
		:set-numeric-value="setNumberValue"
	/>
</template>
