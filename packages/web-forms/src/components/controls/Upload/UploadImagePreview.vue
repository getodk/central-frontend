<script setup lang="ts">
import type { ObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import { createObjectURL, revokeObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import type { UploadNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import { computed, ref, triggerRef, watchEffect } from 'vue';

export interface UploadImagePreviewProps {
	readonly question: UploadNode;
	readonly isDisabled: boolean;
}

const props = defineProps<UploadImagePreviewProps>();

interface NaturalDimensions {
	readonly naturalWidth: number;
	readonly naturalHeight: number;
}

const DEFAULT_DIMENSIONS: NaturalDimensions = {
	naturalWidth: 0,
	naturalHeight: 0,
};

const loadedDimensions = ref<NaturalDimensions>(DEFAULT_DIMENSIONS);

const onPreviewLoad = (event: Event) => {
	const previewImage = event.target as HTMLImageElement;

	loadedDimensions.value = previewImage;

	/**
	 * Ensures `isSmallImage` will be recomputed if `previewImage` has already
	 * been assigned to `loadedDimensions.value` by a prior upload.
	 *
	 * TODO: it would be nice to find (or build?) something equivalent to Solid's
	 * {@link https://docs.solidjs.com/reference/basic-reactivity/create-signal#equals | `equals` option},
	 * which would allow specifying this behavior directly on `loadedDimensions`
	 * (and would allow customizing it e.g. to recompute specifically if an
	 * `HTMLImageElement` is assigned).
	 */
	triggerRef(loadedDimensions);
};

const SMALL_IMAGE_SIZE = 300;

const isSmallImage = computed(() => {
	const { naturalWidth, naturalHeight } = loadedDimensions.value;

	return naturalWidth < SMALL_IMAGE_SIZE && naturalHeight < SMALL_IMAGE_SIZE;
});

const imageURL = computed((previous: ObjectURL | null = null) => {
	if (previous != null) {
		revokeObjectURL(previous);
	}

	const file = props.question.currentState.value;

	if (file == null) {
		return null;
	}

	return createObjectURL(file);
});

const emit = defineEmits(['clear']);

watchEffect(() => {
	if (props.question.currentState.value == null) {
		loadedDimensions.value = DEFAULT_DIMENSIONS;
	}
});
</script>

<template>
	<div v-if="imageURL" class="preview-captured-image" :class="{ 'small-image': isSmallImage }">
		<Button v-if="!isDisabled" severity="secondary" outlined class="clear-button" @click="emit('clear')">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
			>
				<path
					d="M7.01186 6.00931L11.27 1.75114C11.341 1.68499 11.398 1.60522 11.4375 1.51659C11.4769 1.42796 11.4982 1.33228 11.4999 1.23527C11.5016 1.13825 11.4838 1.04188 11.4474 0.951916C11.4111 0.861947 11.357 0.780219 11.2884 0.711608C11.2198 0.642997 11.138 0.588908 11.0481 0.552568C10.9581 0.516228 10.8617 0.498381 10.7647 0.500093C10.6677 0.501805 10.572 0.52304 10.4834 0.562531C10.3948 0.602022 10.315 0.65896 10.2488 0.729949L5.99067 4.98812L1.7325 0.729949C1.59553 0.602319 1.41437 0.532837 1.22718 0.536139C1.03999 0.539442 0.861396 0.615272 0.729015 0.747654C0.596633 0.880036 0.520802 1.05863 0.5175 1.24582C0.514197 1.43301 0.58368 1.61417 0.711309 1.75114L4.96948 6.00931L0.711309 10.2675C0.576001 10.403 0.5 10.5866 0.5 10.7781C0.5 10.9696 0.576001 11.1532 0.711309 11.2887C0.846786 11.424 1.03043 11.5 1.2219 11.5C1.41338 11.5 1.59702 11.424 1.7325 11.2887L5.99067 7.0305L10.2488 11.2887C10.3843 11.424 10.568 11.5 10.7594 11.5C10.9509 11.5 11.1346 11.424 11.27 11.2887C11.4053 11.1532 11.4813 10.9696 11.4813 10.7781C11.4813 10.5866 11.4053 10.403 11.27 10.2675L7.01186 6.00931Z"
					fill="#6B7280"
				/>
			</svg>
		</Button>
		<img :src="imageURL" alt="Captured image preview" @load="onPreviewLoad">
	</div>
</template>

<style scoped lang="scss">
.preview-captured-image {
	--uploadPreviewSize: 300px;
}

.preview-captured-image {
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	width: fit-content;
	height: var(--uploadPreviewSize);
	margin-top: 30px;
	background: var(--odk-muted-background-color);
	border-radius: var(--odk-radius);
	overflow: hidden;

	img {
		max-height: var(--uploadPreviewSize);
		max-width: 100%;
		width: auto;
		height: auto;
		display: block;
		object-fit: contain;
	}

	.clear-button {
		position: absolute;
		top: 10px;
		right: 10px;
		background: var(--odk-base-background-color);
		border: 1px solid var(--odk-border-color);
		width: 38px;
		height: 38px;
	}
}

.preview-captured-image.small-image {
	width: var(--uploadPreviewSize);
}

/**
 * Below overrides PrimeVue style
 */

.p-button.clear-button {
	min-width: 0;
	padding: 12px;
	border-radius: var(--odk-radius);

	&:not(:disabled):active,
	&:not(:disabled):hover {
		border-color: var(--odk-inactive-background-color);
	}
}
</style>
