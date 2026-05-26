<script setup lang="ts">
/**
 * IMPORTANT: Konva and CanvasBlock are not statically imported here to enable bundling them into a separate chunk.
 * This prevents unnecessary bloat in the application bundle, reducing initial load times and improving performance.
 * Use dynamic imports instead (e.g., `await import(importPath)`) for lazy-loading these dependencies when required.
 */
import { getModeConfig, type CanvasMode } from '@/components/common/canvas/getModeConfig.ts';
import { loadCanvas, type CanvasBlockComponent } from '@/components/common/canvas/loadCanvas.ts';
import AsyncLoader from '@/components/common/AsyncLoader.vue';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import { getCurrentInstance, inject, shallowRef } from 'vue';

const props = defineProps<{
	mode: CanvasMode;
	baseImageSrc: `blob:${string}` | null;
	isDisabled?: boolean
}>();

const emit = defineEmits<(e: 'saveImage', file: File | null) => void>();
const isFullScreen = defineModel<boolean>('isFullScreen', { default: false });
const t: Translate = inject(TRANSLATE)!;

const canvasComponent = shallowRef<CanvasBlockComponent | null>(null);

const modeConfig = getModeConfig(props.mode);
const app = getCurrentInstance()?.appContext.app;

const load = async () => {
	canvasComponent.value = await loadCanvas(app);
};
</script>

<template>
	<AsyncLoader
		:load="load"
		:error-message="t('canvas_async.load_error.message')"
		:class="{
			'canvas-compact': modeConfig.isCompact,
			'canvas-blank': !modeConfig.hasBackgroundImage,
		}"
	>
		<div v-if="isDisabled" class="canvas-disabled-overlay" />
		<component
			:is="canvasComponent"
			v-model:is-full-screen="isFullScreen"
			:mode="mode"
			:base-image-src="baseImageSrc"
			:is-disabled="isDisabled"
			@save-image="emit('saveImage', $event)"
		/>
	</AsyncLoader>
</template>
<style scoped lang="scss">
.canvas-blank {
  overflow: hidden;
}

.canvas-disabled-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(from var(--odk-muted-background-color) r g b / 0.7);
  z-index: var(--odk-z-index-top-overlay);
  pointer-events: none;
}
</style>
