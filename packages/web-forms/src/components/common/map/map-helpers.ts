import {
	SINGLE_FEATURE_TYPES,
	type SingleFeatureType,
} from '@/components/common/map/getModeConfig.ts';
import { getFlatCoordinates, isCoordsEqual } from '@/components/common/map/vertex-geometry.ts';
import type { Coordinate } from 'ol/coordinate';
import type Feature from 'ol/Feature';
import type { LineString, Point, Polygon } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import type {
	LineString as LineStringGeoJSON,
	Point as PointGeoJSON,
	Polygon as PolygonGeoJSON,
} from 'geojson';

// Latitude is first for ODK and longitude is second.
export const toODKCoordinateArray = (
	longitude: number,
	latitude: number,
	altitude: number | null | undefined,
	accuracy: number | null | undefined
): number[] => {
	const coords = [];
	if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
		coords.push(latitude, longitude);

		if (Number.isFinite(accuracy)) {
			coords.push(Number.isFinite(altitude) ? altitude! : 0, accuracy!);
		} else if (Number.isFinite(altitude)) {
			coords.push(altitude!);
		}
	}

	return coords;
};

export const formatODKValue = (feature: Feature): string => {
	const geometry = feature.getGeometry();
	if (!geometry) {
		return '';
	}

	const formatCoords = (coords: Coordinate) => {
		const parsedCoords = toLonLat(coords) as [number, number, number?, number?];
		return toODKCoordinateArray(...parsedCoords).join(' ');
	};

	const featureType = geometry.getType();
	if (featureType === 'Point') {
		const coordinates = (geometry as Point).getCoordinates();
		return coordinates?.length ? formatCoords(coordinates) : '';
	}

	const coordinates: Coordinate[] = getFlatCoordinates(geometry as LineString | Polygon);
	return coordinates.map((coord) => formatCoords(coord)).join('; ');
};

export const isWebGLAvailable = () => {
	try {
		const canvas = document.createElement('canvas');
		return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
	} catch {
		return false;
	}
};

/**
 * Validates and transforms GeoJSON coordinates to the map default projection (OL's fromLonLat)
 * based on the specific geometry type (Point, Trace, or Shape).
 */
export const getValidCoordinates = (
	geometry: LineStringGeoJSON | PointGeoJSON | PolygonGeoJSON | undefined,
	singleFeatureType: SingleFeatureType | undefined
) => {
	if (!geometry?.coordinates?.length) {
		return;
	}

	const coords = geometry.coordinates as Coordinate | Coordinate[] | Coordinate[][];
	if (
		geometry.type === 'Point' &&
		singleFeatureType === SINGLE_FEATURE_TYPES.POINT &&
		!Array.isArray(coords[0])
	) {
		return fromLonLat(coords as Coordinate);
	}

	const hasRing = Array.isArray(coords[0]) && Array.isArray(coords[0][0]);
	let flatCoords = (hasRing ? coords[0] : coords) as Coordinate[];
	if (!flatCoords?.length) {
		return;
	}

	flatCoords = flatCoords.map((c) => fromLonLat(c));
	const isClosed = isCoordsEqual(flatCoords[0], flatCoords[flatCoords.length - 1]);
	if (
		geometry.type === 'LineString' &&
		singleFeatureType === SINGLE_FEATURE_TYPES.TRACE &&
		!isClosed &&
		flatCoords.length >= 2
	) {
		return flatCoords;
	}

	if (
		geometry.type === 'Polygon' &&
		singleFeatureType === SINGLE_FEATURE_TYPES.SHAPE &&
		isClosed &&
		flatCoords.length >= 3
	) {
		return [flatCoords];
	}
};
