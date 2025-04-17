<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { truncateDecimals } from '@/lib/format/truncateDecimals.ts';
import ElapsedTime from '@/components/ElapsedTime.vue';
import {
	GEOLOCATION_STATUS,
	type GeolocationRequestFailure,
	type GeolocationRequestPending,
	type GeolocationRequestState,
	type GeolocationRequestSuccess,
} from './GeolocationRequest.ts';
import { GeopointAccuracy } from './GeopointAccuracy.ts';
import type { GeopointAccuracyThresholdOptions } from './GeopointAccuracyThresholdOptions.ts';
import type { GeopointValueObject } from './GeopointValueObject.ts';

interface GeolocationRequestDialogProps {
	readonly geopoint: GeopointValueObject | null;
	readonly options: GeopointAccuracyThresholdOptions;
}

const props = defineProps<GeolocationRequestDialogProps>();

const accuracyTruncateOptions = { decimals: 3 };

const previousAccuracy = computed(() => {
	return new GeopointAccuracy(props.geopoint, props.options);
});

const state = ref<GeolocationRequestState>({
	status: GEOLOCATION_STATUS.PENDING,
	geopoint: null,
	error: null,
} satisfies GeolocationRequestPending);

const accuracy = computed(() => {
	return new GeopointAccuracy(state.value.geopoint, props.options);
});

type WatchID = ReturnType<typeof navigator.geolocation.watchPosition>;

let watchID: WatchID | null = navigator.geolocation.watchPosition(
	(position) => {
		state.value = {
			status: GEOLOCATION_STATUS.SUCCESS,
			geopoint: position.coords,
			error: null,
		};
	},
	(error) => {
		state.value = {
			status: GEOLOCATION_STATUS.FAILURE,
			geopoint: null,
			error,
		};
	},
	{ enableHighAccuracy: true }
);

