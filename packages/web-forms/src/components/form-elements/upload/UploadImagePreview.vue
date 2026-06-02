<script setup lang="ts">
import AsyncCanvas from '@/components/common/canvas/AsyncCanvas.vue';
import { getModeConfig, type CanvasMode } from '@/components/common/canvas/getModeConfig.ts';
import ImageBlock from '@/components/common/media/ImageBlock.vue';
import { computed } from 'vue';

type ObjectURL = `blob:${string}`;

export interface UploadImagePreviewProps {
	readonly imagePreviewUrl: ObjectURL | null;
	readonly canvasBaseImage: ObjectURL | null;
	readonly canvasMode?: CanvasMode;
	readonly isDisabled?: boolean;
}

const props = defineProps<UploadImagePreviewProps>();
const emit = defineEmits<(e: 'saveImage', file: File | null) => void>();
const isCanvasFullScreen = defineModel<boolean>('isCanvasFullScreen', { default: false });

const activeCanvasMode = computed<CanvasMode | undefined>(() => {
	const { canvasMode, canvasBaseImage } = props;
	if (!canvasMode || (getModeConfig(canvasMode).hasBackgroundImage && !canvasBaseImage)) {
		return;
	}
	return canvasMode;
});
</script>

<template>
	<AsyncCanvas
		v-if="activeCanvasMode"
		v-model:is-full-screen="isCanvasFullScreen"
		:mode="activeCanvasMode"
		:base-image-src="canvasBaseImage"
		:is-disabled="isDisabled"
		@save-image="emit('saveImage', $event)"
	/>
	<ImageBlock v-else-if="imagePreviewUrl" :blob-url="imagePreviewUrl" alt="Captured image preview" />
</template>

<style scoped lang="scss">
.media-block {
	background: var(--odk-muted-background-color);
	height: var(--odk-max-image-height);
	justify-content: center;
	border-radius: var(--odk-radius);
}
</style>
