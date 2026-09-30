<script lang="ts" setup>
import ControlText from '@getodk/web-forms/components/form-elements/ControlText.vue';
import RangeSlider from '@getodk/web-forms/components/form-elements/range/RangeSlider.vue';
import type { AnyRangeNode } from '@getodk/xforms-engine';
import Rating from 'primevue/rating';
import { computed } from 'vue';

const props = defineProps<{ readonly node: AnyRangeNode }>();

const { bounds } = props.node.definition;
const start = Number(bounds.start);
const end = Number(bounds.end);
const step = Number(bounds.step);
const orientation = props.node.appearances.vertical ? 'vertical' : 'horizontal';

const numberValue = computed((): number | undefined => {
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
				<span v-if="numberValue != null">{{ numberValue }}</span>
			</div>

			<RangeSlider
				:id="node.nodeId"
				:disabled="node.currentState.readonly"
				:start="start"
				:end="end"
				:step="step"
				:orientation="orientation"
				:model-value="numberValue"
				@update:model-value="setValue"
			/>

			<div class="range-bound range-min">
				{{ start }}
			</div>

			<div class="range-bound range-max">
				{{ end }}
			</div>
		</div>
	</template>
</template>

<style scoped lang="scss">
.range-control-container {
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
		width: fit-content;
		padding: var(--odk-spacing-m) var(--gutter-width);

		// Vertical appearance is centered. Consistent with
		// https://docs.getodk.org/form-question-types/#vertical-range-widget
		margin: 0 auto;

		.range-bound {
			right: 0;
			width: 16px;
		}

		.range-min {
			bottom: 0;
		}

		.range-max {
			top: 0;
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

.p-rating {
	flex-wrap: wrap;
}
</style>
