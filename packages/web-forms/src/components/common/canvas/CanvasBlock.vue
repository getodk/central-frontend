<script setup lang="ts">
/**
 * IMPORTANT: Lazy-loaded for Konva isolation. Keep Konva imports/code here only to bundle separately and
 * load on demand. Avoids main bundle bloat.
 */
import CanvasControls from '@/components/common/canvas/CanvasControls.vue';
import { type CanvasMode, getModeConfig, MODES } from '@/components/common/canvas/getModeConfig.ts';
import {
	DEFAULT_STROKE_COLOR,
	STROKE_WIDTH,
	useCanvasDrawing,
} from '@/components/common/canvas/useCanvasDrawing.ts';
import { TRANSLATE } from '@/lib/constants/injection-keys.ts';
import type { Translate } from '@/lib/locale/useLocale.ts';
import type Konva from 'konva';
import Message from 'primevue/message';
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import type { VueKonvaRef } from 'vue-konva';

const FLATTEN_DEBOUNCE_MS = 500;
const GUIDE_LINE_Y_RATIO = 0.65;
// Placeholder prevents division by zero before container loads, keeping computed values safe (e.g., baseScale).
const SAFE_INITIAL_SIZE = { width: 1, height: 1 };

const props = defineProps<{
	mode: CanvasMode;
	baseImageSrc?: `blob:${string}` | null;
	isDisabled?: boolean;
}>();

const emit = defineEmits<(e: 'saveImage', file: File | null) => void>();
// On mobile, the canvas expands to fill the viewport for easier drawing. Desktop doesn't have this.
const isFullScreen = defineModel<boolean>('isFullScreen', { default: false });

const t: Translate = inject(TRANSLATE)!;
const modeConfig = getModeConfig(props.mode);

const containerRef = ref<HTMLDivElement>();
const containerSize = ref({ ...SAFE_INITIAL_SIZE });
const stageRef = ref<VueKonvaRef<Konva.Stage>>();
const strokesLayerRef = ref<VueKonvaRef<Konva.Layer>>();

const imageEl = ref<HTMLImageElement>();
const imageSize = ref({ ...SAFE_INITIAL_SIZE });
const blankBackgroundConfig = computed(() => ({ x: 0, y: 0, fill: 'white', ...imageSize.value }));

const isLoading = ref(modeConfig.hasBackgroundImage || !!props.baseImageSrc);
const loadError = ref(false);
const activeColor = ref(`#${DEFAULT_STROKE_COLOR}`);
const isStrokeActive = ref(true);

const flattenState = { timerId: null as ReturnType<typeof setTimeout> | null };
const cancelFlatten = () => {
	if (flattenState.timerId) {
		clearTimeout(flattenState.timerId);
		flattenState.timerId = null;
	}
};

const scheduleFlatten = () => {
	cancelFlatten();
	flattenState.timerId = setTimeout(() => {
		flattenState.timerId = null;
		void emitSaveImage();
	}, FLATTEN_DEBOUNCE_MS);
};

const draw = useCanvasDrawing({
	stageRef,
	strokesLayerRef,
	containerRef,
	containerSize,
	imageSize,
	isStrokeActive,
	activeColor,
	hasBackgroundImage: modeConfig.hasBackgroundImage,
	imageEl,
	onStrokeCommitted: scheduleFlatten,
});

const showDrawInstruction = computed(() => {
	const isNewSubmission = !props.baseImageSrc;
	const noStrokes = !draw.committedStrokes.value.length;
	return props.mode === MODES.DRAW && !props.isDisabled && isNewSubmission && noStrokes;
});
const stageConfig = computed(() => ({
	width: Math.round(imageSize.value.width * draw.effectiveScale.value),
	height: Math.round(imageSize.value.height * draw.effectiveScale.value),
}));

const imageConfig = computed(() => ({ image: imageEl.value, x: 0, y: 0, ...imageSize.value }));
const layerConfig = computed(() => ({
	scaleX: draw.effectiveScale.value,
	scaleY: draw.effectiveScale.value,
	listening: false,
}));
const guideLineConfig = computed((): Konva.LineConfig => {
	const posY = imageSize.value.height * GUIDE_LINE_Y_RATIO;
	return {
		points: [0, posY, imageSize.value.width, posY],
		stroke: '#aaaaaa',
		strokeWidth: STROKE_WIDTH / 2,
		listening: false,
	};
});

