<script lang="ts" setup>
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';
import {
	getRangeStart,
	getRangeValueAfterSteps,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import { useRangeNode } from '@getodk/web-forms/components/form-elements/range/useRangeNode.ts';
import type { TimerID } from '@getodk/common/types/timers.ts';
import type { AnyRangeNode } from '@getodk/xforms-engine';
import { computed, onBeforeUnmount, useTemplateRef } from 'vue';

const HOLD_DELAY = 500;
const HOLD_INTERVAL = 100;
const MAIN_MOUSE_BUTTON = 0;
const EMPTY_VALUE_MARK = '–';

type StepDirection = -1 | 1;

interface HoldState {
	timerId: TimerID | null;
	lastValue: number | null;
}

const props = defineProps<{ readonly node: AnyRangeNode }>();

const { scale, numberValue, disabled, setValue } = useRangeNode(props.node);
const hold: HoldState = { timerId: null, lastValue: null };
const pickerElement = useTemplateRef<HTMLElement>('picker');

const isEmptyMarkShown = computed(() => numberValue.value == null);
const shownText = computed(() => numberValue.value ?? EMPTY_VALUE_MARK);

// Up direction means a larger number, also on a reversed range. From empty, both chevrons give `start`.
const getValueAfterStep = (direction: StepDirection) => {
	const current = numberValue.value;
	if (current == null) {
		return getRangeStart(scale);
	}

	return getRangeValueAfterSteps(scale, current, direction * scale.direction);
};

const nextUpValue = computed(() => getValueAfterStep(1));
const nextDownValue = computed(() => getValueAfterStep(-1));

const getNextValue = (direction: StepDirection) => {
	return direction === 1 ? nextUpValue.value : nextDownValue.value;
};

const canStepTo = (nextValue: number) => !disabled.value && nextValue !== numberValue.value;

const canStepUp = computed(() => canStepTo(nextUpValue.value));
const canStepDown = computed(() => canStepTo(nextDownValue.value));

const getIconVariant = (enabled: boolean) => (enabled ? 'base' : 'light-muted');

const moveByStep = (direction: StepDirection) => {
	const nextValue = getNextValue(direction);
	if (!canStepTo(nextValue)) {
		return;
	}
	setValue(nextValue);
};

const stepUp = () => moveByStep(1);

const stepDown = () => moveByStep(-1);

const stopHold = () => {
	if (hold.timerId != null) {
		clearTimeout(hold.timerId);
	}

	hold.timerId = null;
	hold.lastValue = null;
};

// Stops when the end is reached, and when the form did not take the last value.
const canRepeatStepTo = (nextValue: number) => {
	return canStepTo(nextValue) && nextValue !== hold.lastValue;
};

const repeatStep = (direction: StepDirection, delay: number) => {
	const nextValue = getNextValue(direction);
	if (!canRepeatStepTo(nextValue)) {
		stopHold();
		return;
	}

	hold.lastValue = nextValue;
	setValue(nextValue);
	hold.timerId = setTimeout(() => repeatStep(direction, HOLD_INTERVAL), delay);
};

const startHold = (event: PointerEvent, direction: StepDirection) => {
	if (disabled.value || event.button !== MAIN_MOUSE_BUTTON) {
		return;
	}

	// Keeps the focus on the picker and stops a long press from selecting text.
	event.preventDefault();
	pickerElement.value?.focus();
	// Only one hold runs at a time. A new press ends the previous one.
	stopHold();

	const target = event.currentTarget as HTMLElement;
	target.setPointerCapture(event.pointerId);
	repeatStep(direction, HOLD_DELAY);
};

const startHoldUp = (event: PointerEvent) => startHold(event, 1);

const startHoldDown = (event: PointerEvent) => startHold(event, -1);

onBeforeUnmount(() => stopHold());
</script>

<template>
	<div
		:id="node.nodeId"
		ref="picker"
		:class="['range-picker', { 'range-disabled': disabled }]"
		role="spinbutton"
		:tabindex="disabled ? -1 : 0"
		@keydown.up.prevent="stepUp"
		@keydown.down.prevent="stepDown"
		@blur="stopHold"
	>
		<button
			type="button"
			tabindex="-1"
			class="range-picker-step range-picker-step-up"
			:disabled="!canStepUp"
			@pointerdown="startHoldUp"
			@lostpointercapture="stopHold"
		>
			<IconSVG name="mdiChevronUp" :variant="getIconVariant(canStepUp)" />
		</button>

		<div :class="['range-picker-value', { 'range-picker-empty': isEmptyMarkShown }]">
			{{ shownText }}
		</div>

		<button
			type="button"
			tabindex="-1"
			class="range-picker-step range-picker-step-down"
			:disabled="!canStepDown"
			@pointerdown="startHoldDown"
			@lostpointercapture="stopHold"
		>
			<IconSVG name="mdiChevronDown" :variant="getIconVariant(canStepDown)" />
		</button>
	</div>
</template>

<style scoped lang="scss">
.range-picker {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--odk-spacing-m);
	width: max-content;
	margin: 0 auto;
	padding: var(--odk-spacing-s);
	border-radius: var(--odk-radius);
	outline: none;
	// Stops a long press from selecting text or opening the iOS menu.
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	user-select: none;

	&:focus-visible {
		outline: 1px solid var(--odk-primary-border-color);
		outline-offset: 2px;
	}

	&.range-disabled {
		opacity: 0.6;
		pointer-events: none;
	}
}

.range-picker-step {
	display: flex;
	padding: var(--odk-spacing-s);
	border: none;
	border-radius: 50%;
	background: none;
	cursor: pointer;
	// Stops a touch hold on the chevron from scrolling the page.
	touch-action: none;

	&:disabled {
		cursor: default;
	}

	@media (hover: hover) {
		&:hover:not(:disabled) {
			background-color: var(--odk-muted-background-color);
		}
	}
}

.range-picker-value {
	font-size: var(--odk-question-font-size);
	text-align: center;

	&.range-picker-empty {
		color: var(--odk-muted-text-color);
	}
}
</style>
