<script setup lang="ts">
import AsyncMap from '@/components/common/map/AsyncMap.vue';
import { MODES, type SingleFeatureType } from '@/components/common/map/getModeConfig.ts';
import type { GeoshapeInputNode, GeotraceInputNode } from '@getodk/xforms-engine';

interface InputGeoMultiPointProps {
	readonly question: GeoshapeInputNode | GeotraceInputNode;
	readonly singleFeatureType: SingleFeatureType;
}

defineProps<InputGeoMultiPointProps>();
</script>

<template>
	<AsyncMap
		:disabled="question.currentState.readonly"
		:mode="MODES.DRAW"
		:saved-feature-value="question.currentState.instanceValue"
		:single-feature-type="singleFeatureType"
		@save="(value) => question.setValue(value ?? '')"
	/>
</template>
