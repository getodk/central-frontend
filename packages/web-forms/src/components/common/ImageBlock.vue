<script setup lang="ts">
import { FORM_IMAGE_CACHE, FORM_OPTIONS } from '@/lib/constants/injection-keys.ts';
import type { FormOptions } from '@/lib/init/load-form-state.ts';
import type {
	JRResourceURL,
	JRResourceURLString,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import { createObjectURL, type ObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import { computed, inject, ref, triggerRef, watchEffect } from 'vue';

interface ImageBlockProps {
	readonly resourceUrl?: JRResourceURL;
	readonly blobUrl?: ObjectURL;
	readonly alt: string;
}

interface NaturalDimensions {
	readonly naturalWidth: number;
	readonly naturalHeight: number;
}

const SMALL_IMAGE_SIZE = 300;

const props = defineProps<ImageBlockProps>();

const formOptions = inject<FormOptions>(FORM_OPTIONS);
const loading = ref<boolean>(true);
const imageCache = inject<Map<JRResourceURLString, ObjectURL>>(FORM_IMAGE_CACHE, new Map());
const imageUrl = ref<string>('');
const loadedDimensions = ref<NaturalDimensions>({ naturalWidth: 0, naturalHeight: 0 });
const errorMessage = ref<string>('');

const isSmallImage = computed(() => {
	const { naturalWidth, naturalHeight } = loadedDimensions.value;
	return naturalWidth < SMALL_IMAGE_SIZE && naturalHeight < SMALL_IMAGE_SIZE;
});

const loadImage = async (src?: JRResourceURL) => {
	if (src == null || formOptions?.fetchFormAttachment == null) {
		// TODO: translations
		throw new Error('Cannot fetch image. Verify the URL and fetch settings.');
	}

	const cachedImage = imageCache.get(src.href);
	if (cachedImage != null) {
		setImage(cachedImage);
		return;
	}

	const response = await formOptions.fetchFormAttachment(src);
	if (!response.ok || response.status !== 200) {
		// TODO: translations
		throw new Error(`Image not found. File: ${src.href}`);
	}

	const data = await response.blob();
	const url = createObjectURL(data);
	imageCache.set(src.href, url);
	setImage(url);
};

const setImage = (value: string) => {
	imageUrl.value = value;
	loading.value = false;
};

const setDimensions = (event: Event) => {
	loadedDimensions.value = event.target as HTMLImageElement;
	// Ensures `isSmallImage` will be recomputed if `loadedDimensions.value`
	// already has a value from a prior upload.
	triggerRef(loadedDimensions);
};

const handleError = (error: Error) => {
	setImage('');
	errorMessage.value = error.message;
};

watchEffect(() => {
	loadedDimensions.value = { naturalWidth: 0, naturalHeight: 0 };
	errorMessage.value = '';

	if (props.blobUrl != null) {
		setImage(props.blobUrl);
		return;
	}

	loadImage(props.resourceUrl).catch((error: Error) => handleError(error));
});
</script>

<template>
	<div :class="{ 'image-block': true, 'broken-image': errorMessage?.length, 'small-image': !loading && isSmallImage }">
		<!-- TODO: translations -->
		<img
			v-if="!loading && !errorMessage?.length"
			:src="imageUrl"
			:alt="alt"
			@load="setDimensions"
			@error="handleError(new Error(`Failed to load image. File: ${props.resourceUrl?.href}`))"
		>

		<div v-if="loading" class="skeleton-loading" />

		<template v-if="errorMessage?.length">
			<img src="../../assets/images/broken-image.svg" :alt="alt">
			<p class="image-error-message">
				{{ errorMessage }}
			</p>
		</template>
	</div>
</template>

<style scoped lang="scss">
.image-block {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	position: relative;
	width: 100%;
	overflow: hidden;

	img {
		max-height: var(--odk-max-image-height);
		max-width: 100%;
		width: auto;
		height: auto;
		display: block;
		object-fit: contain;
	}

	&.small-image {
		max-width: var(--odk-image-container-size);
	}

	&.broken-image img {
		max-width: 90%;
		margin-top: 10px;
	}

	.image-error-message {
		margin: 20px;
		font-size: var(--odk-hint-font-size);
		font-weight: 300;
		word-break: break-word;
		text-align: center;
		color: var(--odk-muted-text-color);
	}

	.skeleton-loading {
		min-width: 300px;
		min-height: 300px;
	}
}
</style>
