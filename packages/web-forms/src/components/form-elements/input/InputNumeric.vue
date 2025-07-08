<script setup lang="ts">
import type { InputNumberInputEvent } from 'primevue/inputnumber';
import InputNumber from 'primevue/inputnumber';
import type { Ref } from 'vue';
import { computed, customRef, inject, ref } from 'vue';

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
}

const props = defineProps<InputNumericProps>();

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
	fractionalDigits = {
		min: 0,
		max: 18,
	};
	inputMode = 'decimal';
} else {
	fractionalDigits = {};
	inputMode = 'numeric';
}

/**
 * Manages component-local state in tandem with the node's state, where:
 *
 * - If `min`/`max` are specified, the value is clamped to those prop values
 * - If assigning node state fails, local state is rolled back to the previous
 *   state
 *
 * In either case, if the value assigned from the input's event handlers (or
 * `v-model`) differs from the value which will become effective (whether
 * clamped or rolled back), **local state** assignment is performed in two
 * stages:
 *
 * 1. The value is first assigned the _invalid value_ (reflecting the input's
 *    current DOM state).
 * 2. On the next event loop tick, the value is then assigned the effective
 *    value.
 *
 * This must be performed in two ticks to ensure PrimeVue's management of the
 * DOM state reflects the effective state (otherwise the second assignment is
 * lost!).
 */
const modelValue = customRef<number | null>(() => {
	const internalValue = ref(props.numericValue);

	const setValidValue = (initialValue: number | null, validValue: number | null) => {
		internalValue.value = initialValue;

		if (validValue !== initialValue) {
			queueMicrotask(() => {
				internalValue.value = validValue;
			});
		}
	};

	return {
		get: () => {
			return internalValue.value;
		},
		set: (assignedValue) => {
			let newValue = assignedValue;

			if (newValue != null) {
				const { min = newValue, max = newValue } = props;

				if (min !== newValue || max !== newValue) {
					newValue = Math.max(min, Math.min(newValue, max));
				}
			}

			try {
				props.setNumericValue(newValue);
				setValidValue(assignedValue, newValue);
			} catch {
				const previousValue = internalValue.value;

				setValidValue(newValue, previousValue);
			}
		},
	};
});

const injectRef = <T,>(name: string, defaultValue?: T): Ref<T> => {
	const missingRef = computed((): T => {
		if (defaultValue == null) {
			throw new Error(`Expected injected ref for ${name}`);
		}

		return defaultValue;
	});

	return inject<Ref<T>>(name, missingRef);
};

const doneAnswering = injectRef<boolean>('doneAnswering');
const submitPressed = inject<boolean>('submitPressed');
const isInvalid = inject<boolean>('isInvalid');

const onInput = (event: InputNumberInputEvent) => {
	doneAnswering.value = false;

	const { value = null } = event;

	if (value == null || value === '') {
		// props.setNumericValue(null);
		modelValue.value = null;
	} else if (typeof value === 'number') {
		modelValue.value = value;
	} else {
		// TODO: the types suggest this may be a string, but it's not clear how or
		// why that would ever happen!
	}
};
</script>

<template>
	<InputNumber
		:id="node.nodeId"
		v-model="modelValue"
		:required="node.currentState.required"
		:disabled="node.currentState.readonly"
		:class="{'inside-highlighted': isInvalid && submitPressed}"
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
		@blur="doneAnswering = true"
	/>
</template>

<style scoped lang="scss">
// These styles are largely intended to override some of the least appealing
// visual design of PrimeVue 3's Material theme for numeric inputs, preferring
// styles closer to the much nicer looking Aura default. The main deviations
// from Aura are consistent input size with the rest of the Material theme and a
// default background color for the increment/decrement buttons.

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
