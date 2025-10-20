import {
	getSavedStyles,
	getSelectedStyles,
	getUnselectedStyles,
} from '@/components/common/map/map-styles.ts';
import type { FeatureCollection } from 'geojson';
import { Map, MapBrowserEvent, View } from 'ol';
import { Attribution, Zoom } from 'ol/control';
import { getCenter } from 'ol/extent';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import { LineString, Point, Polygon } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import WebGLVectorLayer from 'ol/layer/WebGLVector';
import type { Pixel } from 'ol/pixel';
import { fromLonLat } from 'ol/proj';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { computed, shallowRef, watch } from 'vue';
import { get as getProjection } from 'ol/proj';

type GeometryType = LineString | Point | Polygon;

const STATES = {
	LOADING: 'loading',
	READY: 'ready',
	ERROR: 'error',
} as const;

const DEFAULT_GEOJSON_PROJECTION = 'EPSG:4326';
const DEFAULT_VIEW_PROJECTION = 'EPSG:3857';
const DEFAULT_VIEW_CENTER = [0, 0];
const MAX_ZOOM = 16;
const MIN_ZOOM = 2;
const GEOLOCATION_TIMEOUT_MS = 10 * 1000;
const ANIMATION_TIME = 1000;
const SMALL_DEVICE_WIDTH = 576;
const FEATURE_ID_PROPERTY = 'odk_feature_id';
const SAVED_ID_PROPERTY = 'savedId';
const SELECTED_ID_PROPERTY = 'selectedId';

