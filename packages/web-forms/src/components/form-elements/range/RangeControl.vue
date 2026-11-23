<script lang="ts" setup>
import ControlText from '@getodk/web-forms/components/form-elements/ControlText.vue';
import RangePicker from '@getodk/web-forms/components/form-elements/range/RangePicker.vue';
import RangeRating from '@getodk/web-forms/components/form-elements/range/RangeRating.vue';
import RangeSliderControl from '@getodk/web-forms/components/form-elements/range/RangeSliderControl.vue';
import type { AnyRangeNode } from '@getodk/xforms-engine';

defineProps<{ readonly node: AnyRangeNode }>();
</script>

<template>
	<ControlText :question="node" />

	<RangeRating v-if="node.appearances.rating" :node="node" />
	<RangePicker v-else-if="node.appearances.picker" :node="node" />
	<RangeSliderControl v-else :node="node" />
</template>
