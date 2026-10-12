<script lang="ts" setup>
import MarkdownBlock from '@getodk/web-forms/components/common/MarkdownBlock.vue';
import ControlText from '@getodk/web-forms/components/form-elements/ControlText.vue';
import RangeSlider from '@getodk/web-forms/components/form-elements/range/RangeSlider.vue';
import {
	getRangeScale,
	getRangeTicks,
	placeLabelsOnTicks,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import type { AnyRangeNode } from '@getodk/xforms-engine';
import Rating from 'primevue/rating';
import { computed } from 'vue';

const props = defineProps<{ readonly node: AnyRangeNode }>();

const { bounds } = props.node.definition;
const start = Number(bounds.start);
const end = Number(bounds.end);
const orientation = props.node.appearances.vertical ? 'vertical' : 'horizontal';
const hasTicks = !props.node.appearances['no-ticks'];

const scale = getRangeScale({
	start,
	end,
	step: Number(bounds.step),
	tickInterval: props.node.nodeOptions.tickInterval,
});

const ticks = getRangeTicks(scale);
const tickLabels = computed(() => placeLabelsOnTicks(ticks, props.node.currentState.tickLabels, !hasTicks));

const numberValue = computed(() => {
	const { value } = props.node.currentState;
	if (value == null) {
		return;
	}
	return Number(value);
});

const setValue = (value: number) => props.node.setValue(value);
</script>

<template>
	<ControlText :question="node" />

	<template v-if="node.appearances.rating">
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
				<span v-if="numberValue != null">{{ numberValue }}</span>
			</div>

			<div class="range-track-frame">
				<RangeSlider
					:id="node.nodeId"
					:disabled="node.currentState.readonly"
					:scale="scale"
					:orientation="orientation"
					:ticks="hasTicks ? ticks : []"
					:model-value="numberValue"
					@update:model-value="setValue"
				/>

				<div class="range-bounds">
					<div class="range-bound range-min">
						{{ start }}
					</div>

					<div class="range-bound range-max">
						{{ end }}
					</div>
				</div>

				<div v-if="tickLabels.length > 0" class="range-tick-labels">
					<div
						v-for="{ ratio, label } in tickLabels"
						:key="ratio"
						:class="['range-tick-label', { 'at-start': ratio === 0, 'at-end': ratio === 1 }]"
						:style="{ '--tick-ratio': ratio }"
					>
						<MarkdownBlock v-for="elem in label.formatted" :key="elem.id" :elem="elem" />
					</div>
				</div>
			</div>
		</div>
	</template>
</template>

<style scoped lang="scss">
.range-control-container {
	--track-gap: var(--odk-spacing-xl);
	--label-size: 20%;
	--gutter-width: 3rem;

	position: relative;

	.range-value {
		font-weight: bold;
	}

	.range-bound,
	.range-tick-labels {
		font-size: var(--odk-hint-font-size);
		line-height: 1.2;
	}

	.range-tick-labels {
		overflow-wrap: anywhere;
	}

	&.horizontal {
		padding: 0 var(--odk-spacing-m);

		.range-value {
			min-height: 1lh;
			margin-bottom: 1lh;
			text-align: center;
		}

		.range-bounds {
			display: flex;
			justify-content: space-between;
			margin-top: var(--track-gap);
		}

		// Every label shares the one grid cell, so the row is as tall as the tallest label.
		.range-tick-labels {
			display: grid;
			margin-top: var(--odk-spacing-s);
		}

		.range-tick-label {
			grid-area: 1 / 1;
			width: var(--label-size);
			margin-inline-start: clamp(
				0%,
				calc(var(--tick-ratio) * 100% - var(--label-size) / 2),
				calc(100% - var(--label-size))
			);
			text-align: center;

			&.at-start {
				text-align: start;
			}

			&.at-end {
				text-align: end;
			}
		}
	}

	&.vertical {
		width: fit-content;
		padding: var(--odk-spacing-m) 0 var(--odk-spacing-m) var(--gutter-width);
		margin: 0 auto;

		.range-value {
			display: flex;
			align-items: center;
			position: absolute;
			top: 0;
			bottom: 0;
			right: calc(100% - var(--gutter-width) + var(--track-gap));

			span {
				display: inline-block;
				width: var(--gutter-width);
				text-align: right;
			}
		}

		// The frame is as tall as the track, so bounds and labels are placed against the track ends.
		.range-track-frame {
			display: flex;
			gap: var(--track-gap);
		}

		.range-bounds,
		.range-tick-labels {
			position: relative;
		}

		.range-bound,
		.range-tick-label {
			position: absolute;
			left: 0;
			width: 100%;
			bottom: calc(var(--tick-ratio) * 100%);
			transform: translateY(50%);
		}

		.range-bounds {
			width: 16px;
		}

		.range-min {
			--tick-ratio: 0;
		}

		.range-max {
			--tick-ratio: 1;
		}

		.range-tick-labels {
			width: calc(8rem - var(--track-gap));
		}
	}
}

.p-rating {
	flex-wrap: wrap;
}
</style>
