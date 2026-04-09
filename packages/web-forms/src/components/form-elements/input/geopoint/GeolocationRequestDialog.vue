<script setup lang="ts">
import ElapsedTime from '@/components/common/ElapsedTime.vue';
import IconSVG from '@/components/common/IconSVG.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import { truncateDecimals } from '@/lib/format/truncate-decimals.ts';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, inject, onBeforeUnmount, ref, watchEffect } from 'vue';
import {
	GEOLOCATION_STATUS,
	type GeolocationRequestFailure,
	type GeolocationRequestPending,
	type GeolocationRequestState,
	type GeolocationRequestSuccess,
} from './geolocation-request.ts';
import { GeopointAccuracy } from './GeopointAccuracy.ts';
import type { GeopointAccuracyThresholdOptions } from './GeopointAccuracyThresholdOptions.ts';
import type { GeopointValueObject } from './GeopointValueObject.ts';

interface GeolocationRequestDialogProps {
	readonly geopoint: GeopointValueObject | null;
	readonly options: GeopointAccuracyThresholdOptions;
}

const props = defineProps<GeolocationRequestDialogProps>();

const t: Translate = inject(TRANSLATE)!;

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
					<ProgressSpinner class="geo-spinner" stroke-width="4" />
					<strong>{{ t('geolocation_dialog.header.title') }}</strong>
				</div>
				<button class="close-icon" @click="cancel()">
					<IconSVG name="mdiClose" />
				</button>
			</div>
		</template>

		<template #default>
			<div class="geo-dialog-body">
				<div v-if="accuracy.value != null" class="geopoint-icons">
					<IconSVG v-if="accuracy.quality === GeopointAccuracy.POOR" class="warning-icon" name="mdiAlert" variant="error" />
					<IconSVG v-else class="check-icon" name="mdiCheck" variant="primary" />
				</div>

				<div class="geopoint-information">
					<strong v-if="accuracy.value != null" class="geo-quality">
						{{ truncateDecimals(accuracy.value, accuracyTruncateOptions) }} m - {{ t(accuracy.labelMessageId) }}
					</strong>
					<p v-if="options.accuracyThreshold > 0 && state.geopoint == null">
						{{ t('geolocation_dialog.accuracy_threshold.info', { accuracyThreshold: options.accuracyThreshold }) }}
					</p>
					<p>{{ t('geolocation_dialog.elapsed_time.label') }} <ElapsedTime /></p>
					<p v-if="previousAccuracy.value">
						{{ t('geolocation_dialog.previous_accuracy.info', { accuracy: truncateDecimals(previousAccuracy.value, accuracyTruncateOptions) }) }}
					</p>
				</div>
			</div>
		</template>

		<template #footer>
			<div class="geo-dialog-footer">
				<Button text severity="contrast" :label="t('odk_web_forms.cancel.label')" @click="cancel()" />

				<Button :label="t('geolocation_dialog.save.label')" :disabled="accuracy.value == null" @click="save()" />
			</div>
		</template>
	</Dialog>
</template>

<style lang="scss">
@use 'primeflex/core/_variables.scss' as pf;

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

	.geo-spinner {
		width: 22px;
		height: 22px;
		margin-right: var(--odk-spacing-l);
	}
}

.geo-dialog-body {
	display: flex;
	background: var(--odk-muted-background-color);
	border-radius: var(--odk-radius);

	.geopoint-icons {
		margin-top: -4px;
		margin-right: var(--odk-spacing-l);

		.warning-icon path {
			transform: scale(0.91) translate(-1px, -1px);
		}

		.check-icon path {
			transform: scale(1.14) translate(-3px, -3px);
		}
	}
}

.geo-dialog-body {
	align-items: flex-start;
	padding: var(--odk-spacing-xxl);
	max-width: 450px;
	width: 80vw;
}

.geopoint-information {
	p {
		font-size: var(--odk-base-font-size);
		margin: var(--odk-spacing-s) 0;
	}

	strong {
		font-size: var(--odk-base-font-size);
		display: block;
		margin-bottom: var(--odk-spacing-m);
	}
}

.geo-dialog-footer button {
	margin: 0 0 var(--odk-spacing-m) var(--odk-spacing-l);
}

@media screen and (max-width: #{pf.$md}) {
	.geo-dialog-body {
		padding: var(--odk-spacing-xxl) var(--odk-spacing-xl);
	}
}
</style>
