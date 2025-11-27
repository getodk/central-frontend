<script setup lang="ts">
import InputText from 'primevue/inputtext';
import type { StringInputNode } from '@getodk/xforms-engine';
import { type ComponentPublicInstance, computed, nextTick, ref, watch } from 'vue';

interface InputNumbersAppearanceProps {
	readonly node: StringInputNode;
}

const props = defineProps<InputNumbersAppearanceProps>();
const inputRef = ref<ComponentPublicInstance | null>(null);
const renderKey = ref(1);

const inputValue = computed({
	get() {
		return props.node.currentState.value;
	},
	set(value) {
		/**
		 * With 'thousands-sep' appearance: Formats with thousands separators and
		 * enforces strict numeric rules (e.g., single decimal, no invalid chars) for proper numbers.
		 *
		 * Without: More relaxed filtering, allows multiple dots/commas/minus signs
		 * for non-numeric fields like IDs, phone numbers, etc.
		 */
		const filteredValue = props.node.appearances['thousands-sep']
			? formatThousandsSep(value)
			: value.replace(/[^0-9,.-]/g, '');

		props.node.setValue(filteredValue);

		if (value !== filteredValue) {
			// Re-render to display cleaned value
			renderKey.value++;
		}
	},
});

// After re-render, refocus input so user can continue typing seamlessly
watch(renderKey, () => nextTick(() => (inputRef.value?.$el as HTMLElement)?.focus()));

const formatThousandsSep = (numberString: string) => {
	const parts = new Intl.NumberFormat().formatToParts(1234567.89);
	const thousandSeparator = parts.find((part) => part.type === 'group')?.value ?? ',';
	const decimalSeparator = parts.find((part) => part.type === 'decimal')?.value ?? '.';

	const nonDigitDot = new RegExp(`[^0-9${decimalSeparator}]`, 'g');
	const leadingDots = new RegExp(`^\\${decimalSeparator}+`);
	const extraDots = new RegExp(`(?<=.*\\${decimalSeparator}.*)\\${decimalSeparator}`, 'g');

	const [integerPart = '', decimalPart = ''] = numberString
		.replace(nonDigitDot, '')
		.replace(leadingDots, '')
		.replace(extraDots, '')
		.split(decimalSeparator);

	const formattedInt = [...integerPart]
		.map((digit, i) => {
			const notFirstDigit = i > 0;
			const isSeparatorIndex = (integerPart.length - i) % 3 === 0;
			return notFirstDigit && isSeparatorIndex ? thousandSeparator + digit : digit;
		})
		.join('');

	const sign = numberString.startsWith('-') ? '-' : '';
	const formattedDecimal = numberString.includes(decimalSeparator)
		? decimalSeparator + decimalPart
		: '';
	return `${sign}${formattedInt}${formattedDecimal}`;
};
</script>

<template>
	<InputText
		:id="node.nodeId"
		:key="renderKey"
		ref="inputRef"
		v-model="inputValue"
		:required="node.currentState.required"
		:disabled="node.currentState.readonly"
		inputmode="numeric"
	/>
</template>
