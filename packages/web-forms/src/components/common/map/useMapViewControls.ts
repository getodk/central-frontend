import { toGeoJsonCoordinateArray } from '@/components/common/map/geojson-parsers.ts';
import { createCurrentLocationStyle } from '@/components/common/map/map-styles.ts';
import type { TimerID } from '@getodk/common/types/timers.ts';
import { Map, type View } from 'ol';
import type { Coordinate } from 'ol/coordinate';
import { easeOut } from 'ol/easing';
import { getCenter, isEmpty as isExtendEmpty } from 'ol/extent';
import Feature from 'ol/Feature';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { getDistance } from 'ol/sphere';
import { shallowRef, watch } from 'vue';

type LocationWatchID = ReturnType<typeof navigator.geolocation.watchPosition>;

export const DISTANCE_CATEGORY = {
	UNKNOWN: 'unknown',
	SHORT: 'short',
	MID: 'mid',
	LONG: 'long',
} as const;

export type DistanceCategory = (typeof DISTANCE_CATEGORY)[keyof typeof DISTANCE_CATEGORY];

interface BrowserLocation
	extends Pick<GeolocationCoordinates, 'accuracy' | 'altitude' | 'latitude' | 'longitude'> {}

export interface UseMapViewControls {
	centerFeatureLocation: (feature: Feature) => void;
	centerFullWorldView: () => void;
	fitToAllFeatures: (featureSource: VectorSource) => void;
	getUserCurrentLocation: () => BrowserLocation | undefined;
	stopWatchingCurrentLocation: () => void;
	watchCurrentLocation: (onSuccess: () => void, onError: () => void) => void;
}

export const COORDINATE_LAYOUT_XYZM = 'XYZM';
export const DEFAULT_VIEW_CENTER = [0, 0];
export const MIN_ZOOM = 2;
const MAX_ZOOM = 19;
const INTERMEDIATE_ZOOM = 4;
const LONG_DISTANCE_THRESHOLD_METERS = 50 * 1000;
const SHORT_DISTANCE_THRESHOLD_METERS = 1000;
const GEOLOCATION_TIMEOUT_MS = 30 * 1000; // Field environments need more time and reduces false “no signal” warnings.
const GEOLOCATION_CACHE_MS = 1000; // Reduces map accuracy and location indicator refreshes.
const ANIMATION_TIME_MS = 1000;
const DEBOUNCE_DELAY_MS = 500;
const SMALL_DEVICE_WIDTH = 576;

