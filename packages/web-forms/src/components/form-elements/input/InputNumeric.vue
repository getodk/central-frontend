<script setup lang="ts">
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';
import InputText from 'primevue/inputtext';
import { type ComponentPublicInstance, computed, nextTick, ref, watch } from 'vue';

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

type NumericInputMode = 'decimal' | 'numeric';

const props = defineProps<InputNumericProps>();

const preferredLanguages = [...(navigator.languages || []), navigator.language];
const renderKey = ref(1);
const inputRef = ref<ComponentPublicInstance | null>(null);
const inputmode = computed<NumericInputMode>(() => props.isDecimal ? 'decimal' : 'numeric');
const formatter = computed(() => new Intl.NumberFormat(preferredLanguages, {
	maximumFractionDigits: props.isDecimal ? props.maxCharacters - 2 : 0,
	useGrouping: props.node.appearances['thousands-sep']
}));

const decimalSeparator = (() => {
	const parts = new Intl.NumberFormat(preferredLanguages).formatToParts(1.1);
	return parts.find(part => part.type === 'decimal')?.value ?? ',';
})();
const groupSeparator = decimalSeparator === '.' ? ',' : '.';

const KEY_FILTER_PATTERN = /[\d\-,.]/;
const DECIMAL_WITH_TRAILING_ZEROES = decimalSeparator === '.' ? /\.(\d*0+)?$/ : /,(\d*0+)?$/;

const standardizeDecimals = (value: string) => {
	if (decimalSeparator !== '.') {
		value = value.replace(decimalSeparator, '.');
	}
	if (!props.isDecimal && value.endsWith(decimalSeparator)) {
		value = value.substring(0, value.length - 1);
	}
	return value;
};

const temporaryUserInput = ref<string | null>(null);

const clampToRange = (num: number) => {
	if (!props.isDecimal) {
		num = Math.round(num);
	}
	if (props.max != undefined && num > props.max) {
		return props.max;
	}
	if (props.min != undefined && num < props.min) {
		return props.min;
	}
	return num;
};

const resetInput = () => {
	renderKey.value++;
};

const isTooLong = (num: string) => {
	return num.length > props.maxCharacters;
};

const sanitizeInput = (num: string) => {
	num = num.trim().replaceAll(groupSeparator, '');
	if (num === '-') {
		// user has started typing a negative number - let them continue
		temporaryUserInput.value = num;
		return;
	}
	return num;
};

const parseNumber = (input?: string) => {
	if (!input) {
		return;
	}
	const standardized = standardizeDecimals(input);
	const num = Number(standardized);
	if (Number.isNaN(num)) {
		return;
	}
	return clampToRange(num);
};

watch(() => props.numericValue, (value) => {
	if (temporaryUserInput.value == null) {
		return;
	}
	const parsed = parseNumber(sanitizeInput(temporaryUserInput.value));
	if (parsed != value) {
		temporaryUserInput.value = null;
	}
});

const modelValue = computed<string>({
	get: () => {
		if (temporaryUserInput.value != undefined) {
			return temporaryUserInput.value;
		}
		const val = props.numericValue;
		if (val != undefined) {
			return formatter.value.format(val);
		}
		return '';
	},
	set: (assignedValue: string) => {
		temporaryUserInput.value = null;
		if (props.node.currentState.readonly) {
			return;
		}

		const sanitized = sanitizeInput(assignedValue);
		if (!sanitized?.length) {
			props.setNumericValue(null);
			return;
		}
		if (isTooLong(sanitized)) {
			return resetInput();
		}

		const num = parseNumber(sanitized);
		if (num == undefined) {
			return resetInput();
		}

		if (props.isDecimal && DECIMAL_WITH_TRAILING_ZEROES.test(sanitized)) {
			// user has started typing a decimal number
			temporaryUserInput.value = sanitized;
		}

		props.setNumericValue(num);
		if (!props.isDecimal && formatter.value.format(num) !== sanitized) {
			return resetInput();
		}
	}
});

