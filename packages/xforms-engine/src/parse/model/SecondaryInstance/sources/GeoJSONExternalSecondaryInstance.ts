import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import { assertUnknownArray } from '@getodk/common/lib/type-assertions/assertUnknownArray.ts';
import type { UnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import { assertUnknownObject } from '@getodk/common/lib/type-assertions/assertUnknownObject.ts';
import type {
	GeoJsonProperties as BaseGeoJSONProperties,
	LineString as BaseLineString,
	Point as BasePoint,
	Polygon as BasePolygon,
	Feature as GeoJSONFeature,
	FeatureCollection as GeoJSONFeatureCollection,
} from 'geojson';
import { ErrorProductionDesignPendingError } from '../../../../error/ErrorProductionDesignPendingError.ts';
import type { StaticElementOptions } from '../../../../integration/xpath/static-dom/StaticElement.ts';
import { defineSecondaryInstance } from '../defineSecondaryInstance.ts';
import type { SecondaryInstanceDefinition } from '../SecondaryInstancesDefinition.ts';
import { ExternalSecondaryInstanceSource } from './ExternalSecondaryInstanceSource.ts';

const FEATURE_COLLECTION = 'FeatureCollection';
type FEATURE_COLLECTION = typeof FEATURE_COLLECTION;

const FEATURE = 'Feature';
type FEATURE = typeof FEATURE;

const POINT = 'Point';
type POINT = typeof POINT;

const LINE_STRING = 'LineString';
type LINE_STRING = typeof LINE_STRING;

const POLYGON = 'Polygon';
type POLYGON = typeof POLYGON;

type SupportedGeometryType = LINE_STRING | POINT | POLYGON;

const SUPPORTED_TYPES = new Set<SupportedGeometryType>([POINT, LINE_STRING, POLYGON]);

const SUPPORTED_TYPES_MESSAGE = 'Only Points, LineStrings and Polygons are currently supported';

type LongLatCoordinates = readonly [longitude: number, latitude: number];

interface UnknownCoordinatesObject {
	readonly coordinates: unknown;
}

// prettier-ignore
type ExtensibleBaseGeoJSONType<T> =
	T extends UnknownCoordinatesObject
		? Readonly<Omit<T, 'coordinates'>>
		: Readonly<T>;

interface Point extends ExtensibleBaseGeoJSONType<BasePoint> {
	readonly coordinates: LongLatCoordinates;
}

type LineStringCoordinates = readonly LongLatCoordinates[];

interface LineString extends ExtensibleBaseGeoJSONType<BaseLineString> {
	readonly coordinates: LineStringCoordinates;
}

// prettier-ignore
type PolygonCoordinates =
	| readonly []
	| readonly [LineStringCoordinates];

interface Polygon extends ExtensibleBaseGeoJSONType<BasePolygon> {
	readonly coordinates: PolygonCoordinates;
}

// prettier-ignore
type SupportedGeometry =
	| LineString
	| Point
	| Polygon;

interface UnparsedGeometry<Type extends SupportedGeometryType> {
	readonly type: Type;
	readonly coordinates: readonly unknown[];
}

type UnknownGeometry = {
	[Type in SupportedGeometryType]: UnparsedGeometry<Type>;
}[SupportedGeometryType];

/**
 * This is a stricter variant of {@link BaseGeoJSONProperties}.
 */
type GeoJSONProperties = UnknownObject;

/**
 * This is our supported variant/subset of {@link GeoJSONFeature} where:
 *
 * - {@link geometry} is parsed/validated to be one of our
 *   {@link SupportedGeometry | supported geometries}
 *
 * - all properties and non-primitive property values are deeply `readonly`
 */
interface Feature {
	readonly type: FEATURE;
	readonly geometry: SupportedGeometry;
	readonly id?: number | string | undefined;

	/**
	 * Perhaps surprising: this property is required by the
	 * {@link https://datatracker.ietf.org/doc/html/rfc7946#section-3.2 | GeoJSON spec}!
	 */
	readonly properties: GeoJSONProperties | null;
}

/**
 * This is our supported variant/subset of {@link GeoJSONFeatureCollection}, as
 * described for {@link Feature}.
 */
interface FeatureCollection {
	readonly type: FEATURE_COLLECTION;
	readonly features: readonly Feature[];
}

type AssertLongLatCoordinates = (data: unknown) => asserts data is LongLatCoordinates;

const assertLongLatCoordinates: AssertLongLatCoordinates = (data) => {
	assertUnknownArray(data);

	const [longitude, latitude, ...rest] = data;

	if (typeof longitude === 'number' && typeof latitude === 'number' && rest.length === 0) {
		return;
	}

	throw new ErrorProductionDesignPendingError(
		`Only ${POINT}s with latitude and longitude are currently supported`
	);
};

type AssertUnknownGeometry = (value: unknown) => asserts value is UnknownGeometry;

const assertUnknownGeometry: AssertUnknownGeometry = (value) => {
	assertUnknownObject(value);

	if (!SUPPORTED_TYPES.has(value.type as SupportedGeometryType)) {
		throw new ErrorProductionDesignPendingError(SUPPORTED_TYPES_MESSAGE);
	}

	assertUnknownArray(value.coordinates);
};

type AssertSupportedGeometry = (value: unknown) => asserts value is SupportedGeometry;

const assertSupportedGeometry: AssertSupportedGeometry = (value) => {
	assertUnknownGeometry(value);

	switch (value.type) {
		case LINE_STRING:
			value.coordinates.forEach(assertLongLatCoordinates);
			break;

		case POINT:
			assertLongLatCoordinates(value.coordinates);
			break;

		case POLYGON: {
			const [coordinates, ...rest] = value.coordinates;

			if (coordinates == null) {
				return;
			}

			if (rest.length > 0) {
				throw new ErrorProductionDesignPendingError(
					`Unsupported ${POLYGON}: multiple sets of coordinates`
				);
			}

			assertUnknownArray(coordinates);
			coordinates.forEach(assertLongLatCoordinates);

			break;
		}

		default:
			throw new UnreachableError(value);
	}
};

type AssertFeature = (value: unknown) => asserts value is Feature;

const assertFeature: AssertFeature = (value) => {
	assertUnknownObject(value);

	const { geometry, type, id, properties } = value;

	if (type !== FEATURE) {
		throw new ErrorProductionDesignPendingError(
			`Expected Feature.type ${FEATURE}, got ${String(type)}`
		);
	}

	assertSupportedGeometry(geometry);

	if ('id' in value) {
		const typeofId = typeof id;

		switch (typeofId) {
			case 'number':
			case 'string':
			case 'undefined':
				break;

			default:
				throw new ErrorProductionDesignPendingError(
					`Unexpected type of feature id property: ${typeofId}`
				);
		}
	}

	// Note: atypical strict check for `null` value! The `properties` key is
	// required per
	if (properties === null) {
		return;
	}

	assertUnknownObject(properties);
};

type AssertFeatureCollection = (value: unknown) => asserts value is FeatureCollection;

const assertFeatureCollection: AssertFeatureCollection = (value) => {
	assertUnknownObject(value);

	const { type, features } = value;

	if (type !== FEATURE_COLLECTION) {
		throw new ErrorProductionDesignPendingError(
			`Expected FeatureCollection.type ${FEATURE_COLLECTION}, got ${String(type)}`
		);
	}

	assertUnknownArray(features);

	features.forEach(assertFeature);
};

type SerializedCoordinates = `${LongLatCoordinates[1]} ${LongLatCoordinates[0]} 0 0`;

const serializeCoordinates = (coordinates: LongLatCoordinates): SerializedCoordinates => {
	const [longitude, latitude] = coordinates;

	return `${latitude} ${longitude} 0 0`;
};

const geometryValues = (geometry: SupportedGeometry): readonly string[] => {
	switch (geometry.type) {
		case 'LineString':
			return geometry.coordinates.map(serializeCoordinates);

		case 'Point':
			return [serializeCoordinates(geometry.coordinates)];

		case 'Polygon': {
			const [coordinates = []] = geometry.coordinates;

			return coordinates.map(serializeCoordinates);
		}

		default:
			throw new UnreachableError(geometry);
	}
};

const geometryChildElementOption = (feature: Feature): StaticElementOptions => {
	const { geometry } = feature;
	const values = geometryValues(geometry);
	const value = values.join('; ');

	return {
		name: 'geometry',
		children: [value],
	};
};

const propertyChildOption = (propertyName: string, propertyValue: string): StaticElementOptions => {
	return {
		name: propertyName,
		children: [propertyValue],
	};
};

function* propertyChildOptions(feature: Feature): Iterable<StaticElementOptions> {
	const { properties } = feature;

	if (properties == null) {
		return [];
	}

	const { id: propertiesId, ...nonIdProperties } = properties;
	const { id = propertiesId } = feature;

	if (id !== undefined) {
		// eslint-disable-next-line @typescript-eslint/no-base-to-string -- Intentional fallback, we don't know what this is and it could be any permutation of JSON
		yield propertyChildOption('id', String(id));
	}

	for (const [propertyName, propertyValue] of Object.entries(nonIdProperties)) {
		yield propertyChildOption(propertyName, String(propertyValue));
	}
}

const itemChildOption = (feature: Feature): StaticElementOptions => {
	const geometry = geometryChildElementOption(feature);
	const properties = propertyChildOptions(feature);

	return {
		name: 'item',
		children: [geometry, ...properties],
	};
};

const rootChildOption = (featureCollection: FeatureCollection): StaticElementOptions => {
	return {
		name: 'root',
		children: featureCollection.features.map(itemChildOption),
	};
};

const geoJSONExternalSecondaryInstanceDefinition = (
	instanceId: string,
	featureCollection: FeatureCollection
): SecondaryInstanceDefinition => {
	return defineSecondaryInstance(instanceId, rootChildOption(featureCollection));
};

export class GeoJSONExternalSecondaryInstanceSource extends ExternalSecondaryInstanceSource<'geojson'> {
	parseDefinition(): SecondaryInstanceDefinition {
		const { data } = this.resource;
		const value = JSON.parse(data) as unknown;

		assertFeatureCollection(value);

		return geoJSONExternalSecondaryInstanceDefinition(this.instanceId, value);
	}
}
