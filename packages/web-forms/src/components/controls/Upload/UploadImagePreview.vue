<script setup lang="ts">
import IconSVG from '@/components/widgets/IconSVG.vue';
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
			<IconSVG name="mdiClose" variant="muted" size="sm" />
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