let timer: ReturnType<typeof setTimeout>;

const setInteger = (num: number, amount: number) => {
	const int = num + amount;
	const clamped = clampToRange(int);
	props.setNumericValue(clamped);
};

const setDecimal = (num: number, amount: number) => {
	const parts = num.toString().split('.');
	if (parts.length === 1) {
		// no decimal component found
		setInteger(Number(parts[0]), amount);
		return;
	}
	// need to manually increment the decimal to avoid floating point errors
	const precision = parts[1]!.length;
	const val = num + amount;
	const rounded = val.toFixed(precision);
	const clamped = clampToRange(Number(rounded));
	props.setNumericValue(clamped);
};

const spin = (amount: number) => {
	if (!inputRef.value?.$el || props.node.currentState.readonly) {
		return;
	}
	const num = props.numericValue ?? 0;
	if (props.isDecimal) {
		setDecimal(num, amount);
	} else {
		setInteger(num, amount);
	}
}

const repeat = (interval: number, amount: number) => {
	clearTimer();
	timer = setTimeout(() => {
		repeat(40, amount);
	}, interval);
	spin(amount);
};

const increment = (event: KeyboardEvent | MouseEvent) => {
	event.preventDefault();
	repeat(500, 1);
};

const decrement = (event: KeyboardEvent | MouseEvent) => {
	event.preventDefault();
	repeat(500, -1);
};

const clearTimer = () => {
	if (timer) {
		clearTimeout(timer);
	}
};

watch(renderKey, () => nextTick(() => (inputRef.value?.$el as HTMLElement)?.focus()));
</script>

<template>
	<span class="number-group">
		<InputText
			:id="node.nodeId"
			:key="renderKey"
			ref="inputRef"
			v-model="modelValue"
			v-keyfilter="KEY_FILTER_PATTERN"
			:disabled="node.currentState.readonly"
			:required="node.currentState.required"
			:pt="{ root: { inputmode } }"
			@keydown.up="increment"
			@keydown.down="decrement"
			@keyup.up="clearTimer"
			@keyup.down="clearTimer"
			@blur="clearTimer"
		/>
		<span class="button-group">
			<button
				aria-hidden="true"
				class="increment"
				:disabled="node.currentState.readonly"
				:tabindex="-1"
				type="button"
				@pointerdown="increment"
				@pointerup="clearTimer"
				@pointerleave="clearTimer"
			>
				<IconSVG
					name="mdiChevronUp"
					size="sm"
					variant="light-muted"
				/>
			</button>
			<button
				aria-hidden="true"
				class="decrement"
				:disabled="node.currentState.readonly"
				:tabindex="-1"
				type="button"
				@pointerdown="decrement"
				@pointerup="clearTimer"
				@pointerleave="clearTimer"
			>
				<IconSVG
					name="mdiChevronDown"
					size="sm"
					variant="light-muted"
				/>
			</button>
		</span>
	</span>
</template>

<style scoped lang="scss">

.number-group {
	position: relative;
	display: inline-flex;
	:deep(.p-inputtext) {
		border-radius: var(--odk-radius);
	}
}
.button-group {
	--input-border-width: 1px;

	display: flex;
	flex-direction: column;
	position: absolute;
	height: calc(100% - (var(--input-border-width) * 2));
	z-index: var(--odk-z-index-form-content);
	top: 1px;
	right: 1px;

	button {
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		width: 2.5rem;
		transition: background var(--odk-transition-duration);
		flex: 1 1 auto;
		border: 0 none;
		touch-action: none;
		padding: 0;

		@media (hover: hover) {
			&:hover {
				background: var(--odk-muted-background-color);
			}
		}

		&:disabled {
			cursor: auto;
			&:hover,
			&:active {
				background: none;
			}
		}
	}
	.increment {
		border-start-end-radius: calc(var(--odk-radius) - var(--input-border-width));
	}
	.decrement {
		border-end-end-radius: calc(var(--odk-radius) - var(--input-border-width));
	}
}
</style>
