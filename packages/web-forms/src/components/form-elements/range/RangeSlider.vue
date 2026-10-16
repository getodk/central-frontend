<script setup lang="ts">
import type {
	RangeScale,
	RangeTick,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import {
	getNearestStepDistance,
	getRangeRatio,
	getRangeStart,
	getRangeValueAfterSteps,
	getRangeValueAtRatio,
	TRACK_START,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import { computed, useTemplateRef } from 'vue';

const props = defineProps<{
	readonly id: string;
	readonly scale: RangeScale;
	readonly orientation: 'horizontal' | 'vertical';
	readonly ticks: readonly RangeTick[];
	readonly disabled: boolean;
	readonly modelValue: number | undefined;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const trackElement = useTemplateRef<HTMLElement>('track');

const hasValue = computed(() => props.modelValue != null);
const ratio = computed(() => props.modelValue == null ? TRACK_START : getRangeRatio(props.scale, props.modelValue));
const valueDistance = computed(() => {
	return props.modelValue == null ? 0 : getNearestStepDistance(props.scale, props.modelValue);
});

const isTickWithinValueDistance = (tick: RangeTick) => hasValue.value && tick.distance <= valueDistance.value;

const changeValue = (value: number) => {
	if (value !== props.modelValue) {
		emit('update:modelValue', value);
	}
};

const changeValueAtPointer = (event: MouseEvent) => {
	const track = trackElement.value;
	if (props.disabled || track == null) {
		return;
	}

	const { left, bottom, width, height } = track.getBoundingClientRect();
	const pointerRatio = props.orientation === 'vertical'
		? (bottom - event.clientY) / height
		: (event.clientX - left) / width;

	const value = getRangeValueAtRatio(props.scale, pointerRatio);
	changeValue(value);
};

const onThumbPointerDown = (event: PointerEvent) => {
	const MAIN_MOUSE_BUTTON = 0;
	if (props.disabled || event.button !== MAIN_MOUSE_BUTTON) {
		return;
	}

	const target = event.currentTarget as HTMLElement;
	target.setPointerCapture(event.pointerId);
	trackElement.value?.focus();
};

const onThumbPointerMove = (event: PointerEvent) => {
	const target = event.currentTarget as HTMLElement;
	const isDragging = target.hasPointerCapture(event.pointerId);
	if (!isDragging) {
		return;
	}

	changeValueAtPointer(event);
};

const moveByStep = (direction: -1 | 1) => {
	if (props.disabled) {
		return;
	}

	const currentValue = props.modelValue ?? getRangeStart(props.scale);
	const nextValue = getRangeValueAfterSteps(props.scale, currentValue, direction);
	changeValue(nextValue);
};

const moveForward = () => moveByStep(1);

const moveBackward = () => moveByStep(-1);
</script>

<template>
	<div
		:id="id"
		ref="track"
		:class="['range-slider', `range-${orientation}`, { 'range-disabled': disabled, 'range-unset': !hasValue }]"
		:style="{ '--range-ratio': ratio }"
		role="slider"
		:tabindex="disabled ? -1 : 0"
		@click="changeValueAtPointer"
		@keydown.up.prevent="moveForward"
		@keydown.right.prevent="moveForward"
		@keydown.down.prevent="moveBackward"
		@keydown.left.prevent="moveBackward"
	>
		<div v-if="hasValue" class="range-fill" />
		<div v-if="ticks.length > 0" class="range-ticks">
			<span
				v-for="tick in ticks"
				:key="tick.distance"
				:class="['range-tick', { 'range-tick-on-fill': isTickWithinValueDistance(tick) }]"
				:style="{ '--tick-ratio': tick.ratio }"
			/>
		</div>
		<div
			v-if="hasValue"
			class="range-thumb"
			@click.stop
			@pointerdown="onThumbPointerDown"
			@pointermove="onThumbPointerMove"
		/>
	</div>
</template>

<style scoped lang="scss">
.range-slider {
	--track-size: 5px;
  --thumb-size: 20px;
	--tick-size: 3px;
	--tick-offset: calc((var(--track-size) - var(--tick-size)) / 2);
	--tick-center: calc(var(--tick-size) / -2);
	--range-position: calc(var(--range-ratio) * 100%);

	position: relative;
	border-radius: calc(var(--track-size) / 2);
	background-color: var(--odk-primary-light-background-color);
	outline: none;
	cursor: pointer;
	// Stops a long press from selecting text or opening the iOS menu.
	-webkit-touch-callout: none;
	// WebKit on iPhone only supports the prefixed property.
	-webkit-user-select: none;
	user-select: none;

	// Increases the hit target.
	&::before {
		content: '';
		position: absolute;
		inset: calc(var(--thumb-size) * -1);
	}

	&.range-horizontal {
		height: var(--track-size);

		.range-fill {
			width: var(--range-position);
			height: 100%;
		}

		.range-thumb {
			top: 50%;
			left: var(--range-position);
			transform: translate(-50%, -50%);
		}

		.range-tick {
			top: var(--tick-offset);
			left: var(--range-position);
			margin-left: var(--tick-center);
		}
	}

	&.range-vertical {
		min-height: 200px;
		width: var(--track-size);

		.range-fill {
			width: 100%;
			height: var(--range-position);
		}

		.range-thumb {
			bottom: var(--range-position);
			left: 50%;
			transform: translate(-50%, 50%);
		}

		.range-tick {
			bottom: var(--range-position);
			left: var(--tick-offset);
			margin-bottom: var(--tick-center);
		}
	}

	&.range-unset:focus-visible,
	&:focus-visible .range-thumb {
		outline: 1px solid var(--odk-primary-border-color);
		outline-offset: 2px;
	}

	&.range-disabled {
		opacity: 0.6;
		pointer-events: none;
	}
}

.range-fill {
	position: absolute;
	bottom: 0;
	left: 0;
	border-radius: inherit;
	background-color: var(--odk-primary-background-color);
}

.range-ticks {
	position: absolute;
	inset: 0;
}

.range-tick {
	--range-position: calc(var(--tick-ratio) * 100%);

	position: absolute;
	width: var(--tick-size);
	height: var(--tick-size);
	border-radius: 50%;
	background-color: var(--odk-primary-background-color);

	&.range-tick-on-fill {
		background-color: var(--odk-primary-light-background-color);
	}

	// Collect shows no tick at the start and the end of the track.
	&:first-child,
	&:last-child {
		visibility: hidden;
	}
}

.range-thumb {
	position: absolute;
	width: var(--thumb-size);
	height: var(--thumb-size);
	border-radius: 50%;
	background-color: var(--odk-primary-background-color);
	box-shadow: 1px 2px 3px 0 rgba(0, 0, 0, 0.2);
	cursor: grab;
	// Stops a touch drag on the thumb from scrolling the page.
	touch-action: none;
	transition: background-color 0.2s;

	// Only show the hover colour with a mouse. On a phone it would stay on after a tap.
	@media (hover: hover) {
		&:hover {
			background-color: var(--odk-primary-hover-background-color);
		}
	}
}
</style>