export function useMapBlock() {
	const currentState = shallowRef<(typeof STATES)[keyof typeof STATES]>(STATES.LOADING);
	const errorMessage = shallowRef<{ title: string; message: string } | undefined>();
	let mapInstance: Map | undefined;
	const savedFeature = shallowRef<Feature<GeometryType> | undefined>();
	const selectedFeature = shallowRef<Feature<GeometryType> | undefined>();
	const selectedFeatureProperties = computed(() => {
		return selectedFeature.value?.getProperties();
	});

	const featuresSource = new VectorSource();
	const featuresVectorLayer = new WebGLVectorLayer({
		source: featuresSource,
		style: [
			...getUnselectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSelectedStyles(FEATURE_ID_PROPERTY, SELECTED_ID_PROPERTY, SAVED_ID_PROPERTY),
			...getSavedStyles(FEATURE_ID_PROPERTY, SAVED_ID_PROPERTY),
		],
		variables: { [SAVED_ID_PROPERTY]: '', [SELECTED_ID_PROPERTY]: '' },
	});

	const initializeMap = (mapContainer: HTMLElement, geoJSON: FeatureCollection): void => {
		if (mapInstance) {
			return;
		}

		mapInstance = new Map({
			target: mapContainer,
			layers: [new TileLayer({ source: new OSM() }), featuresVectorLayer],
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

		currentState.value = STATES.READY;
		loadGeometries(geoJSON);
	};

	const setCursorPointer = (event: MapBrowserEvent) => {
		if (event.dragging || !mapInstance) {
			return;
		}

		const hit = mapInstance.hasFeatureAtPixel(event.pixel, {
			layerFilter: (layer) => layer instanceof WebGLVectorLayer,
		});

		mapInstance.getTargetElement().style.cursor = hit ? 'pointer' : '';
	};

	const handleClick = (event: MapBrowserEvent) => selectFeatureByPosition(event.pixel);

	const toggleClickBinding = (bindClick: boolean) => {
		mapInstance?.un('click', handleClick);
		mapInstance?.un('pointermove', setCursorPointer);

		if (bindClick) {
			mapInstance?.on('click', handleClick);
			mapInstance?.on('pointermove', setCursorPointer);
		}
	};

	const fitToAllFeatures = (): void => {
		if (featuresSource.isEmpty()) {
			return;
		}

		const extent = featuresSource.getExtent();
		if (extent?.length) {
			mapInstance?.getView().fit(extent, {
				padding: [50, 50, 50, 50],
				duration: ANIMATION_TIME,
				maxZoom: MAX_ZOOM,
			});
		}
	};

	const centerCurrentLocation = (): void => {
		// TODO: translations
		const friendlyError = {
			title: 'Cannot access location',
			message:
				'Grant location permission in the browser settings and make sure location is turned on.',
		};

		if (!navigator.geolocation) {
			currentState.value = STATES.ERROR;
			errorMessage.value = friendlyError;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const coords = fromLonLat([position.coords.longitude, position.coords.latitude]);
				mapInstance
					?.getView()
					.animate({ center: coords, zoom: MAX_ZOOM, duration: ANIMATION_TIME });
				currentState.value = STATES.READY;
			},
			() => {
				currentState.value = STATES.ERROR;
				errorMessage.value = friendlyError;
			},
			{ enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS }
		);
	};

	const centerFeatureLocation = (feature: Feature<GeometryType>): void => {
		const geometry = feature.getGeometry();
		const view = mapInstance?.getView();
		const mapWidth = mapInstance?.getSize()?.[0];
		if (!geometry || !view || mapWidth == null) {
			return;
		}

		const pixelOffsetY = mapWidth < SMALL_DEVICE_WIDTH ? -130 : 0;
		const pixelOffsetX = mapWidth < SMALL_DEVICE_WIDTH ? 0 : -70;

		const zoomResolution = view.getResolution() ?? 1;
		const xOffsetInMapUnits = -pixelOffsetX * zoomResolution;
		const yOffsetInMapUnits = -pixelOffsetY * zoomResolution;

		// Turning angles into usable numbers
		const rotation = view.getRotation();
		const cosRotation = Math.cos(rotation);
		const sinRotation = Math.sin(rotation);

		const [featureCenterLong, featureCenterLat] = getCenter(geometry.getExtent());
		const targetCoordinates = [
			featureCenterLong - xOffsetInMapUnits * cosRotation + yOffsetInMapUnits * sinRotation,
			featureCenterLat - xOffsetInMapUnits * sinRotation - yOffsetInMapUnits * cosRotation,
		];

		view.animate({
			center: targetCoordinates,
			duration: ANIMATION_TIME,
		});
	};

	const loadGeometries = (geoJSON: FeatureCollection): void => {
		if (!mapInstance) {
			return;
		}

		currentState.value = STATES.LOADING;
		selectFeature(undefined);
		saveFeature(undefined);
		featuresSource.clear(true);

		if (!geoJSON.features.length) {
			mapInstance?.getView().animate({
				center: DEFAULT_VIEW_CENTER,
				zoom: MIN_ZOOM,
				duration: ANIMATION_TIME,
			});
			currentState.value = STATES.READY;
			return;
		}

		const features = new GeoJSON().readFeatures(geoJSON, {
			dataProjection: DEFAULT_GEOJSON_PROJECTION,
			featureProjection: mapInstance.getView().getProjection(),
		});

		features.forEach((feature) => {
			if (!feature.get(FEATURE_ID_PROPERTY)) {
				feature.set(FEATURE_ID_PROPERTY, crypto.randomUUID());
			}
		});
		featuresSource.addFeatures(features);
		currentState.value = STATES.READY;

		fitToAllFeatures();
	};

	const selectFeatureByPosition = (position: Pixel): void => {
		const hitFeatures = mapInstance?.getFeaturesAtPixel(position, {
			layerFilter: (layer) => layer instanceof WebGLVectorLayer,
		});

		const featureToSelect = hitFeatures?.length
			? (hitFeatures[0] as Feature<GeometryType>)
			: undefined;

		selectFeature(featureToSelect);
	};

	const selectFeature = (feature?: Feature<GeometryType>) => (selectedFeature.value = feature);

	const saveFeature = (feature?: Feature<GeometryType>) => (savedFeature.value = feature);

	const setSavedByValueProp = (value: string | undefined): void => {
		if (!value?.length) {
			return;
		}

		const featureToSave = featuresSource.forEachFeature((feature) => {
			return feature.getProperties()?.odk_value === value ? feature : undefined;
		});

		if (!featureToSave) {
			return;
		}

		saveFeature(featureToSave as Feature<GeometryType>);
		centerFeatureLocation(featureToSave as Feature<GeometryType>);
	};

	const isSelectedFeatureSaved = (): boolean => {
		const savedId = savedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		const selectedId = selectedFeature.value?.get(FEATURE_ID_PROPERTY) as string;
		return savedId?.length > 0 && savedId === selectedId;
	};

	watch(
		() => currentState.value,
		(newState) => {
			if (newState !== STATES.ERROR) {
				errorMessage.value = undefined;
			}
		}
	);

	watch(
		() => selectedFeature.value,
		(newSelectedFeature) => {
			featuresVectorLayer.updateStyleVariables({
				[SELECTED_ID_PROPERTY]: (newSelectedFeature?.get(FEATURE_ID_PROPERTY) as string) ?? '',
			});

			if (newSelectedFeature != null) {
				centerFeatureLocation(newSelectedFeature);
			}
		}
	);

	watch(
		() => savedFeature.value,
		(newSavedFeature) => {
			featuresVectorLayer.updateStyleVariables({
				[SAVED_ID_PROPERTY]: (newSavedFeature?.get(FEATURE_ID_PROPERTY) as string) ?? '',
			});
		}
	);

	return {
		initializeMap,
		loadGeometries,
		errorMessage,
		toggleClickBinding,

		centerCurrentLocation,
		fitToAllFeatures,

		savedFeature,
		discardSavedFeature: () => saveFeature(undefined),
		saveFeature: () => saveFeature(selectedFeature.value),
		setSavedByValueProp,

		selectedFeatureProperties,
		selectSavedFeature: () => selectFeature(savedFeature.value),
		unselectFeature: () => selectFeature(undefined),
		isSelectedFeatureSaved,
	};
}
