<script setup lang="ts">
import type { InputNumberInputEvent } from 'primevue/inputnumber';
import InputNumber from 'primevue/inputnumber';
import { type ComponentPublicInstance, nextTick, watch } from 'vue';
import { customRef, ref } from 'vue';

interface NumericNodeState {
	get required(): boolean;
	get readonly(): boolean;
}

interface NumericNodeAppearances {
	readonly 'thousands-sep'?: boolean;
}

interface NumericNode {
	readonly nodeId: string;
	readonly currentState: NumericNodeState;
	readonly appearances: NumericNodeAppearances;
}

interface InputNumericProps {
	readonly node: NumericNode;
	readonly numericValue: number | null;
	readonly setNumericValue: (value: number | null) => void;
	readonly isDecimal?: boolean;
	readonly min?: number;
	readonly max?: number;
	readonly maxCharacters: number;
}

const props = defineProps<InputNumericProps>();
const inputRef = ref<ComponentPublicInstance | null>(null);
const renderKey = ref(1);

interface FractionalDigitOptions {
	readonly min?: number;
	readonly max?: number;
}

let fractionalDigits: FractionalDigitOptions;

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode}
 */
type NumericInputMode = 'decimal' | 'numeric';

let inputMode: NumericInputMode;

if (props.isDecimal) {
	fractionalDigits = { min: 0, max: 13 };
	inputMode = 'decimal';
} else {
	fractionalDigits = { min: 0, max: 0 };
	inputMode = 'numeric';
}

/**
 * Tracks local model state while syncing with the node’s state.
 *
 * - Enforces `min`/`max` constraints if provided.
 * - Rolls back to the previous value if assignment fails.
 * - If the assigned value differs from the effective value (due to clamping or rollback),
 *   triggers a re-render via `renderKey` to update the displayed value.
 */
const modelValue = customRef<number | null>(() => {
	const internalValue = ref(props.numericValue);
	return {
		get: () => internalValue.value,
		set: (assignedValue) => {
			const currentValue = internalValue.value;
			const stringValue = assignedValue != null ? assignedValue.toString() : '';
			let newValue = stringValue.length <= props.maxCharacters ? assignedValue : currentValue;

			if (newValue != null) {
				const { min = newValue, max = newValue } = props;

				if (min !== newValue || max !== newValue) {
					newValue = Math.max(min, Math.min(newValue, max));
				}
			}

			try {
				props.setNumericValue(newValue);
				internalValue.value = newValue;
				if (newValue !== assignedValue) {
					// Re-render if value is clamped
					renderKey.value++;
				}
			} catch {
				internalValue.value = currentValue;
				// Re-render to restore previous value if something fails
				renderKey.value++;
			}
		},
	};
});

// After re-render, refocus input so user can continue typing seamlessly
watch(renderKey, () => nextTick(() => (inputRef.value?.$el as HTMLElement)?.focus()));

const onInput = (event: InputNumberInputEvent) => {
	const { value = null } = event;
	if (value == null || value === '') {
		modelValue.value = null;
		return;
	}

	if (typeof value === 'number') {
		modelValue.value = value;
		return;
	}
};
</script>

<template>
	<InputNumber
		:id="node.nodeId"
		:key="renderKey"
		ref="inputRef"
		v-model="modelValue"
		:required="node.currentState.required"
		:disabled="node.currentState.readonly"
		:show-buttons="true"
		:min-fraction-digits="fractionalDigits.min"
		:max-fraction-digits="fractionalDigits.max"
		:use-grouping="node.appearances['thousands-sep']"
		:pt="{
			input: {
				root: { inputMode }
			}
		}"
		@input="onInput"
	/>
</template>

<style scoped lang="scss">
// Overrides PrimeVue styles to adhere to Web Forms design.

.p-inputnumber {
	position: relative;

	:deep(.p-inputtext) {
		border-radius: var(--odk-radius);
	}
}

:deep(.p-inputnumber-button-group) {
	position: absolute;
	top: 2px;
	right: 2px;
	height: calc(100% - 4px);
}

:deep(.p-inputnumber-button-group .p-button) {
	--numeric-control-color: var(--input-color);
	--numeric-control-bgcolor: var(--input-bgcolor-default);

	&,
	&:hover,
	&:focus {
		color: var(--numeric-control-color);
		background-color: var(--numeric-control-bgcolor);
	}

	&:hover,
	&:focus {
		--numeric-control-bgcolor: var(--input-bgcolor-emphasized);
	}
}
</style>
