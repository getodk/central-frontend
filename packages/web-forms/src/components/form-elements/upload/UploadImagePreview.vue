<script setup lang="ts">
import ImageBlock from '@/components/common/media/ImageBlock.vue';

type ObjectURL = `blob:${string}`;

export interface UploadImagePreviewProps {
	readonly image: ObjectURL | null;
}

defineProps<UploadImagePreviewProps>();
</script>

<template>
	<ImageBlock v-if="image" :blob-url="image" alt="Captured image preview" />
</template>

<style scoped lang="scss">
.media-block {
	background: var(--odk-muted-background-color);
	height: var(--odk-max-image-height);
	justify-content: center;
	border-radius: var(--odk-radius);
}
</style>
