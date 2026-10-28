<script lang="ts" setup>
import MarkdownBlock from '@getodk/web-forms/components/common/MarkdownBlock.vue';
import RangeSlider from '@getodk/web-forms/components/form-elements/range/RangeSlider.vue';
import {
	getRangeTicks,
	getRangeValueLength,
	placeLabelsOnTicks,
	TRACK_END,
	TRACK_START,
} from '@getodk/web-forms/components/form-elements/range/range-scale.ts';
import { useRangeNode } from '@getodk/web-forms/components/form-elements/range/useRangeNode.ts';
import type { AnyRangeNode } from '@getodk/xforms-engine';
import { computed } from 'vue';

const props = defineProps<{ readonly node: AnyRangeNode }>();

const { bounds, scale, placeholder, numberValue, disabled, setValue } = useRangeNode(props.node);
const orientation = props.node.appearances.vertical ? 'vertical' : 'horizontal';
const isVertical = orientation === 'vertical';
const hasTicks = !props.node.appearances['no-ticks'];

const valueLength = getRangeValueLength(bounds);

const ticks = getRangeTicks(scale);
const labelLayout = computed(() => {
	return placeLabelsOnTicks(ticks, props.node.currentState.tickLabels, !hasTicks);
});

const labelTracks = computed(() => {
	// Vertical rows go from end (top) to start (bottom), so the tracks are reversed and the template
	// counts label lines from the bottom with negative line numbers.
	const tracks = labelLayout.value.trackSizes.map((size) => `minmax(0, ${size}fr)`);
	if (isVertical) {
		tracks.reverse();
	}
	return tracks.join(' ');
});
</script>

<template>
	<div :class="['range-control-container', orientation]" :style="{ '--label-tracks': labelTracks, '--value-length': valueLength }">
		<div class="range-value">
			<span v-if="numberValue != null">{{ numberValue }}</span>
		</div>

		<div class="range-track-frame">
			<RangeSlider
				:id="node.nodeId"
				:disabled="disabled"
				:scale="scale"
				:orientation="orientation"
				:ticks="hasTicks ? ticks : []"
				:model-value="numberValue"
				:placeholder="placeholder"
				@update:model-value="setValue"
			/>

			<div class="range-bounds">
				<div class="range-bound range-min">
					{{ bounds.start }}
				</div>

				<div class="range-bound range-max">
					{{ bounds.end }}
				</div>
			</div>

			<div v-if="labelLayout.labels.length > 0" class="range-tick-labels">
				<div
					v-for="tickLabel in labelLayout.labels"
					:key="tickLabel.ratio"
					:class="[
						'range-tick-label',
						{ 'at-start': tickLabel.ratio === TRACK_START, 'at-end': tickLabel.ratio === TRACK_END },
					]"
					:style="
						isVertical
							? { gridRow: `-${tickLabel.endLine} / -${tickLabel.startLine}` }
							: { gridColumn: `${tickLabel.startLine} / ${tickLabel.endLine}` }
					"
				>
					<MarkdownBlock v-for="elem in tickLabel.label.formatted" :key="elem.id" :elem="elem" />
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.range-control-container {
	--track-gap: var(--odk-spacing-xl);
	--labels-max-width: 50%;

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
			min-height: 2lh;
			text-align: center;
		}

		.range-bounds {
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
			min-height: 2lh;
		}

		// Each label wraps within its own columns, so the row is as tall as the tallest label.
		.range-tick-labels {
			display: grid;
			grid-template-columns: var(--label-tracks);
			margin-top: var(--odk-spacing-s);
		}

		.range-tick-label {
			grid-row: 1;
			text-align: center;

			&.at-start {
				text-align: start;
			}

			&.at-end {
				text-align: end;
			}
		}
	}

	// The columns are the selected value, track, bounds and labels. The rows grow in proportion
	// until every label fits next to its tick.
	&.vertical {
		display: grid;
		grid-template-columns: max-content max-content max-content;
		grid-template-rows: var(--label-tracks);
		grid-auto-columns: fit-content(var(--labels-max-width));
		justify-content: center;
		column-gap: var(--track-gap);
		padding: var(--odk-spacing-m) 0;

		.range-track-frame,
		.range-bounds,
		.range-tick-labels {
			display: contents;
		}

		.range-value {
			grid-area: 1 / 1 / -1;
			justify-self: end;
			align-self: center;
			min-width: calc(var(--value-length) * 1ch);
			text-align: end;
		}

		.range-slider {
			grid-area: 1 / 2 / -1;
		}

		.range-bound {
			grid-area: 1 / 3 / -1;
		}

		.range-tick-label {
			grid-column: 4;
			align-self: center;
		}

		// The end numbers and labels are centered on the end ticks, so they reach half a line past the track.
		.range-max,
		.range-tick-label.at-end {
			align-self: start;
			margin-top: -0.5lh;
		}

		.range-min,
		.range-tick-label.at-start {
			align-self: end;
			margin-bottom: -0.5lh;
		}
	}
}

@media screen and (max-width: #{pf.$sm}) {
	.range-control-container {
		--labels-max-width: 100%;
	}
}
</style>
