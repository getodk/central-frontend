import { getFlatCoordinates } from '@/components/common/map/vertex-geometry.ts';
import type { Coordinate } from 'ol/coordinate';
import type Feature from 'ol/Feature';
import type { LineString, Point, Polygon } from 'ol/geom';
import { toLonLat } from 'ol/proj';

export const formatODKValue = (feature: Feature): string => {
	const geometry = feature.getGeometry();
	if (!geometry) {
		return '';
	}

	const formatCoords = (coords: Coordinate) => {
		const [longitude, latitude, altitude, accuracy] = toLonLat(coords);
		return [latitude, longitude, altitude, accuracy].filter((item) => item != null).join(' ');
	};

	const featureType = geometry.getType();
	if (featureType === 'Point') {
		const coordinates = (geometry as Point).getCoordinates();
		return coordinates ? formatCoords(coordinates) : '';
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
