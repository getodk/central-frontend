<script setup lang="ts">
import MediaBlockBase from '@/components/common/media/MediaBlockBase.vue';
import type { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL.ts';
import { type ObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import { computed, ref, triggerRef } from 'vue';

defineProps<{
	readonly resourceUrl?: JRResourceURL;
	readonly blobUrl?: ObjectURL;
	readonly alt: string;
}>();

interface NaturalDimensions {
	readonly naturalWidth: number;
	readonly naturalHeight: number;
}
const loadedDimensions = ref<NaturalDimensions>({ naturalWidth: 0, naturalHeight: 0 });

const SMALL_IMAGE_SIZE = 300;
const isSmallImage = computed(() => {
	const { naturalWidth, naturalHeight } = loadedDimensions.value;
	return naturalWidth < SMALL_IMAGE_SIZE && naturalHeight < SMALL_IMAGE_SIZE;
});

const setDimensions = (event: Event) => {
	loadedDimensions.value = event.target as HTMLImageElement;
	// Ensures `isSmallImage` will be recomputed if `loadedDimensions.value`
	// already has a value from a prior upload.
	triggerRef(loadedDimensions);
};
</script>

<template>
	<MediaBlockBase
		v-slot="{ mediaUrl, reportError }"
		:alt="alt"
		broken-file-image="broken-image.svg"
		:resource-url="resourceUrl"
		:blob-url="blobUrl"
		:variant="isSmallImage ? 'small-fixed' : 'full-width'"
	>
		<img
			:src="mediaUrl"
			:alt="alt"
			class="image-block"
			@load="setDimensions"
			@error="reportError(new Error(`Failed to load image. File: ${resourceUrl?.href}`))"
		>
	</MediaBlockBase>
</template>

<style scoped lang="scss">
.image-block {
	max-height: var(--odk-max-image-height);
	max-width: 100%;
	width: auto;
	height: auto;
	display: block;
	object-fit: contain;
}
</style>
