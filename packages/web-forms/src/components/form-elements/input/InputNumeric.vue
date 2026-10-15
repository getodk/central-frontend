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
const keyFilterPattern = new RegExp(`[\\d\\-\\${decimalSeparator}]`);

const standardizeSeparators = (value: string) => {
	value = value.replaceAll(groupSeparator, '');
	if (decimalSeparator !== '.') {
		value = value.replace(decimalSeparator, '.');
	}
	if (!props.isDecimal && value.endsWith(decimalSeparator)) {
		value = value.substring(0, value.length - 1);
	}
	return value;
};

const validityIsUncertain = (value: string) => {
	if (value === '-') {
		return true;
	}
	return props.isDecimal && value.indexOf(decimalSeparator) === value.length - 1;
};

const modelValue = computed<string>({
	get: () => {
		const val = props.numericValue;
		if (val != undefined) {
			return formatter.value.format(val);
		}
		return '';
	},
	set: (assignedValue: string) => {
		if (props.node.currentState.readonly) {
			return;
		}
		assignedValue = assignedValue.trim();
		if (!assignedValue.length) {
			props.setNumericValue(null);
			return;
		}
		if (validityIsUncertain(assignedValue)) {
			// it's too soon to tell if this is a valid number or not
			return;
		}
		const stringValue = standardizeSeparators(assignedValue);
		if (stringValue.length > props.maxCharacters) {
			renderKey.value++;
			return;
		}

		let num = Number(stringValue);
		if (Number.isNaN(num)) {
			renderKey.value++;
			return;
		}

		if (props.max && num > props.max) {
			num = props.max;
		} else if (props.min && num < props.min) {
			num = props.min;
		}
		if (!props.isDecimal) {
			num = Math.round(num);
		}

		props.setNumericValue(num);
		if (!props.isDecimal && formatter.value.format(num) !== assignedValue) {
			renderKey.value++;
		}
	}
});

let timer: ReturnType<typeof setTimeout>;

const setInteger = (num: number, amount: number) => {
	const int = num + amount;
	modelValue.value = int.toString();
};

const setDecimal = (num: number, amount: number) => {
	// need to manually increment the decimal to avoid floating point errors
	const str = num.toString();
	const parts = str.split('.');
	const int = Number(parts[0]);
	if (parts.length === 1) {
		// no decimal component found
		setInteger(int, amount);
		return;
	}
	let updated;
	if (num < 0 && num > -1 && amount === 1) {
		// the '-' sign has been parsed off, so we've already incremented
		updated = int;
	} else if (num > 0 && num < 1 && amount === -1) {
		// going negative - add the prefix
		updated = '-' + int.toString();
	} else {
		updated = int + amount;
	}
	modelValue.value = updated + decimalSeparator + parts[1]!;
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

const increment = (event: MouseEvent) => {
	event.preventDefault();
	repeat(500, 1);
};

const decrement = (event: MouseEvent) => {
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
			v-keyfilter="keyFilterPattern"
			:disabled="node.currentState.readonly"
			:required="node.currentState.required"
			:pt="{ root: { inputmode } }"
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
	display: flex;
	flex-direction: column;
	position: absolute;
	inset-block-start: 1px;
	inset-inline-end: 1px;
	height: calc(100% - 2px);
	z-index: var(--odk-z-index-form-content);
	top: 1px;
	right: 1px;

	button {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
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
		border-start-end-radius: calc(var(--odk-radius) - 1px);
	}
	.decrement {
		border-end-end-radius: calc(var(--odk-radius) - 1px);
	}
}
</style>
