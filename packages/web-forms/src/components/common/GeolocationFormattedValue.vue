<script setup lang="ts">
import type {
	GeopointInputNode,
	GeopointNoteNode,
	GeoshapeNoteNode,
	GeotraceNoteNode,
	GeopointInputValue,
	GeopointNoteValue,
	GeotraceNoteValue,
	GeoshapeNoteValue,
} from '@getodk/xforms-engine';
import { computed } from 'vue';
import { truncateDecimals } from '@/lib/format/truncate-decimals.ts';

type GeolocationNode = GeopointInputNode | GeopointNoteNode | GeoshapeNoteNode | GeotraceNoteNode;

type GeolocationValue =
	| GeoshapeNoteValue
	| GeotraceNoteValue
	| [GeopointInputValue]
	| [GeopointNoteValue];

const props = defineProps<{
	readonly question: GeolocationNode;
}>();

const locationPoints = computed<GeolocationValue>(() => {
	const points = props.question.currentState.value;
	return Array.isArray(points) ? points : [points];
});
</script>

<template>
	<div v-for="(point, index) in locationPoints" :key="index">
		<!-- TODO: translations -->
		<p class="geolocation-formatted-value">
			<span v-if="point?.accuracy != null">Accuracy: {{ truncateDecimals(point.accuracy, { decimals: 3 }) }} m,</span>
			<span v-if="point?.latitude != null">Latitude: {{ point.latitude }},</span>
			<span v-if="point?.longitude != null">Longitude: {{ point.longitude }}.</span>
		</p>
	</div>
</template>

<style scoped lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.geolocation-formatted-value {
	margin-top: 8px;
	margin-bottom: 12px;
}

.geolocation-formatted-value > span {
	margin-right: 10px;
	font-size: var(--odk-answer-font-size);
	font-weight: 300;
}

@media screen and (max-width: #{pf.$sm}) {
	.geolocation-formatted-value {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
}
</style>
