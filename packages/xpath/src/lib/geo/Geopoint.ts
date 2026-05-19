// prettier-ignore
type GeopointEncodedSubstringValues = readonly [
	latitude: string,
	longitude: string,
	altitude?: string,
	accuracy?: string,
];

const isGeopointEncodedSubstringValues = (
	values: ReadonlyArray<string | undefined>
): values is GeopointEncodedSubstringValues => {
	const { length } = values;

	return (
		length >= 2 &&
		length <= 4 &&
		values.every((value) => {
			return value != null;
		})
	);
};

const DEGREES_MAX = {
	latitude: 90,
	longitude: 180,
} as const;

type GeographicAngleCoordinate = keyof typeof DEGREES_MAX;

const decodeDegrees = (coordinate: GeographicAngleCoordinate, value: string): number | null => {
	const degrees = Number(value);
	const absolute = Math.abs(degrees);
	const max = DEGREES_MAX[coordinate];

	if (absolute > max) {
		return null;
	}

	return degrees;
};

export interface GeopointCoordinates {
	readonly latitude: number;
	readonly longitude: number;
}

const decodeGeopointCoordinates = (nodeValue: string): GeopointCoordinates | null => {
	const substringValues = nodeValue.split(/\s+/);

	if (!isGeopointEncodedSubstringValues(substringValues)) {
		return null;
	}

	const [latitudeValue, longitudeValue] = substringValues;

	const latitude = decodeDegrees('latitude', latitudeValue);
	const longitude = decodeDegrees('longitude', longitudeValue);

	if (latitude == null || longitude == null) {
		return null;
	}

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
	static fromNodeValue(nodeValue: string): Geopoint | null {
		const coordinates = decodeGeopointCoordinates(nodeValue);

		if (coordinates == null) {
			return null;
		}

		return new this(coordinates);
	}

	readonly latitude: number;
	readonly longitude: number;

	private constructor(coordinates: GeopointCoordinates) {
		this.latitude = coordinates.latitude;
		this.longitude = coordinates.longitude;
	}
}
