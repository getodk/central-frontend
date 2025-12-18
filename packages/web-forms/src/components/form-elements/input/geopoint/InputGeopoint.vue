<script setup lang="ts">
import GeolocationFormattedValue from '@/components/common/GeolocationFormattedValue.vue';
import IconSVG from '@/components/common/IconSVG.vue';
import { QUESTION_HAS_ERROR } from '@/lib/constants/injection-keys.ts';
import { computed, type ComputedRef, inject, ref } from 'vue';
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
} from './geolocation-request.ts';
import { GeopointAccuracy } from './GeopointAccuracy.ts';

interface InputGeopointProps {
	readonly question: GeopointInputNode;
}

const props = defineProps<InputGeopointProps>();

const showErrorStyle = inject<ComputedRef<boolean>>(
	QUESTION_HAS_ERROR,
	computed(() => false)
);

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
			class="get-location-button"
			:disabled="isDisabled"
			@click="initiateRequest()"
		>
			<IconSVG name="mdiMapMarkerOutline" variant="inverted" />
			<!-- TODO: translations -->
			<span>Get location</span>
		</Button>

		<div v-if="committedValue != null" class="geopoint-value-container">
			<div class="geopoint-icons">
				<IconSVG v-if="committedValueAccuracy.quality === GeopointAccuracy.POOR" class="warning-icon" name="mdiAlert" variant="error" />
				<IconSVG v-else class="check-icon" name="mdiCheck" variant="primary" />
			</div>
			<div class="geopoint-value">
				<strong class="geo-quality">{{ committedValueAccuracy.label }}</strong>
				<GeolocationFormattedValue :question="question" />
				<Button
					v-if="!isDisabled"
					outlined
					severity="contrast"
					class="retry-button"
					@click="initiateRequest()"
				>
					<IconSVG name="mdiRefresh" />
					<!-- TODO: translations -->
					<span>Try again</span>
				</Button>
			</div>
		</div>

		<div
			v-if="activeRequest?.error != null"
			class="geopoint-error"
			:class="{ 'stack-errors': showErrorStyle }"
		>
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
// Variable definition
.geopoint-control {
	--geo-spacing-s: 5px;
	--geo-spacing-m: 10px;
	--geo-spacing-l: 15px;
	--geo-spacing-xl: 20px;
	--geo-spacing-xxl: 30px;
}

.geopoint-value-container {
	display: inline-flex;
	background: var(--odk-muted-background-color);
	border-radius: var(--odk-radius);
	align-items: flex-start;
	font-size: var(--odk-answer-font-size);
	padding: var(--geo-spacing-xl);

	.geo-quality {
		margin-right: var(--geo-spacing-l);
	}

	.geopoint-icons {
		margin-top: -4px;
		margin-right: var(--geo-spacing-l);
	}

	.geopoint-value {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		flex-wrap: wrap;
		flex-grow: 2;
	}

	:deep(.odk-icon.warning-icon) path {
		transform: scale(0.91) translate(-1px, -1px);
	}

	:deep(.odk-icon.check-icon) path {
		transform: scale(1.14) translate(-3px, -3px);
	}
}

.geopoint-error {
	font-size: var(--odk-base-font-size);
	color: var(--odk-error-text-color);
	background-color: var(--odk-error-background-color);
	border-radius: var(--odk-radius);
	margin-top: var(--geo-spacing-l);
	padding: var(--geo-spacing-xl);

	&.stack-errors {
		padding: 0;
	}
}

.p-button.p-button-contrast.p-button-outlined.retry-button {
	background: var(--odk-base-background-color);

	&:hover {
		background: var(--odk-muted-background-color);
	}
}
</style>
