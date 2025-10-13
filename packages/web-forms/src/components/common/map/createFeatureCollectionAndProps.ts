import type { SelectItem } from '@getodk/xforms-engine';

const PROPERTY_PREFIX = 'odk_'; // Avoids conflicts with OpenLayers (for example, geometry).

const RESERVED_MAP_PROPERTIES = [
	'itextId',
	'geometry',
	'marker-color',
	'marker-symbol',
	'stroke',
	'stroke-width',
	'fill',
];

type Coordinates = [longitude: number, latitude: number];

interface Geometry {
	type: 'LineString' | 'Point' | 'Polygon';
	coordinates: Coordinates | Coordinates[] | Coordinates[][];
}

export interface Feature {
	type: 'Feature';
	geometry: Geometry;
	properties: Record<string, string>;
}

const getGeoJSONCoordinates = (geometry: string) => {
	const coordinates: Coordinates[] = [];
	for (const coord of geometry.split(';')) {
		const [lat, lon] = coord.trim().split(/\s+/).map(Number);

		const isNullLocation = lat === 0 && lon === 0;
		const isValidLatitude = lat != null && !Number.isNaN(lat) && Math.abs(lat) <= 90;
		const isValidLongitude = lon != null && !Number.isNaN(lon) && Math.abs(lon) <= 180;

		if (isNullLocation || !isValidLatitude || !isValidLongitude) {
			// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
			console.warn(`Invalid geo point coordinates: ${geometry}`);
			return;
		}

		coordinates.push([lon, lat]);
	}

	return coordinates;
};

const getGeoJSONGeometry = (coords: Coordinates[]): Geometry => {
	if (coords.length === 1) {
		return { type: 'Point', coordinates: coords[0] };
	}

	const [firstLongitude, firstLatitude] = coords[0];
	const [lastLongitude, lastLatitude] = coords[coords.length - 1];

	if (firstLongitude === lastLongitude && firstLatitude === lastLatitude) {
		return { type: 'Polygon', coordinates: [coords] };
	}

	return { type: 'LineString', coordinates: coords };
};

export const createFeatureCollectionAndProps = (odkFeatures: readonly SelectItem[] | undefined) => {
	const orderedExtraPropsMap = new Map<string, Array<[key: string, value: string]>>();
	const features: Feature[] = [];

	odkFeatures?.forEach((option) => {
		const orderedProps: Array<[string, string]> = [];
		const reservedProps: Record<string, string> = {
			[PROPERTY_PREFIX + 'label']: option.label?.asString,
			[PROPERTY_PREFIX + 'value']: option.value,
		};

		option.properties.forEach(([key, value]) => {
			if (RESERVED_MAP_PROPERTIES.includes(key)) {
				reservedProps[PROPERTY_PREFIX + key] = value.trim();
			} else {
				orderedProps.push([key, value.trim()]);
			}
		});

		orderedExtraPropsMap.set(option.value, orderedProps);

		const geometry = reservedProps[PROPERTY_PREFIX + 'geometry'];
		if (!geometry?.length) {
			// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
			console.warn(`Missing or empty geometry for option: ${option.value}`);
			return;
		}

		const geoJSONCoords = getGeoJSONCoordinates(geometry);
		if (!geoJSONCoords?.length) {
			// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
			console.warn(`Missing geo points for option: ${option.value}`);
			return;
		}

		features.push({
			type: 'Feature',
			geometry: getGeoJSONGeometry(geoJSONCoords),
			properties: reservedProps,
		});
	});

	return {
		featureCollection: { type: 'FeatureCollection', features },
		orderedExtraPropsMap,
	};
};