const emitSaveImage = async () => {
	const file = await draw.flattenStage();
	if (file) {
		emit('saveImage', file);
	}
};

const imgLoadState = { pending: null as HTMLImageElement | null };
const abortPendingLoad = () => {
	if (imgLoadState.pending) {
		const img = imgLoadState.pending;
		imgLoadState.pending = null;
		img.src = '';
	}
};

const settleLoad = (img: HTMLImageElement): boolean => {
	if (img !== imgLoadState.pending) {
		return false;
	}
	imgLoadState.pending = null;
	isLoading.value = false;
	return true;
};

const isMobileActive = () => {
	const blockEl = containerRef.value?.parentElement;
	return blockEl != null && getComputedStyle(blockEl).getPropertyValue('--is-mobile-active') === '1';
};

const updateContainerFit = () => {
	containerSize.value = draw.safeSize({
		width: containerRef.value?.clientWidth,
		height: containerRef.value?.clientHeight,
	});

	if (isFullScreen.value && !isMobileActive()) {
		closeFullScreen();
	}

	// Blank canvas expands width to container. Signature keeps its init height to stay rectangular.
	if (!imageEl.value && isFullScreen.value && !draw.committedStrokes.value.length) {
		imageSize.value = {
			width: containerSize.value.width,
			height: props.mode === MODES.SIGNATURE ? imageSize.value.height : containerSize.value.height,
		};
	}
};

const onCanvasReady = (size: { width: number; height: number }) => {
	imageSize.value = size;
	isLoading.value = false;
	updateContainerFit();
};

// Schedules initial flatten on load so the unmodified image is saved as the starting answer.
const loadImage = (src: string) => {
	isLoading.value = true;
	loadError.value = false;
	imageEl.value = undefined;
	draw.resetZoom();
	draw.resetDrawingState();
	cancelFlatten();
	abortPendingLoad();

	const img = new Image();
	imgLoadState.pending = img;
	img.onload = () => {
		if (!settleLoad(img)) {
			return;
		}
		imageEl.value = img;
		const imgSize = draw.safeSize({ width: img.naturalWidth, height: img.naturalHeight });
		onCanvasReady(imgSize);
		scheduleFlatten();
	};
	img.onerror = () => {
		if (settleLoad(img)) {
			loadError.value = true;
		}
	};
	img.src = src;
};

const openFullScreen = () => {
	if (!modeConfig.hasBackgroundImage) {
		draw.resetZoom();
	}
	isFullScreen.value = true;
};

const closeFullScreen = () => {
	isFullScreen.value = false;
	draw.resetZoom();
	cancelFlatten();
	void emitSaveImage();
};

watch(
	() => draw.committedStrokes.value.length,
	(newLen, oldLen) => {
		if (!imageEl.value && oldLen > 0 && newLen === 0) {
			cancelFlatten();
			emit('saveImage', null);
		}
	}
);

const initCanvas = () => {
	updateContainerFit();
	if (props.baseImageSrc) {
		loadImage(props.baseImageSrc);
		return;
	}
	if (modeConfig.hasBackgroundImage) {
		return;
	}
	onCanvasReady({ ...containerSize.value });
};

const resizeObserver = { current: null as ResizeObserver | null };
onMounted(() => {
	initCanvas();
	resizeObserver.current = new ResizeObserver(() => updateContainerFit());
	resizeObserver.current.observe(containerRef.value!);
});

onUnmounted(() => {
	resizeObserver.current?.disconnect();
	cancelFlatten();
	abortPendingLoad();
});
</script>