export function useMapViewControls(mapInstance: Map): UseMapViewControls {
	const watchLocation = shallowRef<LocationWatchID | undefined>();
	const userCurrentLocation = shallowRef<BrowserLocation | undefined>();
	const userCurrentLocationFeature = shallowRef<Feature<Point> | undefined>();
	const debounceTimer = shallowRef<TimerID | undefined>();

	const currentLocationSource = new VectorSource();
	const currentLocationLayer = new VectorLayer({
		source: currentLocationSource,
		style: createCurrentLocationStyle(mapInstance),
	});
	mapInstance.addLayer(currentLocationLayer);

	const fitToAllFeatures = (source: VectorSource): void => {
		if (source.isEmpty()) {
			return;
		}

		const extent = source.getExtent();
		if (isExtendEmpty(extent)) {
			return;
		}

		const view = mapInstance.getView();
		const center = getCenter(extent);
		const distance = evaluateDistance(view, center);
		if (distance === DISTANCE_CATEGORY.LONG) {
			view.animate(
				{ zoom: INTERMEDIATE_ZOOM, duration: ANIMATION_TIME_MS, easing: easeOut },
				{ center: center, duration: ANIMATION_TIME_MS, easing: easeOut },
				() => {
					view.fit(extent, {
						padding: [50, 50, 50, 50],
						duration: 0,
						maxZoom: MAX_ZOOM,
					});
				}
			);
			return;
		}

		view.fit(extent, {
			padding: [50, 50, 50, 50],
			duration: getZoomDuration(distance),
			maxZoom: MAX_ZOOM,
		});
	};

	const onGeolocationSuccess = (position: GeolocationPosition, onSuccess: () => void) => {
		if (debounceTimer.value) {
			clearTimeout(debounceTimer.value);
		}
		debounceTimer.value = setTimeout(() => {
			const { latitude, longitude, altitude, accuracy } = position.coords;
			userCurrentLocation.value = { latitude, longitude, altitude, accuracy };
			onSuccess();
		}, DEBOUNCE_DELAY_MS);
	};

	const onGeolocationError = (onError: () => void) => {
		stopWatchingCurrentLocation();
		onError();
	};

	const watchCurrentLocation = (onSuccess: () => void, onError: () => void): void => {
		if (watchLocation.value) {
			const userCoords = userCurrentLocationFeature.value?.getGeometry()?.getCoordinates();
			if (userCoords) {
				transitionToLocation(userCoords, MAX_ZOOM);
				onSuccess();
			}

			return;
		}

		if (!navigator.geolocation) {
			onGeolocationError(onError);
			return;
		}

		watchLocation.value = navigator.geolocation.watchPosition(
			(position) => onGeolocationSuccess(position, onSuccess),
			() => onGeolocationError(onError),
			{
				enableHighAccuracy: true,
				timeout: GEOLOCATION_TIMEOUT_MS,
				maximumAge: GEOLOCATION_CACHE_MS,
			}
		);
	};

	const stopWatchingCurrentLocation = () => {
		currentLocationSource.clear(true);
		userCurrentLocation.value = undefined;

		if (watchLocation.value) {
			navigator.geolocation.clearWatch(watchLocation.value);
			watchLocation.value = undefined;
		}
	};

	const centerFeatureLocation = (feature: Feature): void => {
		const geometry = feature.getGeometry();
		const view = mapInstance.getView();
		const mapWidth = mapInstance.getSize()?.[0];
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
		if (!featureCenterLong || !featureCenterLat) {
			return;
		}
		const targetCoordinates = [
			featureCenterLong - xOffsetInMapUnits * cosRotation + yOffsetInMapUnits * sinRotation,
			featureCenterLat - xOffsetInMapUnits * sinRotation - yOffsetInMapUnits * cosRotation,
		];

		const targetZoom = view.getZoomForResolution(zoomResolution);
		const zoom = targetZoom ? Math.min(targetZoom, MAX_ZOOM) : MAX_ZOOM;
		transitionToLocation(targetCoordinates, zoom);
	};

	const evaluateDistance = (view: View, targetCoords: Coordinate): DistanceCategory => {
		const currentCenter = view.getCenter();
		const isFullWorld = (center: Coordinate) => center.every((c) => c === 0);
		if (
			!currentCenter ||
			!targetCoords ||
			isFullWorld(currentCenter) ||
			isFullWorld(targetCoords)
		) {
			return DISTANCE_CATEGORY.UNKNOWN;
		}

		const distanceMeters = getDistance(toLonLat(currentCenter), toLonLat(targetCoords));
		if (distanceMeters <= SHORT_DISTANCE_THRESHOLD_METERS) {
			return DISTANCE_CATEGORY.SHORT;
		}

		if (distanceMeters > LONG_DISTANCE_THRESHOLD_METERS) {
			return DISTANCE_CATEGORY.LONG;
		}

		return DISTANCE_CATEGORY.MID;
	};

	const getZoomDuration = (distance: DistanceCategory) => {
		if (distance === DISTANCE_CATEGORY.SHORT || distance === DISTANCE_CATEGORY.UNKNOWN) {
			return ANIMATION_TIME_MS;
		}

		return 0;
	};

	const transitionToLocation = (targetCoords: Coordinate, targetZoom: number) => {
		const view = mapInstance.getView();
		const distance = evaluateDistance(view, targetCoords);
		const zoomDuration = getZoomDuration(distance);

		if (distance === DISTANCE_CATEGORY.LONG) {
			view.animate(
				{ zoom: INTERMEDIATE_ZOOM, duration: ANIMATION_TIME_MS, easing: easeOut },
				{ center: targetCoords, duration: ANIMATION_TIME_MS, easing: easeOut },
				{ zoom: targetZoom, duration: zoomDuration, easing: easeOut }
			);
			return;
		}

		view.animate({
			center: targetCoords,
			zoom: targetZoom,
			duration: zoomDuration,
			easing: easeOut,
		});
	};

	watch(
		() => userCurrentLocation.value,
		(newLocation) => {
			const canCenterView = !userCurrentLocationFeature.value;
			userCurrentLocationFeature.value = undefined;
			currentLocationSource.clear(true);
			if (!newLocation) {
				return;
			}

			const coords = toGeoJsonCoordinateArray(
				newLocation.longitude,
				newLocation.latitude,
				newLocation.altitude,
				newLocation.accuracy
			);
			const parsedCoords = fromLonLat(coords);
			userCurrentLocationFeature.value = new Feature({
				geometry: new Point(parsedCoords, COORDINATE_LAYOUT_XYZM),
			});
			userCurrentLocationFeature.value.set('accuracy', newLocation.accuracy);

			currentLocationSource.addFeature(userCurrentLocationFeature.value);

			if (canCenterView) {
				transitionToLocation(parsedCoords, MAX_ZOOM);
			}
		}
	);

	return {
		centerFeatureLocation,
		centerFullWorldView: () => transitionToLocation(DEFAULT_VIEW_CENTER, MIN_ZOOM),
		fitToAllFeatures,
		getUserCurrentLocation: () => userCurrentLocation.value,
		stopWatchingCurrentLocation,
		watchCurrentLocation,
	};
}
