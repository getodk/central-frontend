<script setup lang="ts">
import { computed, inject, ref } from 'vue';
import Button from 'primevue/button';
import type { GeopointInputNode } from '@getodk/xforms-engine';
import { GeopointAccuracyThresholdOptions } from './GeopointAccuracyThresholdOptions.ts';
import type { GeopointValueObject } from './GeopointValueObject.ts';
import GeolocationRequestDialog from './GeolocationRequestDialog.vue';
import {
	GEOLOCATION_STATUS,
	type GeolocationRequestFailure,
	type GeolocationRequestPending,
	type GeolocationRequestState,
	type GeolocationRequestSuccess,
} from './GeolocationRequest.ts';
import { GeopointAccuracy } from './GeopointAccuracy.ts';
import GeopointFormattedValue from '@/components/controls/GeopointFormattedValue.vue';

interface InputGeopointProps {
	readonly question: GeopointInputNode;
}

const props = defineProps<InputGeopointProps>();

const submitPressed = inject<boolean>('submitPressed');

const isInvalid = computed(() => props.question.validationState.violation?.valid === false);

const isDisabled = computed(() => props.question.currentState.readonly === true);

const INPUT_GEOPOINT_STATUS = {
	INITIAL: 'INITIAL',
	REQUESTED: 'REQUESTED',
	DISMISSED: 'DISMISSED',
} as const;

type InputGeopointStatusEnum = typeof INPUT_GEOPOINT_STATUS;

type InputGeopointStatus = InputGeopointStatusEnum[keyof InputGeopointStatusEnum];

const thresholdOptions = new GeopointAccuracyThresholdOptions(props.question.nodeOptions);

const committedValue = computed<GeopointValueObject | null>(() => {
	return props.question.currentState.value;
});

const committedValueAccuracy = computed((): GeopointAccuracy => {
	return new GeopointAccuracy(committedValue.value, thresholdOptions);
});

const requestedValueAccuracy = computed((): GeopointAccuracy => {
	return new GeopointAccuracy(activeRequest.value?.geopoint ?? null, thresholdOptions);
});

const status = ref<InputGeopointStatus>(INPUT_GEOPOINT_STATUS.INITIAL);
const dismissedRequest = ref<GeolocationRequestState | null>(null);
const activeRequest = ref<GeolocationRequestState | null>(null);

const initiateRequest = () => {
	status.value = INPUT_GEOPOINT_STATUS.REQUESTED;
	activeRequest.value = null;
	dismissedRequest.value = null;
};

const updateRequestProgress = (requestState: GeolocationRequestState) => {
	status.value = INPUT_GEOPOINT_STATUS.REQUESTED;
	activeRequest.value = requestState;
	dismissedRequest.value = null;
};

const onRequested = (requested: GeolocationRequestPending) => {
	updateRequestProgress(requested);
};

const dismissRequest = (dismissed: GeolocationRequestState) => {
	status.value = INPUT_GEOPOINT_STATUS.DISMISSED;
	activeRequest.value = null;
	dismissedRequest.value = dismissed;
};

const commitRequest = (success: GeolocationRequestSuccess) => {
	status.value = INPUT_GEOPOINT_STATUS.INITIAL;
	activeRequest.value = null;
	dismissedRequest.value = null;

	props.question.setValue(success.geopoint);
};

const onSuccess = (success: GeolocationRequestSuccess) => {
	if (status.value !== INPUT_GEOPOINT_STATUS.REQUESTED) {
		return;
	}

	if (
		committedValue.value == null &&
		requestedValueAccuracy.value.quality === GeopointAccuracy.GOOD
	) {
		commitRequest(success);
		return;
	}

	updateRequestProgress(success);
};

const onFailure = (failure: GeolocationRequestFailure) => {
	updateRequestProgress(failure);
};

const onCancel = (canceled: GeolocationRequestState) => {
	dismissRequest(canceled);
};

const onSave = (saved: GeolocationRequestSuccess) => {
	commitRequest(saved);
};
</script>

