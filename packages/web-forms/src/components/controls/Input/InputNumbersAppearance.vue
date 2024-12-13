<script setup lang="ts">
import type { StringInputNode } from '@getodk/xforms-engine';
import { computed } from 'vue';
import InputNumeric from './InputNumeric.vue';

interface InputNumbersAppearanceProps {
	readonly node: StringInputNode;
}

const props = defineProps<InputNumbersAppearanceProps>();

const numericValue = computed((): number | null => {
	const { value } = props.node.currentState;

	if (value == '') {
		return null;
	}

	const result = Number(value);

	if (!Number.isFinite(result)) {
		return null;
	}

	return result;
});

const setNumberValue = (value: number | null): void => {
	props.node.setValue(String(value));
};
</script>

<template>
	<InputNumeric
		:node="node"
		:numeric-value="numericValue"
		:set-numeric-value="setNumberValue"
		:is-decimal="true"
	/>
</template>
