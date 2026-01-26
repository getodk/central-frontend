<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import {
	isNullLocation,
	isValidLatitude,
	isValidLongitude,
	toGeoJsonCoordinateArray,
} from '@/components/common/map/geojson-parsers.ts';
import { fromLonLat } from 'ol/proj';
import { computed, ref, watch } from 'vue';
import type { Coordinate } from 'ol/coordinate';

const props = defineProps<{
	isOpen: boolean;
	coordinates: Coordinate | null;
}>();

const emit = defineEmits(['open-paste-dialog', 'save']);

const latitude = ref<number | undefined>();
const longitude = ref<number | undefined>();
const accuracy = ref<number | undefined>();
const altitude = ref<number | undefined>();
const disableInputs = computed(() => !props.coordinates?.length);
const validLatitude = computed(() => {
	return isValidLatitude(latitude.value) && !isNullLocation(latitude.value, longitude.value);
});
const validLongitude = computed(() => {
	return isValidLongitude(longitude.value) && !isNullLocation(latitude.value, longitude.value);
});

watch(
	() => props.coordinates,
	(newVal) => {
		if (newVal) {
			[longitude.value, latitude.value, altitude.value, accuracy.value] = newVal;
			return;
		}
		accuracy.value = undefined;
		latitude.value = undefined;
		altitude.value = undefined;
		longitude.value = undefined;
	},
	{ immediate: true }
);

const updateVertex = () => {
	if (!validLatitude.value || !validLongitude.value) {
		return;
	}

	const newVertex = toGeoJsonCoordinateArray(
		Number(longitude.value),
		Number(latitude.value),
		Number(altitude.value),
		Number(accuracy.value)
	) as Coordinate;

	if (newVertex.length) {
		emit('save', fromLonLat(newVertex));
	}
};
</script>

<template>
	<transition name="panel">
		<div v-if="isOpen" class="advanced-panel">
			<div class="fields-container">
				<div :class="{ 'field-error': !disableInputs && !validLongitude }" class="field-set">
					<div class="input-wrap">
						<!-- TODO: translations -->
						<label for="longitude">Longitude</label>
						<input
							id="longitude"
							v-model="longitude"
							type="number"
							:disabled="disableInputs"
							@change="updateVertex"
						>
					</div>
					<!-- TODO: translations -->
					<p class="field-error-message">
						Longitude is invalid
					</p>
				</div>
				<div :class="{ 'field-error': !disableInputs && !validLatitude }" class="field-set">
					<div class="input-wrap">
						<!-- TODO: translations -->
						<label for="latitude">Latitude</label>
						<input
							id="latitude"
							v-model="latitude"
							type="number"
							:disabled="disableInputs"
							@change="updateVertex"
						>
					</div>
					<!-- TODO: translations -->
					<p class="field-error-message">
						Latitude is invalid
					</p>
				</div>
				<div class="field-set">
					<div class="input-wrap">
						<!-- TODO: translations -->
						<label for="altitude">Altitude</label>
						<input
							id="altitude"
							v-model="altitude"
							type="number"
							:disabled="disableInputs"
							@change="updateVertex"
						>
					</div>
				</div>
				<div class="field-set">
					<div class="input-wrap">
						<!-- TODO: translations -->
						<label for="accuracy">Accuracy</label>
						<input
							id="accuracy"
							v-model="accuracy"
							type="number"
							:disabled="disableInputs"
							@change="updateVertex"
						>
					</div>
				</div>
			</div>

			<a class="paste-location" @click="emit('open-paste-dialog')">
				<IconSVG name="mdiFileOutline" size="sm" />
				<!-- TODO: translations -->
				<strong>Import data to replace location</strong>
			</a>
		</div>
	</transition>
</template>

<style scoped lang="scss">
.advanced-panel {
	--odk-double-map-spacing: calc(var(--odk-map-controls-spacing) * 2);
}

.advanced-panel {
	background: var(--odk-base-background-color);
	border-top: 1px solid var(--odk-border-color);
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 3px;
}

.fields-container {
	display: flex;
	flex-wrap: wrap;
	gap: var(--odk-double-map-spacing);
	padding: var(--odk-double-map-spacing) var(--odk-map-controls-spacing);

	.field-set {
		display: flex;
		flex: 1 1 calc(50% - var(--odk-double-map-spacing));
		flex-direction: column;
	}

	.input-wrap {
		display: flex;
		flex-direction: row;
		border-radius: var(--odk-radius);
		overflow: hidden;
		background-color: var(--odk-muted-background-color);
		height: 38px;
		min-width: 250px;
	}

	label {
		padding: var(--odk-map-controls-spacing);
		background-color: var(--odk-light-background-color);
		color: var(--odk-text-color);
		font-weight: normal;
		font-size: var(--odk-base-font-size);
		border-radius: var(--odk-radius) 0 0 var(--odk-radius);
		border: 1px solid var(--odk-border-color);
		border-right: none;
		display: flex;
		align-items: center;
		white-space: nowrap;
		flex-basis: 110px;
		flex-shrink: 0;
		max-width: 150px;
	}

	input {
		padding: var(--odk-map-controls-spacing);
		width: 100%;
		background-color: var(--odk-base-background-color);
		border-radius: 0 var(--odk-radius) var(--odk-radius) 0;
		border: 1px solid var(--odk-border-color);
		font-size: var(--odk-base-font-size);
		color: var(--odk-text-color);
		-moz-appearance: textfield;

		&:focus-visible {
			outline: none;
			outline-offset: unset;
		}

		&::-webkit-outer-spin-button,
		&::-webkit-inner-spin-button {
			appearance: none;
			-webkit-appearance: none;
			margin: 0;
		}

		&:disabled {
			background-color: var(--odk-muted-background-color);
			cursor: not-allowed;
		}
	}

	.field-error-message {
		margin: 8px 0 0 0;
		color: var(--odk-error-text-color);
		display: none;
	}

	.field-error {
		.field-error-message {
			display: block;
		}

		.input-wrap input {
			border: 1px solid var(--odk-error-text-color);
		}
	}
}

.paste-location {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 8px;
	padding: var(--odk-double-map-spacing);
	text-decoration: none;
	cursor: pointer;
	font-size: var(--odk-base-font-size);
	color: var(--odk-text-color);
}

.panel-enter-active,
.panel-leave-active {
	transition:
		max-height 0.6s ease-in-out,
		opacity 0.6s ease-in-out;
	overflow: hidden;
}

.panel-enter-from,
.panel-leave-to {
	max-height: 0;
	opacity: 0;
}

.panel-enter-to,
.panel-leave-from {
	max-height: 300px;
	opacity: 1;
}
</style>
