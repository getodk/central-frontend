import { getModeConfig, type Mode, MODES } from '@/components/common/map/getModeConfig.ts';
import { formatODKValue, isWebGLAvailable } from '@/components/common/map/map-helpers.ts';
import {
	getDrawStyles,
	getSavedStyles,
	getSelectedStyles,
	getUnselectedStyles,
} from '@/components/common/map/map-styles.ts';
import {
	FEATURE_ID_PROPERTY,
	IS_SELECTED_PROPERTY,
	SAVED_ID_PROPERTY,
	SELECTED_ID_PROPERTY,
	SELECTED_VERTEX_INDEX_PROPERTY,
	useMapFeatures,
	type UseMapFeatures,
} from '@/components/common/map/useMapFeatures.ts';
import {
	type DrawFeatureType,
	useMapInteractions,
	type UseMapInteractions,
} from '@/components/common/map/useMapInteractions.ts';
import {
	COORDINATE_LAYOUT_XYZM,
	DEFAULT_VIEW_CENTER,
	MIN_ZOOM,
	useMapViewControls,
	type UseMapViewControls,
} from '@/components/common/map/useMapViewControls.ts';
import {
	deleteVertexFromFeature,
	getVertexByIndex,
} from '@/components/common/map/vertex-geometry.ts';
import type { FeatureCollection, Feature as GeoJsonFeature } from 'geojson';
import { Map, View } from 'ol';
import { Attribution, Zoom } from 'ol/control';
import type { Coordinate } from 'ol/coordinate';
import Feature from 'ol/Feature';
import { LineString, Point, Polygon } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import { fromLonLat, get as getProjection } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { shared as iconImageCache } from 'ol/style/IconImageCache';
import { shallowRef, watch } from 'vue';

export const STATES = {
	LOADING: 'loading',
	READY: 'ready',
	ERROR: 'error',
	CAPTURING: 'capturing',
} as const;

const DEFAULT_VIEW_PROJECTION = 'EPSG:3857';

export const ODK_VALUE_PROPERTY = 'odk_value';

interface MapBlockConfig {
	mode: Mode;
	drawFeatureType?: DrawFeatureType;
}

interface MapBlockEvents {
	onFeaturePlacement: () => void;
	onVertexSelect: (vertex: Coordinate) => void;
}

