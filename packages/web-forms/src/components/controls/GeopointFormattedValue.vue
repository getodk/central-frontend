<script setup lang="ts">
import type {
	GeopointInputNode,
	GeopointNoteNode,
	GeopointInputValue,
	GeopointNoteValue,
} from '@getodk/xforms-engine';
import { computed } from 'vue';
import { truncateDecimals } from '@/lib/format/truncateDecimals.ts';

type GeopointNode = GeopointInputNode | GeopointNoteNode;

type GeopointValue = GeopointInputValue | GeopointNoteValue;

interface GeopointFormattedValueProps {
	readonly question: GeopointNode;
}

const props = defineProps<GeopointFormattedValueProps>();

const value = computed<GeopointValue>(() => {
	return props.question.currentState.value;
});
</script>

<template>
	<!-- TODO: translations -->
	<p class="geopoint-formatted-value">
		<span v-if="value?.accuracy != null">Accuracy: {{ truncateDecimals(value.accuracy, { decimals: 3 }) }} m</span>
		<span v-if="value?.latitude != null">Latitude: {{ value.latitude }}</span>
		<span v-if="value?.longitude != null">Longitude: {{ value.longitude }}</span>
	</p>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.geopoint-formatted-value {
	margin-top: 8px;
	margin-bottom: 12px;
}

.geopoint-formatted-value > span {
	margin-right: 10px;
	font-size: var(--odk-answer-font-size);
}

@media screen and (max-width: #{pf.$sm}) {
	.geopoint-formatted-value {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
}
</style>
