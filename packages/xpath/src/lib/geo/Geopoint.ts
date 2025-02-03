import { JRCompatibleGeoValueError } from '../../error/JRCompatibleGeoValueError.ts';

// prettier-ignore
type GeopointNodeSubstringValues = readonly [
	latitude: string,
	longitude: string,
	altitude?: string,
	accuracy?: string,
];

type AssertGeopointNodeSubstringValues = (
	values: ReadonlyArray<string | undefined>
) => asserts values is GeopointNodeSubstringValues;

const assertGeopointNodeSubstringValues: AssertGeopointNodeSubstringValues = (values) => {
	if (values[0] == null || values[1] == null || values.length > 4) {
		throw new JRCompatibleGeoValueError();
	}
};

const DEGREES_MAX = {
	latitude: 90,
	longitude: 180,
} as const;

type GeographicAngleCoordinate = keyof typeof DEGREES_MAX;

const decodeDegrees = (coordinate: GeographicAngleCoordinate, value: string): number => {
	const degrees = Number(value);
	const absolute = Math.abs(degrees);
	const max = DEGREES_MAX[coordinate];

	if (absolute > max) {
		throw new JRCompatibleGeoValueError();
	}

	return degrees;
};

export interface GeopointCoordinates {
	readonly latitude: number;
	readonly longitude: number;
}

const decodeGeopointCoordinates = (nodeValue: string): GeopointCoordinates => {
	const substringValues = nodeValue.split(/\s+/);

	assertGeopointNodeSubstringValues(substringValues);

	const [latitudeValue, longitudeValue] = substringValues;

	const latitude = decodeDegrees('latitude', latitudeValue);
	const longitude = decodeDegrees('longitude', longitudeValue);

	return {
		latitude,
		longitude,
	};
};

/**
 * @todo this is derived from an interface that was introduced _internally_, to
 * support the initial implementation of these related geo functions:
 *
 * - {@link https://getodk.github.io/xforms-spec/#fn:area | area}
 * - {@link https://getodk.github.io/xforms-spec/#fn:distance | distance}
 *
 * It has been extracted here as a class as a potential basis for sharing
 * geo-related functionality between Web Forms packages.
 *
 * **IMPORTANT:** it's likely that we'll reconsider how we model a
 * {@link https://getodk.github.io/xforms-spec/#data-type:geopoint | geopoint}
 * value, as we consider several shared responsibilities between `@getodk/xpath`
 * and `@getodk/xforms-engine`. Notably, the engine already has a conflicting
 * structural runtime representation and encoding behavior, in its support for
 * {@link https://getodk.github.io/xforms-spec/#secondary-instances---external | external secondary instances}
 * with a {@link https://geojson.org/ | GeoJSON format}.
 */
export class Geopoint implements GeopointCoordinates {
	static fromNodeValue(nodeValue: string): Geopoint {
		const coordinates = decodeGeopointCoordinates(nodeValue);

		return new this(coordinates);
	}

	readonly latitude: number;
	readonly longitude: number;

	private constructor(coordinates: GeopointCoordinates) {
		this.latitude = coordinates.latitude;
		this.longitude = coordinates.longitude;
	}
}