export function useMapBlock(config: MapBlockConfig, events: MapBlockEvents) {
	let mapInstance: Map | undefined;
	let mapInteractions: UseMapInteractions | undefined;
	let mapViewControls: UseMapViewControls | undefined;
	let mapFeatures: UseMapFeatures | undefined;

	const currentMode = getModeConfig(config.mode);
	const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
	const errorMessage = shallowRef<{ title: string; message: string } | undefined>();

	const featuresSource = new VectorSource();
	const singleFeatureLayer = new VectorLayer({
		source: featuresSource,
		style:
			config.mode === MODES.DRAW
				? getDrawStyles(IS_SELECTED_PROPERTY, SELECTED_VERTEX_INDEX_PROPERTY)
				: getSavedStyles(FEATURE_ID_PROPERTY, SAVED_ID_PROPERTY),
		updateWhileAnimating: true,
	});
	const multiFeatureLayer = new WebGLVectorLayer({
		source: featuresSource,
		style: [
			...getUnselectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSelectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSavedStyles(FEATURE_ID_PROPERTY, SAVED_ID_PROPERTY),
		],
		variables: { [SAVED_ID_PROPERTY]: '', [SELECTED_ID_PROPERTY]: '' },
	});

	const initMap = (
		mapContainer: HTMLElement,
		geoJSON: FeatureCollection,
		savedFeatureValue: GeoJsonFeature | undefined
	): void => {
		if (mapInstance) {
			return;
		}

		if (currentMode.capabilities.canLoadMultiFeatures && !isWebGLAvailable()) {
			currentState.value = STATES.ERROR;
			errorMessage.value = {
				title: 'Graphics issue detected',
				message: 'Your browser cannot display the map now. Enable graphics acceleration settings.',
			};
			return;
		}

		mapInstance = new Map({
			target: mapContainer,
			layers: [new TileLayer({ source: new OSM() })],
			view: new View({
				center: DEFAULT_VIEW_CENTER,
				zoom: MIN_ZOOM,
				// Prevent map cloning at low zoom during panning, which disrupts feature selection.
				multiWorld: false,
				projection: DEFAULT_VIEW_PROJECTION,
				extent: getProjection(DEFAULT_VIEW_PROJECTION)?.getExtent(),
			}),
			controls: [new Zoom(), new Attribution({ collapsible: false })],
		});

		mapViewControls = useMapViewControls(mapInstance);
		mapInteractions = useMapInteractions(
			mapInstance,
			currentMode.capabilities,
			config.drawFeatureType
		);
		mapFeatures = useMapFeatures(
			mapInstance,
			currentMode.capabilities,
			mapViewControls,
			multiFeatureLayer
		);

		initLayer(geoJSON, savedFeatureValue);
		mapInteractions.setupMapVisibilityObserver(mapContainer, () =>
			mapViewControls?.stopWatchingCurrentLocation()
		);
		currentState.value = STATES.READY;
	};

	const initLayer = (geoJSON: FeatureCollection, savedFeatureValue: GeoJsonFeature | undefined) => {
		if (!mapInstance) {
			return;
		}

		if (currentMode.capabilities.canLoadMultiFeatures) {
			mapInstance.addLayer(multiFeatureLayer);
			updateFeatureCollection(geoJSON, savedFeatureValue);
			return;
		}

		mapInstance.addLayer(singleFeatureLayer);
		if (!savedFeatureValue) {
			return;
		}

		const feature = mapFeatures?.createFeature(savedFeatureValue);
		loadAndSaveSingleFeature(feature);
	};

	const setupMapInteractions = (isReadOnly: boolean) => {
		if (!mapInstance || !mapInteractions) {
			return;
		}

		mapInteractions.removeMapInteractions();

		if (isReadOnly) {
			return;
		}

		if (currentMode.interactions.select) {
			mapInteractions.toggleSelectEvent(true, (feature, vertexIndex) => {
				mapFeatures?.selectFeature(feature, vertexIndex);
				events.onVertexSelect(getVertexByIndex(feature, vertexIndex));
			});
		}

		if (currentMode.interactions.dragFeature) {
			mapInteractions.setupFeatureDrag(singleFeatureLayer, (feature) =>
				handlePointPlacement(feature)
			);
		}

		if (currentMode.interactions.longPress) {
			mapInteractions.setupLongPressPoint(featuresSource, (feature) =>
				handlePointPlacement(feature)
			);

			if (currentMode.interactions.dragFeatureAndVertex) {
				mapInteractions.setupVertexDrag(featuresSource, (feature) => handlePointPlacement(feature));
			}
		}
	};

	const updateAndSaveFeature = (feature: Feature) => {
		feature.set(ODK_VALUE_PROPERTY, formatODKValue(feature));
		mapFeatures?.saveFeature(feature);
	};

	const handlePointPlacement = (feature: Feature) => {
		updateAndSaveFeature(feature);
		if (events.onFeaturePlacement) {
			events.onFeaturePlacement();
		}
	};

	const deleteVertex = () => {
		if (!canDeleteFeatureOrVertex()) {
			return;
		}

		const feature = mapFeatures?.getSelectedFeature() as Feature<LineString | Polygon>;
		const vertexIndex: number | undefined = feature?.get(SELECTED_VERTEX_INDEX_PROPERTY) as number;
		if (!feature || vertexIndex === undefined) {
			return;
		}

		mapInteractions?.savePreviousFeatureState(feature);
		const coordsLeft = deleteVertexFromFeature(feature, vertexIndex);
		if (coordsLeft > 0) {
			updateAndSaveFeature(feature);
			return;
		}

		clearMap();
	};

	const deleteFeature = () => {
		const feature = mapFeatures?.getSelectedFeature();
		if (canDeleteFeatureOrVertex() && feature) {
			mapInteractions?.savePreviousFeatureState(feature);
			clearMap();
		}
	};

	const confirmDeleteFeature = () => {
		const feature = mapFeatures?.getSelectedFeature();
		return feature && feature.get(SELECTED_VERTEX_INDEX_PROPERTY) === undefined;
	};

	const canDeleteFeatureOrVertex = () => {
		const { canDeleteFeature, canLoadMultiFeatures } = currentMode.capabilities;
		return canDeleteFeature && !canLoadMultiFeatures;
	};

	const canUndoChange = () => {
		const { canUndoLastChange, canLoadMultiFeatures } = currentMode.capabilities;
		const hasState = !!mapInteractions?.hasPreviousFeatureState();
		return hasState && canUndoLastChange && !canLoadMultiFeatures;
	};

	const undoLastChange = () => {
		if (canUndoChange()) {
			clearMap();
			const previousFeatureState = mapInteractions?.popPreviousFeatureState();
			if (previousFeatureState) {
				featuresSource.addFeature(previousFeatureState);
				updateAndSaveFeature(previousFeatureState);
			}
		}
	};

	const clearMap = () => {
		unselectFeature();
		clearSavedFeature();
		featuresSource.clear();
	};

	const updateFeatureCollection = (features: FeatureCollection, savedFeature?: GeoJsonFeature) => {
		loadFeatureCollection(features);
		mapFeatures?.findAndSaveFeature(featuresSource, savedFeature, true);
	};

	const loadAndSaveSingleFeature = (feature: Feature | undefined) => {
		if (!mapInstance || currentMode.capabilities.canLoadMultiFeatures || !feature) {
			return;
		}

		currentState.value = STATES.LOADING;
		mapFeatures?.loadAndSaveSingleFeature(featuresSource, feature);
		currentState.value = STATES.READY;
	};

	const loadFeatureCollection = (geoJSON: FeatureCollection): void => {
		if (!mapInstance || !currentMode.capabilities.canLoadMultiFeatures) {
			return;
		}

		currentState.value = STATES.LOADING;
		clearMap();

		if (geoJSON.features.length) {
			mapFeatures?.loadFeatureCollection(featuresSource, geoJSON);
		} else {
			mapViewControls?.centerFullWorldView();
		}

		currentState.value = STATES.READY;
	};

	const saveCurrentLocation = () => {
		const location = mapViewControls?.getUserCurrentLocation();
		if (!currentMode.capabilities.canSaveCurrentLocation || !location) {
			return;
		}

		const coords = [location.longitude, location.latitude];
		if (location.altitude != null) {
			coords.push(location.altitude);
		}

		if (location.accuracy != null) {
			coords.push(location.accuracy);
		}

		const feature = new Feature({
			geometry: new Point(fromLonLat(coords), COORDINATE_LAYOUT_XYZM),
		});
		feature.set(ODK_VALUE_PROPERTY, formatODKValue(feature));
		loadAndSaveSingleFeature(feature);
	};

	const discardSavedFeature = () => {
		if (currentMode.capabilities.canLoadMultiFeatures) {
			clearSavedFeature();
			return;
		}
		clearMap();
	};

	const unselectFeature = () => mapFeatures?.selectFeature(undefined);

	const clearSavedFeature = () => mapFeatures?.saveFeature(undefined);

	const teardownMap = () => {
		mapViewControls?.stopWatchingCurrentLocation();
		mapViewControls = undefined;
		mapInteractions?.teardownMap();
		mapInteractions = undefined;
		mapFeatures = undefined;

		iconImageCache.clear();
		if (mapInstance) {
			const layers = mapInstance.getLayers().getArray();
			layers.forEach((layer) => {
				layer.dispose();
				mapInstance!.removeLayer(layer);
			});
			const olCanvas = mapInstance.getViewport().querySelector('canvas');
			if (olCanvas) {
				const gl = olCanvas.getContext('webgl') ?? olCanvas.getContext('webgl2');
				if (gl) {
					const loseContext = gl.getExtension('WEBGL_lose_context');
					if (loseContext) {
						loseContext.loseContext();
					}
				}
			}
			mapInstance.getInteractions().clear();
			mapInstance.getOverlays().clear();
			mapInstance.dispose();
			mapInstance.setTarget();
			mapInstance = undefined;
		}
	};

	const shouldShowMapOverlay = () => {
		const { canShowMapOverlayOnError, canShowMapOverlay } = currentMode.capabilities;
		const hasLocationFeature = mapViewControls?.hasCurrentLocationFeature();
		const hasNoRelevantFeature = !hasLocationFeature && !mapFeatures?.getSavedFeature();

		if (currentState.value === STATES.ERROR) {
			return canShowMapOverlayOnError && hasNoRelevantFeature;
		}

		return currentState.value === STATES.READY && canShowMapOverlay && hasNoRelevantFeature;
	};

	const canSaveCurrentLocation = () => {
		const hasLocationFeature = !!mapViewControls?.hasCurrentLocationFeature();
		return currentMode.capabilities.canSaveCurrentLocation && hasLocationFeature;
	};

	const canRemoveCurrentLocation = () => {
		return currentMode.capabilities.canRemoveCurrentLocation && !!mapFeatures?.getSavedFeature();
	};

	const canLongPressAndDrag = () => {
		const { longPress, dragFeature, dragFeatureAndVertex } = currentMode.interactions;
		return longPress && (dragFeature || dragFeatureAndVertex);
	};

	const watchCurrentLocation = () => {
		currentState.value = STATES.CAPTURING;

		mapViewControls?.watchCurrentLocation(
			() => (currentState.value = STATES.READY),
			() => {
				currentState.value = STATES.ERROR;
				// TODO: translations
				errorMessage.value = {
					title: 'Cannot access location',
					message:
						'Grant location permission in the browser settings and make sure location is turned on.',
				};
			}
		);
	};

	const findAndSaveFeature = (feature: GeoJsonFeature | undefined) => {
		return mapFeatures?.findAndSaveFeature(
			featuresSource,
			feature,
			currentMode.capabilities.canViewProperties
		);
	};

	watch(
		() => currentState.value,
		(newState) => {
			if (newState !== STATES.ERROR) {
				errorMessage.value = undefined;
			}
		}
	);

	return {
		currentState,
		errorMessage,
		initMap,
		teardownMap,
		updateFeatureCollection,
		setupMapInteractions,

		isMapEmpty: () => featuresSource.isEmpty(),
		fitToAllFeatures: () => mapViewControls?.fitToAllFeatures(featuresSource),
		watchCurrentLocation,
		canSaveCurrentLocation,
		canRemoveCurrentLocation,

		discardSavedFeature,
		saveSelectedFeature: () => mapFeatures?.saveSelectedFeature(),
		saveCurrentLocation,
		findAndSaveFeature,
		getSavedFeature: () => mapFeatures?.getSavedFeature()?.clone(),
		getSavedFeatureValue: () => mapFeatures?.getSavedFeatureValue(),
		isSavedFeatureSelected: () => !!mapFeatures?.isSavedFeatureSelected(),

		confirmDeleteFeature,
		deleteFeature,
		deleteVertex,
		canDeleteFeatureOrVertex,
		canUndoChange,
		undoLastChange,

		isFeatureSelected: () => !!mapFeatures?.getSelectedFeature(),
		getSelectedFeatureProperties: () => mapFeatures?.getSelectedFeatureProperties(),
		selectSavedFeature: () => mapFeatures?.selectFeature(mapFeatures?.getSavedFeature()),
		unselectFeature,

		canLongPressAndDrag,
		canViewProperties: () => currentMode.capabilities.canViewProperties,
		shouldShowMapOverlay,
	};
}
