/**
 * IMPORTANT: Lazy-loaded for Konva isolation. Keep Konva imports/code here only to bundle separately and
 * load on demand. Avoids main bundle bloat.
 */
import { shallowRef, computed, onUnmounted } from 'vue';
import type { Ref, ComputedRef, ShallowRef } from 'vue';
import type Konva from 'konva';
import type { Vector2d } from 'konva/lib/types';
import type { VueKonvaRef } from 'vue-konva';

export interface Stroke {
	readonly id: number;
	readonly config: Readonly<Konva.LineConfig>;
}

interface UsePointerDrawingOptions {
	stageRef: Ref<VueKonvaRef<Konva.Stage> | undefined>;
	strokesLayerRef: Ref<VueKonvaRef<Konva.Layer> | undefined>;
	containerRef: Ref<HTMLDivElement | undefined>;
	containerSize: Ref<Size>;
	imageSize: Ref<Size>;
	isStrokeActive: Ref<boolean>;
	activeColor: Ref<string>;
	hasBackgroundImage: boolean;
	imageEl: Ref<HTMLImageElement | undefined>;
	onStrokeCommitted: () => void;
}

interface ActiveStrokeState {
	active: boolean;
	livePoints: number[];
	rafId: number | null;
	stage: Konva.Stage | null;
	scaleInv: number;
	nextStrokeId: number;
}

interface Size {
	width: number;
	height: number;
}

interface PanState {
	active: boolean;
	lastX: number;
	lastY: number;
}

interface BoundingBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export const DEFAULT_STROKE_COLOR = '000000';
export const STROKE_WIDTH = 7;
const MIN_STROKE_POINTS = 2 * 2; // 2 points, each stored as (x, y)
const OUTPUT_MIME_TYPE = 'image/jpeg';
const OUTPUT_FILE_NAME = 'canvas.jpg';
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

/**
 * Scale image to fit container (if portrait then fit height, if landscape then fit width). Cap at 1 to avoid
 * upscaling small images, since users can zoom in manually.
 */
const calculateBaseScale = (container: Size, image: Size): number => {
	const { width: imgWidth, height: imgHeight } = safeSize(image);
	const { width: containerWidth, height: containerHeight } = safeSize(container);
	const scaleX = containerWidth / imgWidth;
	const scaleY = containerHeight / imgHeight;
	return Math.min(scaleX, scaleY, 1);
};

const safeSize = ({ width = 0, height = 0 }: Partial<Size> = {}): Size => ({
	width: Math.max(1, width),
	height: Math.max(1, height),
});

const flattenStage = async (
	stage: Konva.Stage,
	baseScale: number,
	crop?: BoundingBox
): Promise<File | null> => {
	if (baseScale <= 0) {
		return null;
	}

	const blob = (await stage.toBlob({
		pixelRatio: 1 / baseScale,
		mimeType: OUTPUT_MIME_TYPE,
		quality: 0.9, // Visible quality to 100% but lowers file size significantly.
		...crop,
	})) as Blob | null;
	return !blob ? null : new File([blob], OUTPUT_FILE_NAME, { type: OUTPUT_MIME_TYPE });
};

// Crop covers committed strokes, clamped to keep the cropped area inside the stage's
// white background (anything outside is transparent and would turn black in JPEG).
const computeStrokesCrop = (stage: Konva.Stage, layer: Konva.Layer): BoundingBox | null => {
	const baseImage = layer.getClientRect({ relativeTo: stage });
	const x = Math.max(0, baseImage.x);
	const y = Math.max(0, baseImage.y);
	const width = Math.min(stage.width(), baseImage.x + baseImage.width) - x;
	const height = Math.min(stage.height(), baseImage.y + baseImage.height) - y;
	return width <= 0 || height <= 0 ? null : { x, y, width, height };
};

const getStrokeConfig = (points: number[], color: string): Konva.LineConfig => {
	return {
		points,
		stroke: color,
		strokeWidth: STROKE_WIDTH,
		lineCap: 'round',
		lineJoin: 'round',
		tension: 0,
	};
};