<template>
	<!-- eslint-disable vue/no-undef-components -- vue-konva registers v-stage and other components on lazy loading -->
	<div
		class="canvas-block"
		:class="{ 'canvas-full-screen': isFullScreen, 'canvas-compact': modeConfig.isCompact }"
	>
		<CanvasControls
			v-if="!isDisabled"
			:is-pan-active="!isStrokeActive"
			:mode-config="modeConfig"
			:is-full-screen="isFullScreen"
			:is-blank-canvas="!draw.committedStrokes.value.length"
			:disable-clear-all="!draw.committedStrokes.value.length"
			:disable-undo="!draw.committedStrokes.value.length"
			:disable-zoom-in="draw.isZoomInDisabled.value"
			:disable-zoom-out="draw.isZoomOutDisabled.value"
			@change-pan="(val) => (isStrokeActive = !val)"
			@clear-all="draw.clearAll"
			@close-full-screen="closeFullScreen"
			@zoom-in="draw.zoomIn"
			@zoom-out="draw.zoomOut"
			@undo="draw.undo"
			@change-color="(color) => (activeColor = color)"
		/>
		<div ref="containerRef" class="canvas-stage-wrap">
			<div
				v-if="!isFullScreen && !isDisabled"
				class="canvas-overlay full-screen-overlay"
				@click="openFullScreen"
			/>
			<Message
				v-if="showDrawInstruction"
				severity="contrast"
				closable
				size="small"
				class="canvas-snackbar"
			>
				{{ t('canvas_block.draw_instruction.message') }}
			</Message>
			<p v-if="isLoading" class="canvas-status">
				{{ t('canvas_block.loading_image.message') }}
			</p>
			<p v-else-if="loadError" class="canvas-status canvas-status-error">
				{{ t('canvas_block.load_image.error') }}
			</p>

			<v-stage
				v-else
				ref="stageRef"
				:config="stageConfig"
				class="canvas-stage"
				:class="{ 'canvas-pan-mode': !isStrokeActive, 'canvas-disabled': isDisabled }"
				@pointerdown="draw.onPointerDown"
				@pointermove="draw.onPointerMove"
				@pointerup="draw.onPointerUp"
				@pointerleave="draw.onPointerUp"
				@pointercancel="draw.onPointerUp"
			>
				<v-layer :config="layerConfig">
					<v-image v-if="imageEl" :config="imageConfig" />
					<v-rect v-else :config="blankBackgroundConfig" />
					<v-line v-if="modeConfig.hasGuideLines && !imageEl" :config="guideLineConfig" />
				</v-layer>

				<v-layer ref="strokesLayerRef" :config="layerConfig">
					<v-line
						v-for="stroke in draw.committedStrokes.value"
						:key="stroke.id"
						:config="stroke.config"
					/>
					<v-line
						v-if="draw.liveStrokePoints.value.length >= 2"
						:config="draw.liveStrokeConfig.value"
					/>
				</v-layer>
			</v-stage>
		</div>
	</div>
</template>

<style scoped lang="scss">
@use '../../../assets/styles/style' as odk;

.canvas-block {
	position: relative;
	display: flex;
	flex-direction: column;
	width: 100%;
	background: var(--odk-base-background-color);
	overflow: hidden;
}

.canvas-stage-wrap {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--odk-inactive-background-color);
	width: 100%;
	height: 445px;
	overflow: hidden;
}

.canvas-compact .canvas-stage-wrap {
	height: 300px;
}

.canvas-stage {
	cursor: crosshair;
	flex-shrink: 0;

	&.canvas-pan-mode {
		cursor: grab;
	}

	&.canvas-disabled {
		cursor: default;
		pointer-events: none;
	}
}

.canvas-snackbar {
	width: max-content;
	max-width: calc(100% - (var(--odk-spacing-m) * 2));
	position: absolute;
	z-index: var(--odk-z-index-form-floating);
	bottom: var(--odk-spacing-m);
	left: 50%;
	transform: translateX(-50%);
}

.canvas-status {
	padding: var(--odk-spacing-xxl);
	text-align: center;
	color: var(--odk-muted-text-color);
}

.canvas-status-error {
	color: var(--odk-error-text-color);
}

.canvas-overlay.full-screen-overlay {
	display: none;
}

@include odk.sm-constrained {
	.canvas-block {
		--is-mobile-active: 1;
	}

	.canvas-compact .canvas-stage-wrap {
		height: 200px;
	}

	.canvas-overlay.full-screen-overlay {
		display: block;
		position: absolute;
		inset: 0;
		z-index: var(--odk-z-index-top-overlay);
	}

	.canvas-block:not(.canvas-full-screen) .canvas-stage {
		pointer-events: none;
	}

	.canvas-block.canvas-full-screen {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100dvh;
		z-index: var(--odk-z-index-topmost);
		border: none;
		overscroll-behavior: none;
		touch-action: none;

		.canvas-stage-wrap {
			height: 100%;
		}

		.canvas-stage {
			touch-action: none;
		}

		.canvas-snackbar {
			bottom: 100px;
		}
	}
}
</style>
