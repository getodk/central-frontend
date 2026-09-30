<script setup lang="ts">
import {
	getRangeRatio,
	getRangeValueAfterSteps,
	getRangeValueAtRatio,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import { computed, useTemplateRef } from 'vue';

const FORWARD_KEYS = ['ArrowUp', 'ArrowRight'];
const BACKWARD_KEYS = ['ArrowDown', 'ArrowLeft'];

const props = defineProps<{
	readonly id: string;
	readonly start: number;
	readonly end: number;
	readonly step: number;
	readonly orientation: 'horizontal' | 'vertical';
	readonly disabled: boolean;
	readonly modelValue: number | undefined;
}>();

const emit = defineEmits<{ 'update:modelValue': [value: number] }>();

const trackElement = useTemplateRef<HTMLElement>('track');

const bounds = computed(() => ({ start: props.start, end: props.end, step: props.step }));
const hasValue = computed(() => props.modelValue != null);
const ratio = computed(() => props.modelValue == null ? 0 : getRangeRatio(bounds.value, props.modelValue));

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

	const value = getRangeValueAtRatio(bounds.value, pointerRatio);
	changeValue(value);
};

const onThumbPointerDown = (event: PointerEvent) => {
	const MAIN_MOUSE_BUTTON = 0;
	if (event.button !== MAIN_MOUSE_BUTTON) {
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

const onKeyDown = (event: KeyboardEvent) => {
	if (props.disabled) {
		return;
	}

	const isForward = FORWARD_KEYS.includes(event.key);
	if (isForward || BACKWARD_KEYS.includes(event.key)) {
		event.preventDefault();
		const currentValue = props.modelValue ?? props.start;
		const nextValue = getRangeValueAfterSteps(bounds.value, currentValue, isForward ? 1 : -1);
		changeValue(nextValue);
	}
};
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
		@keydown="onKeyDown"
	>
		<template v-if="hasValue">
			<div class="range-fill" />
			<div
				class="range-thumb"
				@click.stop
				@pointerdown="onThumbPointerDown"
				@pointermove="onThumbPointerMove"
			/>
		</template>
	</div>
</template>

<style scoped lang="scss">
.range-slider {
	--track-size: 4px;
	--thumb-size: 20px;
	--range-position: calc(var(--range-ratio) * 100%);

	position: relative;
	border-radius: calc(var(--track-size) / 2);
	background-color: var(--odk-primary-light-background-color);
	outline: none;

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
	}

	&.range-vertical {
		height: 200px;
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
	}

	&.range-unset:focus,
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
	// WebKit on iPhone only supports the prefixed property.
	-webkit-user-select: none;
	user-select: none;
	transition: background-color 0.2s;

	// Only show the hover colour with a mouse. On a phone it would stay on after a tap.
	@media (hover: hover) {
		&:hover {
			background-color: var(--odk-primary-hover-background-color);
		}
	}
}
</style>