const makeClientPosition = (evt: PointerEvent): Vector2d => {
	return { x: evt.clientX, y: evt.clientY };
};

const cancelDrawRaf = (activeStroke: ActiveStrokeState) => {
	if (activeStroke.rafId !== null) {
		cancelAnimationFrame(activeStroke.rafId);
		activeStroke.rafId = null;
	}
};

const imagePointerPosition = (activeStroke: ActiveStrokeState): Vector2d | null => {
	const pos = activeStroke.stage?.getPointerPosition();
	return !pos ? null : { x: pos.x * activeStroke.scaleInv, y: pos.y * activeStroke.scaleInv };
};

const startPan = (
	konvaEvent: Konva.KonvaEventObject<PointerEvent>,
	containerRef: Ref<HTMLDivElement | undefined>,
	panState: PanState
) => {
	if (!containerRef.value) {
		return;
	}
	const pos = makeClientPosition(konvaEvent.evt);
	panState.active = true;
	panState.lastX = pos.x;
	panState.lastY = pos.y;
};

const startStroke = (
	activeStroke: ActiveStrokeState,
	liveStrokePoints: ShallowRef<number[]>,
	options: UsePointerDrawingOptions,
	effectiveScale: ComputedRef<number>
) => {
	if (options.hasBackgroundImage && !options.imageEl.value) {
		return;
	}

	cancelDrawRaf(activeStroke);
	activeStroke.stage = options.stageRef.value?.getNode() ?? null;
	// Inverse scale to convert screen coordinates to image coordinates.
	activeStroke.scaleInv = 1 / effectiveScale.value;

	const pos = imagePointerPosition(activeStroke);
	if (!pos) {
		return;
	}
	// Duplicate point enables single-tap to place dots.
	activeStroke.active = true;
	activeStroke.livePoints = [pos.x, pos.y, pos.x, pos.y];
	liveStrokePoints.value = activeStroke.livePoints.slice();
};

const movePan = (
	evt: PointerEvent,
	panState: PanState,
	containerRef: Ref<HTMLDivElement | undefined>
) => {
	if (!containerRef.value) {
		return;
	}
	const pos = makeClientPosition(evt);
	containerRef.value.scrollLeft += panState.lastX - pos.x;
	containerRef.value.scrollTop += panState.lastY - pos.y;
	panState.lastX = pos.x;
	panState.lastY = pos.y;
};

const appendStrokePoint = (
	activeStroke: ActiveStrokeState,
	liveStrokePoints: ShallowRef<number[]>
) => {
	const pos = activeStroke.stage?.getPointerPosition();
	if (!pos) {
		return;
	}
	// Collect points in a plain array, then update the reactive ref once per frame for performance.
	activeStroke.livePoints.push(pos.x * activeStroke.scaleInv, pos.y * activeStroke.scaleInv);
	activeStroke.rafId ??= requestAnimationFrame(() => {
		liveStrokePoints.value = activeStroke.livePoints.slice();
		activeStroke.rafId = null;
	});
};

const resetDrawing = (
	activeStroke: ActiveStrokeState,
	committedStrokes: ShallowRef<Stroke[]>,
	liveStrokePoints: ShallowRef<number[]>
) => {
	committedStrokes.value = [];
	liveStrokePoints.value = [];
	activeStroke.active = false;
	activeStroke.livePoints = [];
	cancelDrawRaf(activeStroke);
};

