<script setup lang="ts">
import type { DecimalInputNode } from '@getodk/xforms-engine';
import InputText from 'primevue/inputtext';
import { type ComponentPublicInstance, computed, nextTick, ref, watch } from 'vue';

const MAX_CHARACTERS = 15;

interface InputDecimalProps {
	readonly node: DecimalInputNode;
}

const props = defineProps<InputDecimalProps>();
/*
const POLISH_FORMATTER_FOR_TESTING = new Intl.NumberFormat('pl', {
	maximumFractionDigits: MAX_CHARACTERS - 2,
	useGrouping: props.node.appearances['thousands-sep']
});
*/

const renderKey = ref(1);
const inputRef = ref<ComponentPublicInstance | null>(null);
const formatter = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: MAX_CHARACTERS - 2,
	useGrouping: props.node.appearances['thousands-sep']
});

type NumberParser = (input: string) => string;

const standardizeSeparators: NumberParser = (() => {
	const parts = formatter.formatToParts(1.1);
	const decimalSeparator = parts.find(part => part.type === 'decimal')?.value ?? '.';
	if (decimalSeparator === '.') {
		return ((value: string) => value.replaceAll(',', ''));
	}
	return (value: string) => value.replaceAll('.', '').replaceAll(',', '.');
})();

const modelValue = computed<string>({
	get: () => {
		const val = props.node.currentState.value;
		if (val) {
			return formatter.format(val);
		}
		return '';
	},
	set: (assignedValue:string) => {
		if (!assignedValue.length) {
			props.node.setValue(null);
			errors = 'setting value: ' + assignedValue + ' => null';
			return;
		}
		const stringValue = standardizeSeparators(assignedValue);
		if (stringValue.length > MAX_CHARACTERS) {
			errors = 'too long: ' + stringValue;
			renderKey.value++;
			return;
		}
		try {
			const num = Number(stringValue);
			if (Number.isNaN(num)) {
				errors = 'could not parse: ' + stringValue;
				renderKey.value++;
			} else {
				errors = 'setting value: ' + assignedValue + ' => ' + num;
				props.node.setValue(num);
				// renderKey.value++;
			}
		} catch (e) {
			// Re-render to restore previous value if something fails
			errors = 'could not parse: ' + (e as Error).message;
			renderKey.value++;
		}
	}
});

let errors = 'none';

watch(renderKey, () => nextTick(() => (inputRef.value?.$el as HTMLElement)?.focus()));

</script>

<template>
	<InputText
		:key="renderKey"
		ref="inputRef"
		v-model="modelValue"
		inputmode="decimal"
	/>

	<div>{{ errors }}</div> <!-- TODO remove - used for testing on mobile -->
</template>
