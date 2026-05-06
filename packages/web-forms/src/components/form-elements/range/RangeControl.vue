<script lang="ts" setup>
import type { AnyRangeNode } from '@getodk/xforms-engine';
import Rating from 'primevue/rating';
import { computed } from 'vue';
import ControlText from '../ControlText.vue';
import RangeSlider from './RangeSlider.vue';

interface RangeControlProps {
	readonly node: AnyRangeNode;
}

const props = defineProps<RangeControlProps>();

defineEmits(['update:modelValue', 'change']);

const { bounds } = props.node.definition;
const start = Number(bounds.start);
const end = Number(bounds.end);
const step = Number(bounds.step);

const numberValue = computed((): number | undefined => {
	const { value } = props.node.currentState;

	if (value == null) {
		// For some reason, PrimeVue is both strict and wrong about what nullish
		// types it accepts?
		return;
	}

	if (typeof value === 'bigint') {
		return Number(value);
	}

	return value;
});

const setValue = (value: number) => {
	props.node.setValue(value);
};

const orientation = props.node.appearances.vertical ? 'vertical' : 'horizontal';
</script>

<template>
	<ControlText :question="node" />

	<template v-if="props.node.appearances.rating">
		<Rating
			:id="node.nodeId"
			:disabled="node.currentState.readonly"
			:model-value="numberValue"
			:stars="end"
			@update:model-value="setValue"
		/>
	</template>

	<template v-else>
		<div :class="['range-control-container', orientation]">
			<div class="range-value">
				<span>{{ numberValue }}</span>
			</div>
			<div class="range-bound range-min">
				{{ start }}
			</div>
			<RangeSlider
				:id="node.nodeId"
				:disabled="node.currentState.readonly"
				:min="start"
				:max="end"
				:step="step"
				:orientation="orientation"
				:model-value="numberValue"
				@update:model-value="setValue"
			/>
			<div class="range-bound range-max">
				{{ end }}
			</div>
		</div>
	</template>
</template>

<style scoped lang="scss">
// For now, PrimeVue's `Slider` styles are augmented to resemble current MUI
// presentation of the same component.
//
// There are some functional limitations we'll need to address—either by
// extending the base component from PrimeVue, or by shopping around for another
// implementation. Top of mind:
//
// - Ticks are not supported. I spent more time than I'd like on this, but it's
//   non-trivial to integrate with PrimeVue's styling. I backed out due to the
//   complexity.
//
// - Should we flip either of the following in RTL languages?
//
//    - Horizontal direction of the control
//    - Position of labels for vertical appearance
//
// It's also worth considering using the native HTML `<input type="range">`.
// That has built-in support for ticks (via `<datalist>`, see
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range#adding_tick_marks).
//
// The example on that page for labeling ticks may also suggest another way to
// address presentation of the actual value (which would be more mobile-friendly
// as well).

.range-control-container {
	--track-size: 0.25rem;
	--track-value-emphasis: 0.125rem;
	--thumb-size: 1.25rem;
	--tick-size: 0.125rem;
	--gutter-width: 2lh;

	position: relative;

	.range-bound {
		position: absolute;
		line-height: 1;
		font-size: var(--odk-hint-font-size);
		color: var(--odk-muted-text-color);
	}

	.range-value {
		font-weight: bold;
	}

	&.horizontal {
		height: var(--track-size);
		padding: var(--gutter-width) var(--odk-spacing-m);

		.range-bound {
			bottom: 0;
		}

		.range-min {
			left: 0;
		}

		.range-max {
			right: 0;
		}

		.range-value {
			text-align: center;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
		}
	}

	&.vertical {

		width: var(--track-size);
		padding: var(--odk-spacing-m) var(--gutter-width);

		// Vertical appearance is centered. Consistent with
		// https://docs.getodk.org/form-question-types/#vertical-range-widget
		margin: 0 auto;

		.range-bound {
			right: 0;
			width: 1rem;
		}

		.range-min {
			top: 0;
		}

		.range-max {
			bottom: 0;
		}

		.range-value {
			display: flex;
			position: absolute;
			top: 0;
			bottom: 0;
			align-items: center;
			right: var(--gutter-width);
			padding-right: var(--odk-spacing-l);

			span {
				display: inline-block;
				width: var(--gutter-width);
				text-align: right;
			}
		}
	}
}

// = track (full-width; full-height in vertical orientation)
.p-slider {
	background-color: var(--odk-primary-light-background-color);

	&::before { // Increasing range hit target.
		content: "";
		position: absolute;
		top: -10px;
		bottom: -10px;
		left: -10px;
		right: -10px;
	}

	// = emphasized range between `min` and current value
	:deep(.p-slider-range) {
		border-radius: calc((var(--track-size) + var(--track-value-emphasis)) / 2);
	}

	&.p-slider-horizontal {
		height: var(--track-size);
		border-radius: calc(var(--track-size) / 2);

		:deep(.p-slider-range) {
			top: calc(var(--track-value-emphasis) * -0.5);
			height: calc(var(--track-size) + var(--track-value-emphasis));
		}
	}

	&.p-slider-vertical {
		// No idea what this actually should be! I picked a size that "felt right".
		//
		// TODO: if we do want a fixed height, we should account for dynamic
		// viewport height, form header height, any other constraining factors(?)
		height: 12rem;
		width: var(--track-size);
		border-radius: calc(var(--track-size) / 2);

		:deep(.p-slider-range) {
			left: calc(var(--track-value-emphasis) * -0.5);
			width: calc(var(--track-size) + var(--track-value-emphasis));
		}
	}

	// ≈ `<input type="range">` "thumb"
	:deep(.p-slider-handle) {
		// prettier-ignore
		--thumb-shadow:
			0px 3px 1px -2px rgba(0, 0, 0, 0.2),
			0px 2px 2px 0px rgba(0, 0, 0, 0.14),
			0px 1px 5px 0px rgba(0, 0, 0, 0.12);

		width: var(--thumb-size);
		height: var(--thumb-size);
		border-radius: 50%;
		box-shadow: var(--thumb-shadow);

		// No clue why PrimeVue has a default `transform` style to shrink this!
		transform: none;

		z-index: var(--odk-z-index-form-content);
	}
}

.p-rating {
	flex-wrap: wrap;
}
</style>