export const useCanvasDrawing = (options: UsePointerDrawingOptions) => {
	const committedStrokes = shallowRef<Stroke[]>([]);
	const liveStrokePoints = shallowRef<number[]>([]);
	const zoom = shallowRef(1);
	const baseScale = computed(() =>
		calculateBaseScale(options.containerSize.value, options.imageSize.value)
	);
	const effectiveScale = computed(() => baseScale.value * zoom.value);
	const isZoomInDisabled = computed(() => zoom.value >= MAX_ZOOM);
	const isZoomOutDisabled = computed(() => zoom.value <= MIN_ZOOM);

	const liveStrokeConfig = computed(() =>
		getStrokeConfig(liveStrokePoints.value, options.activeColor.value)
	);

	const activeStroke: ActiveStrokeState = {
		active: false,
		livePoints: [],
		rafId: null,
		stage: null,
		scaleInv: 1,
		nextStrokeId: 0,
	};

	const panState: PanState = {
		active: false,
		lastX: 0,
		lastY: 0,
	};

	const clearAllStrokes = () => {
		if (!committedStrokes.value.length) {
			return;
		}
		committedStrokes.value = [];
		options.onStrokeCommitted();
	};

	const undoStroke = () => {
		if (!committedStrokes.value.length) {
			return;
		}
		committedStrokes.value = committedStrokes.value.slice(0, -1);
		options.onStrokeCommitted();
	};

	const commitStroke = () => {
		if (activeStroke.livePoints.length < MIN_STROKE_POINTS) {
			return;
		}
		const newStroke: Stroke = {
			id: activeStroke.nextStrokeId++,
			config: getStrokeConfig([...activeStroke.livePoints], options.activeColor.value),
		};
		committedStrokes.value = [...committedStrokes.value, newStroke];
		options.onStrokeCommitted();
	};

	const handlePointerUp = () => {
		if (panState.active) {
			panState.active = false;
			return;
		}
		if (!activeStroke.active) {
			return;
		}
		activeStroke.active = false;
		cancelDrawRaf(activeStroke);
		commitStroke();
		activeStroke.livePoints = [];
		liveStrokePoints.value = [];
	};

	const handlePointerMove = (konvaEvent: Konva.KonvaEventObject<PointerEvent>) => {
		if (panState.active) {
			movePan(konvaEvent.evt, panState, options.containerRef);
			return;
		}

		if (activeStroke.active) {
			appendStrokePoint(activeStroke, liveStrokePoints);
			return;
		}
	};

	const handlePointerDown = (konvaEvent: Konva.KonvaEventObject<PointerEvent>) => {
		konvaEvent.evt.preventDefault();
		if (!options.isStrokeActive.value) {
			startPan(konvaEvent, options.containerRef, panState);
			return;
		}
		startStroke(activeStroke, liveStrokePoints, options, effectiveScale);
	};

	const handleFlattenStage = async (): Promise<File | null> => {
		const stage = options.stageRef.value?.getNode();
		if (!stage) {
			return null;
		}

		if (options.hasBackgroundImage || options.imageEl.value) {
			return flattenStage(stage, baseScale.value);
		}

		const layer = options.strokesLayerRef.value?.getNode();
		if (!layer) {
			return null;
		}

		const crop = computeStrokesCrop(stage, layer);
		return crop ? flattenStage(stage, baseScale.value, crop) : null;
	};

	onUnmounted(() => {
		cancelDrawRaf(activeStroke);
		activeStroke.stage = null;
	});

	return {
		committedStrokes,
		liveStrokePoints,
		liveStrokeConfig,
		effectiveScale,
		isZoomInDisabled,
		isZoomOutDisabled,
		safeSize: (element?: Partial<Size>) => safeSize(element),
		clearAll: () => clearAllStrokes(),
		flattenStage: () => handleFlattenStage(),
		resetDrawingState: () => resetDrawing(activeStroke, committedStrokes, liveStrokePoints),
		resetZoom: () => (zoom.value = 1),
		onPointerDown: (konvaEvent: Konva.KonvaEventObject<PointerEvent>) =>
			handlePointerDown(konvaEvent),
		onPointerMove: (konvaEvent: Konva.KonvaEventObject<PointerEvent>) =>
			handlePointerMove(konvaEvent),
		onPointerUp: () => handlePointerUp(),
		undo: () => undoStroke(),
		zoomIn: () => (zoom.value = Math.min(MAX_ZOOM, zoom.value + ZOOM_STEP)),
		zoomOut: () => (zoom.value = Math.max(MIN_ZOOM, zoom.value - ZOOM_STEP)),
	};
};