const cleanup = () => {
	if (watchID != null) {
		navigator.geolocation.clearWatch(watchID);
		watchID = null;
	}
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- Using `type` for naming as an interface won't satisfy the `Record` constraint of `defineEmits`
type GeolocationRequestDialogEmits = {
	pending: [state: GeolocationRequestPending];
	cancel: [state: GeolocationRequestState];
	save: [state: GeolocationRequestSuccess];
	success: [state: GeolocationRequestSuccess];
	failure: [state: GeolocationRequestFailure];
};

const emit = defineEmits<GeolocationRequestDialogEmits>();

const cancel = () => {
	emit('cancel', state.value);
	cleanup();
};

type AssertSuccess = (
	request: GeolocationRequestState
) => asserts request is GeolocationRequestSuccess;

const assertSuccess: AssertSuccess = (request) => {
	if (request.status !== GEOLOCATION_STATUS.SUCCESS) {
		throw new Error('Expected request status to be SUCCESS');
	}
};

const save = () => {
	const request = state.value;

	assertSuccess(request);

	emit('save', request);
};

watchEffect(() => {
	const result = state.value;

	switch (result.status) {
		case GEOLOCATION_STATUS.SUCCESS:
			emit('success', result);
			break;

		case GEOLOCATION_STATUS.FAILURE:
			emit('failure', result);
			break;
	}
});

onBeforeUnmount(cleanup);
</script>

<template>
	<Dialog :visible="true" modal class="geo-dialog" :closable="false" :draggable="false">
		<template #header>
			<div class="geo-dialog-header">
				<div class="geo-dialog-header-title">
					<ProgressSpinner class="spinner" stroke-width="4" />
					<!-- TODO: translations -->
					<strong>Finding your location</strong>
				</div>
				<button class="close-icon" @click="cancel()">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 14 14"
						fill="none"
					>
						<path
							d="M8.23648 6.99995L13.3931 1.84328C13.4791 1.76318 13.5481 1.66658 13.5959 1.55925C13.6437 1.45191 13.6694 1.33605 13.6715 1.21856C13.6736 1.10107 13.652 0.984374 13.608 0.875421C13.564 0.766468 13.4984 0.667495 13.4154 0.584407C13.3323 0.501318 13.2333 0.435816 13.1243 0.391808C13.0154 0.347801 12.8987 0.326188 12.7812 0.328261C12.6637 0.330334 12.5479 0.35605 12.4405 0.403874C12.3332 0.451698 12.2366 0.52065 12.1565 0.606618L6.99982 5.76328L1.84315 0.606618C1.67728 0.452058 1.45789 0.367914 1.23121 0.371914C1.00452 0.375913 0.788239 0.467744 0.627924 0.628059C0.467609 0.788375 0.375778 1.00466 0.371778 1.23134C0.367778 1.45803 0.451922 1.67741 0.606482 1.84328L5.76315 6.99995L0.606482 12.1566C0.442624 12.3207 0.350586 12.5431 0.350586 12.775C0.350586 13.0068 0.442624 13.2292 0.606482 13.3933C0.770545 13.5571 0.99294 13.6492 1.22482 13.6492C1.45669 13.6492 1.67909 13.5571 1.84315 13.3933L6.99982 8.23662L12.1565 13.3933C12.3205 13.5571 12.5429 13.6492 12.7748 13.6492C13.0067 13.6492 13.2291 13.5571 13.3931 13.3933C13.557 13.2292 13.649 13.0068 13.649 12.775C13.649 12.5431 13.557 12.3207 13.3931 12.1566L8.23648 6.99995Z"
							fill="#212121"
						/>
					</svg>
				</button>
			</div>
		</template>

		<template #default>
			<div class="geo-dialog-body">
				<div v-if="accuracy.value != null" class="geopoint-icons">
					<i v-if="accuracy.quality === GeopointAccuracy.POOR" class="icon-warning" />
					<svg
						v-else
						class="icon-good-location"
						xmlns="http://www.w3.org/2000/svg"
						width="22"
						height="17"
						viewBox="0 0 22 17"
						fill="none"
					>
						<path
							d="M7.49994 12.8668L2.63494 8.00177L0.978271 9.64677L7.49994 16.1684L21.4999 2.16844L19.8549 0.523438L7.49994 12.8668Z"
							fill="#3B82F6"
						/>
					</svg>
				</div>

				<div class="geopoint-information">
					<!-- TODO: translations -->
					<strong v-if="accuracy.value != null" class="geo-quality">
						{{ truncateDecimals(accuracy.value, accuracyTruncateOptions) }} m - {{ accuracy.label }}
					</strong>
					<p v-if="options.accuracyThreshold > 0 && state.geopoint == null">
						Location will be saved at {{ options.accuracyThreshold }} m
					</p>
					<p>Time taken to capture location: <ElapsedTime /></p>
					<p v-if="previousAccuracy.value">
						Previous saved location at {{ truncateDecimals(previousAccuracy.value, accuracyTruncateOptions) }} m
					</p>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="geo-dialog-footer">
				<!-- TODO: translations -->
				<Button text severity="contrast" label="Cancel" @click="cancel()" />

				<!-- TODO: translations -->
				<Button label="Save location" :disabled="accuracy.value == null" @click="save()" />
			</div>
		</template>
	</Dialog>
</template>

<style lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

.geo-dialog {
	--geo-spacing-s: 5px;
	--geo-spacing-m: 10px;
	--geo-spacing-l: 15px;
	--geo-spacing-xl: 20px;
	--geo-spacing-xxl: 30px;
}

.geo-dialog-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;

	.close-icon {
		background: none;
		border: none;
		cursor: pointer;
	}
}

.geo-dialog-header-title {
	display: flex;
	font-size: var(--odk-group-font-size);

	.spinner {
		width: 22px;
		height: 22px;
		margin-right: var(--geo-spacing-l);
	}
}

.geo-dialog-body {
	display: flex;
	background: var(--odk-muted-background-color);
	border-radius: var(--odk-radius);

	.geopoint-icons {
		margin-right: var(--geo-spacing-l);
	}

	.icon-warning {
		font-size: var(--odk-icon-size);
		color: var(--odk-error-text-color);
	}
}

.geo-dialog-body {
	align-items: flex-start;
	padding: var(--geo-spacing-xxl);
	max-width: 450px;
	width: 80vw;
}

.geopoint-information {
	p {
		font-size: var(--odk-base-font-size);
		margin: var(--geo-spacing-s) 0;
	}
	strong {
		font-size: var(--odk-base-font-size);
		display: block;
		margin-bottom: var(--geo-spacing-m);
	}
}

.geo-dialog-footer button {
	margin: 0 0 var(--geo-spacing-m) var(--geo-spacing-l);
}

// Overriding Primevue's styles
.p-dialog.geo-dialog {
	background: var(--odk-base-background-color);

	&,
	.p-dialog-footer,
	.p-dialog-header {
		border-radius: var(--odk-radius);
	}
}

@media screen and (max-width: #{pf.$md}) {
	.geo-dialog-body {
		padding: var(--geo-spacing-xxl) var(--geo-spacing-xl);
	}
}
</style>
