<script lang="ts" setup>
import { useRangeNode } from '@getodk/web-forms/components/form-elements/range/useRangeNode.ts';
import type { AnyRangeNode } from '@getodk/xforms-engine';
import Rating from 'primevue/rating';

const props = defineProps<{ readonly node: AnyRangeNode }>();

const { bounds, numberValue, disabled, setValue } = useRangeNode(props.node);
// The stars still need a whole number to render
const starCount = Math.floor(bounds.end);
</script>

<template>
	<Rating
		:id="node.nodeId"
		:disabled="disabled"
		:model-value="numberValue"
		:stars="starCount"
		@update:model-value="setValue"
	/>
</template>

<style scoped lang="scss">
.p-rating {
	flex-wrap: wrap;
}
</style>
