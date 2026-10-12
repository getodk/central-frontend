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

const INCOMPLETE_INTEGER_NUMBER_PREFIX = ['-'];
const INCOMPLETE_DECIMAL_NUMBER_PREFIX = [',', '.', '-'];

const props = defineProps<InputNumericProps>();

const renderKey = ref(1);
const inputRef = ref<ComponentPublicInstance | null>(null);
const incompleteNumberPrefix = props.isDecimal ? INCOMPLETE_DECIMAL_NUMBER_PREFIX : INCOMPLETE_INTEGER_NUMBER_PREFIX;
const formatter = new Intl.NumberFormat(undefined, {
	maximumFractionDigits: props.isDecimal ? props.maxCharacters - 2 : 0,
	useGrouping: props.node.appearances['thousands-sep']
});
const inputmode: NumericInputMode = props.isDecimal ? 'decimal' : 'numeric';

type NumberParser = (input: string) => string;

const standardizeSeparators: NumberParser = (() => {
	const parts = formatter.formatToParts(1.1);
	const decimalSeparator = parts.find(part => part.type === 'decimal')?.value ?? '.';
	const groupSeparator = decimalSeparator === '.' ? ',' : '.';
	return (value:string) => {
		value = value.replaceAll(groupSeparator, '');
		if (!props.isDecimal) {
			return value.replace(decimalSeparator, '');
		}
		if (decimalSeparator !== '.') {
			return value.replace(decimalSeparator, '.');
		}
		return value;
	};
})();

const modelValue = computed<string>({
	get: () => {
		const val = props.numericValue;
		if (val != undefined) {
			return formatter.format(val);
		}
		return '';
	},
	set: (assignedValue:string) => {
		if (props.node.currentState.readonly) {
			return;
		}
		if (!assignedValue.length) {
			props.setNumericValue(null);
			return;
		}
		const stringValue = standardizeSeparators(assignedValue).trim();
		if (stringValue.length > props.maxCharacters) {
			renderKey.value++;
			return;
		}
		if (stringValue.length === 1 && incompleteNumberPrefix.includes(stringValue)) {
			// it's too soon to tell if this is a valid number or not
			return;
		}
		let num = Number(stringValue);
		if (Number.isNaN(num)) {
			renderKey.value++;
		} else {
			if (props.max && num > props.max) {
				num = props.max;
			} else if (props.min && num < props.min) {
				num = props.min;
			}

			props.setNumericValue(num);
		}
	}
});

let timer: ReturnType<typeof setTimeout>;

const spin = (amount: number) => {
	if (inputRef.value?.$el && !props.node.currentState.readonly) {
		const num = props.numericValue ?? 0;
		if (props.isDecimal) {
			const str = num.toString();
			const parts = str.split('.');
			const int = Number(parts[0]) + amount;
			if (parts.length === 2) {
				modelValue.value = int + '.' + parts[1]!;
			} else {
				modelValue.value = int.toString();
			}
		} else {
			const int = num + amount;
			modelValue.value = int.toString();
		}
	}
}

const repeat = (interval: number, amount: number) => {
	clearTimer();
	timer = setTimeout(() => {
		repeat(40, amount);
	}, interval);
	spin(amount);
};

const add = (event: MouseEvent, amount: number) => {
	repeat(500, amount);
	event.preventDefault();
};

const increment = (event: MouseEvent) => {
	add(event, 1);
};

const decrement = (event: MouseEvent) => {
	add(event, -1);
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
