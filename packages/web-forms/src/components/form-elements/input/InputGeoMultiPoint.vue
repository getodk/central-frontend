<script setup lang="ts">
import AsyncMap from '@/components/common/map/AsyncMap.vue';
import { MODES } from '@/components/common/map/getModeConfig.ts';
import type { GeoshapeInputNode, GeotraceInputNode } from '@getodk/xforms-engine';

interface InputGeoMultiPointProps {
	readonly question: GeoshapeInputNode | GeotraceInputNode;
	readonly drawFeatureType: 'shape' | 'trace';
}

defineProps<InputGeoMultiPointProps>();
</script>

<template>
	<AsyncMap
		:disabled="question.currentState.readonly"
		:draw-feature-type="drawFeatureType"
		:mode="MODES.DRAW"
		:saved-feature-value="question.currentState.instanceValue"
		@save="(value) => question.setValue(value ?? '')"
	/>
</template>
