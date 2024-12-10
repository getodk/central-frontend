<script setup lang="ts">
import type { InputNumberInputEvent } from 'primevue/inputnumber';
import PrimeInputNumber from 'primevue/inputnumber';
import type { Ref } from 'vue';
import { computed, inject, ref, watchEffect } from 'vue';

interface NumericNodeState {
	get required(): boolean;
	get readonly(): boolean;
}

type NumericValueType = 'decimal' | 'int';

interface NumericNode {
	readonly nodeId: string;
	readonly valueType: NumericValueType;
	readonly currentState: NumericNodeState;
}

interface InputNumericProps {
	readonly node: NumericNode;
	readonly numericValue: number | null;
	readonly setNumericValue: (value: number | null) => void;
}

const props = defineProps<InputNumericProps>();

interface FractionalDigitOptions {
	readonly min?: number;
	readonly max?: number;
}

let fractionalDigits: FractionalDigitOptions = {};

if (props.node.valueType === 'decimal') {
	fractionalDigits = {
		min: 0,
		max: 18,
	};
}

const numericValue = ref(props.numericValue);

watchEffect(() => {
	props.setNumericValue(numericValue.value);
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
const submitPressed = injectRef<boolean>('submitPressed');
const isInvalid = injectRef<boolean>('isInvalid');

/**
 * By default, PrimeVue's `InputText` component applies state changes on every
 * value change, i.e. the `input` event. For `InputNumber`, it only applies
 * state changes on increment/decrement (button press, up/down key), but not
 * from typing arbitrary values. Those changes are only applied by a `change`
 * (or perhaps `blur`) event. We do our best here to apply state changes
 * consistently by handling the `input` event directly.
 */
const onInput = (event: InputNumberInputEvent) => {
	doneAnswering.value = false;

	const { value } = event;

	if (value == null || value === '') {
		props.setNumericValue(null);
	} else {
		const numberValue = Number(value);

		if (!Number.isNaN(numberValue)) {
			props.setNumericValue(numberValue);
		}
	}
};
</script>

<template>
	<PrimeInputNumber
		:id="node.nodeId"
		v-model="numericValue"
		:required="node.currentState.required"
		:disabled="node.currentState.readonly"
		:class="{'inside-highlighted': isInvalid && submitPressed}"
		:show-buttons="true"
		:min-fraction-digits="fractionalDigits.min"
		:max-fraction-digits="fractionalDigits.max"
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
		border-radius: 4px;
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