<template>
	<div ref="controlElement" class="geopoint-control">
		<Button
			v-if="committedValue == null"
			rounded
			class="get-location-button"
			:disabled="isDisabled"
			@click="initiateRequest()"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				height="24px"
				viewBox="0 0 24 24"
				width="24px"
				fill="#5f6368"
			>
				<path d="M0 0h24v24H0V0z" fill="none" />
				<path
					d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"
				/>
				<circle cx="12" cy="9" r="2.5" />
			</svg>
			<!-- TODO: translations -->
			<span>Get location</span>
		</Button>

		<div v-if="committedValue != null" class="geopoint-value-container">
			<div class="geopoint-icons">
				<i v-if="committedValueAccuracy.quality === GeopointAccuracy.POOR" class="icon-warning" />
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
			<div class="geopoint-value">
				<strong class="geo-quality">{{ committedValueAccuracy.label }}</strong>
				<GeopointFormattedValue :question="question" />
				<Button
					v-if="!isDisabled"
					rounded
					outlined
					severity="contrast"
					class="retry-button"
					@click="initiateRequest()"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="15"
						height="14"
						viewBox="0 0 15 14"
						fill="none"
					>
						<g clip-path="url(#clip0_1092_687)">
							<path
								fill-rule="evenodd"
								clip-rule="evenodd"
								d="M7.27039 5.96336C7.34312 5.99355 7.42115 6.00891 7.4999 6.00854C7.57865 6.00891 7.65668 5.99355 7.72941 5.96336C7.80214 5.93317 7.86811 5.88876 7.92345 5.83273L10.3209 3.43529C10.4331 3.32291 10.4962 3.17058 10.4962 3.01175C10.4962 2.85292 10.4331 2.70058 10.3209 2.5882L7.92345 0.190763C7.86858 0.131876 7.80241 0.0846451 7.72889 0.0518865C7.65536 0.019128 7.576 0.00151319 7.49552 9.32772e-05C7.41505 -0.00132663 7.33511 0.0134773 7.26048 0.0436218C7.18585 0.0737664 7.11805 0.118634 7.06114 0.175548C7.00422 0.232462 6.95936 0.300257 6.92921 0.374888C6.89907 0.449519 6.88426 0.529456 6.88568 0.609933C6.8871 0.690409 6.90472 0.769775 6.93748 0.843296C6.97023 0.916817 7.01747 0.982986 7.07635 1.03786L8.45091 2.41241H7.49986C5.96325 2.41241 4.48957 3.02283 3.40302 4.10938C2.31647 5.19593 1.70605 6.66961 1.70605 8.20622C1.70605 9.74283 2.31647 11.2165 3.40302 12.3031C4.48957 13.3896 5.96325 14 7.49986 14C9.03582 13.9979 10.5083 13.3868 11.5944 12.3007C12.6805 11.2146 13.2916 9.74218 13.2937 8.20622C13.2937 8.04726 13.2305 7.89481 13.1181 7.78241C13.0057 7.67001 12.8533 7.60686 12.6943 7.60686C12.5353 7.60686 12.3829 7.67001 12.2705 7.78241C12.1581 7.89481 12.0949 8.04726 12.0949 8.20622C12.0949 9.11504 11.8255 10.0035 11.3205 10.7591C10.8156 11.5148 10.098 12.1037 9.25832 12.4515C8.41868 12.7993 7.49476 12.8903 6.6034 12.713C5.71204 12.5357 4.89328 12.0981 4.25064 11.4554C3.60801 10.8128 3.17037 9.99404 2.99307 9.10268C2.81576 8.21132 2.90676 7.2874 3.25455 6.44776C3.60234 5.60811 4.19131 4.89046 4.94697 4.38554C5.70263 3.88063 6.59104 3.61113 7.49986 3.61113H8.45086L7.07635 4.98564C6.96411 5.09802 6.90107 5.25035 6.90107 5.40918C6.90107 5.56801 6.96411 5.72035 7.07635 5.83273C7.13169 5.88876 7.19766 5.93317 7.27039 5.96336Z"
								fill="#64748B"
							/>
						</g>
						<defs>
							<clipPath id="clip0_1092_687">
								<rect width="14" height="14" fill="white" transform="translate(0.5)" />
							</clipPath>
						</defs>
					</svg>
					<!-- TODO: translations -->
					<span>Try again</span>
				</Button>
			</div>
		</div>

		<div
			v-if="activeRequest?.error != null"
			class="geopoint-error"
			:class="{ 'stack-errors': submitPressed && isInvalid }"
		>
			<i class="icon-warning" />
			<!-- TODO: translations -->
			<strong>Cannot access location</strong>&nbsp;<span>Grant location permission in the browser settings and make sure location is turned on.</span>
		</div>
	</div>

	<GeolocationRequestDialog
		v-if="status === INPUT_GEOPOINT_STATUS.REQUESTED && activeRequest?.status !== GEOLOCATION_STATUS.FAILURE"
		:geopoint="committedValue"
		:options="thresholdOptions"
		@pending="onRequested"
		@cancel="onCancel"
		@save="onSave"
		@success="onSuccess"
		@failure="onFailure"
	/>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

// Variable definition
.geopoint-control {
	--geo-spacing-s: 5px;
	--geo-spacing-m: 10px;
	--geo-spacing-l: 15px;
	--geo-spacing-xl: 20px;
	--geo-spacing-xxl: 30px;
	--geo-radius: 10px;
	--geo-text-font-size: 0.9rem;
}

.get-location-button,
.retry-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;

	svg {
		margin-right: var(--geo-spacing-s);
	}
}

.get-location-button {
	min-width: 270px;

	svg {
		fill: var(--surface-0);
	}

	&:disabled svg {
		fill: var(--surface-500);
	}
}

.retry-button {
	margin-left: auto;
	font-size: var(--geo-text-font-size);

	svg path {
		fill: var(--surface-900);
	}
}

.geopoint-value-container {
	display: flex;
	background: var(--surface-100);
	border-radius: var(--geo-radius);
	align-items: center;
	font-size: var(--geo-text-font-size);
	padding: var(--geo-spacing-m) var(--geo-spacing-l);

	.geo-quality,
	.geopoint-icons {
		margin-right: var(--geo-spacing-l);
	}

	.geopoint-icons svg {
		width: 20px;
	}

	.icon-warning {
		font-size: 1.2rem;
		color: var(--error-text-color);
	}

	.geopoint-value {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		flex-wrap: wrap;
		flex-grow: 2;
	}
}

.geopoint-error {
	font-size: 1rem;
	color: var(--error-text-color);
	background-color: var(--error-bg-color);
	border-radius: var(--geo-radius);
	margin-top: var(--geo-spacing-xxl);
	padding: var(--geo-spacing-xl);

	.icon-warning {
		font-size: 1.2rem;
		margin-right: var(--geo-spacing-s);
		vertical-align: text-bottom;
	}

	&.stack-errors {
		padding-left: 0;
	}
}

.p-button.p-button-contrast.p-button-outlined.retry-button {
	background: var(--surface-0);
}

@media screen and (max-width: #{$md}) {
	.geopoint-value-container {
		align-items: flex-start;
		padding: var(--geo-spacing-xxl) var(--geo-spacing-xl);

		.geopoint-value {
			display: flex;
			flex-direction: column;
			align-items: flex-start;

			.retry-button {
				margin-left: 0;
			}
		}
	}
}
</style>
