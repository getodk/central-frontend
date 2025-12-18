abstract class SemanticValue<Semantic extends string, Value extends number | null> {
	abstract readonly semantic: Semantic;

	constructor(readonly value: Value) {}
}

class Latitude extends SemanticValue<'latitude', number> {
	readonly semantic = 'latitude';
}

class Longitude extends SemanticValue<'longitude', number> {
	readonly semantic = 'longitude';
}

class Altitude<Value extends number | null = number> extends SemanticValue<'altitude', Value> {
	readonly semantic = 'altitude';
}

class Accuracy<Value extends number | null = number> extends SemanticValue<'accuracy', Value> {
	readonly semantic = 'accuracy';
}

export interface LocationPoint {
	readonly latitude: number;
	readonly longitude: number;
	readonly altitude: number | null;
	readonly accuracy: number | null;
}

interface GeolocationInternalValue {
	readonly latitude: Latitude;
	readonly longitude: Longitude;
	readonly altitude: Altitude<null> | Altitude<number>;
	readonly accuracy: Accuracy<null> | Accuracy<number>;
}

type LocationPointTuple =
	| readonly [
			latitude: Latitude,
			longitude: Longitude,
			altitude: Altitude<null> | Altitude<number>,
			accuracy: Accuracy,
	  ]
	| readonly [latitude: Latitude, longitude: Longitude, altitude: Altitude]
	| readonly [latitude: Latitude, longitude: Longitude];

export const SEGMENT_SEPARATOR = ';';

const DEGREES_MAX = {
	latitude: 90,
	longitude: 180,
} as const;

type CoordinateType = keyof typeof DEGREES_MAX;

export class Geolocation {
	private readonly internalValue: GeolocationInternalValue;

	constructor(coordinates: LocationPoint) {
		const { latitude, longitude, altitude, accuracy } = coordinates;

		this.internalValue = {
			latitude: new Latitude(latitude),
			longitude: new Longitude(longitude),
			altitude: this.isValidNumber(altitude) ? new Altitude(altitude) : new Altitude(null),
			accuracy: this.isValidNumber(accuracy) ? new Accuracy(accuracy) : new Accuracy(null),
		};
	}

	getTuple(): LocationPointTuple {
		const { latitude, longitude, altitude, accuracy } = this.internalValue;

		if (accuracy.value != null) {
			return [latitude, longitude, altitude, accuracy];
		}

		if (altitude.value != null) {
			return [latitude, longitude, altitude];
		}

		return [latitude, longitude];
	}

	getRuntimeValue(): LocationPoint | null {
		const { latitude, longitude, altitude, accuracy } = this.internalValue;
		const isLatitude = this.isValidDegrees('latitude', latitude.value);
		const isLongitude = this.isValidDegrees('longitude', longitude.value);

		if (
			!isLatitude ||
			!isLongitude ||
			Geolocation.isNullLocation(latitude.value, longitude.value)
		) {
			return null;
		}

		return {
			latitude: latitude.value,
			longitude: longitude.value,
			altitude: altitude.value,
			accuracy: accuracy.value,
		};
	}

	private isValidDegrees(coordinate: CoordinateType, degrees: number): degrees is number {
		return this.isValidNumber(degrees) && Math.abs(degrees) <= DEGREES_MAX[coordinate];
	}

	private isValidNumber(value: number | null | undefined) {
		return value != null && !Number.isNaN(value);
	}

	private static isNullLocation(latitude: number, longitude: number) {
		return latitude === 0 && longitude === 0;
	}

	static parseString(value: string): LocationPoint | null {
		value = value.trim();
		if (value === '') {
			return null;
		}

		const [latitude, longitude, altitude = null, accuracy = null] = value.split(/\s+/).map(Number);

		if (latitude == null || longitude == null || Number.isNaN(altitude) || Number.isNaN(accuracy)) {
			return null;
		}

		return new this({ latitude, longitude, altitude, accuracy }).getRuntimeValue();
	}

	static toCoordinatesString(value: LocationPoint | string | null): string {
		const decodedValue = typeof value === 'string' ? Geolocation.parseString(value) : value;

		if (
			decodedValue == null ||
			Geolocation.isNullLocation(decodedValue.latitude, decodedValue.longitude)
		) {
			return '';
		}

		return new this(decodedValue)
			.getTuple()
			.map((item) => item.value ?? 0)
			.join(' ');
	}

	static isClosedShape(points: LocationPoint[]) {
		const firstPoint = points[0];
		const lastPoint = points[points.length - 1];
		return (
			firstPoint?.latitude === lastPoint?.latitude && firstPoint?.longitude === lastPoint?.longitude
		);
	}

	static getSegments(value: string): string[] | null {
		if (value.trim() === '') {
			return null;
		}

		const parts = value.split(SEGMENT_SEPARATOR);
		// Handles trailing semicolon, which is valid and common in ODK.
		if (parts[parts.length - 1]?.trim() === '') {
			parts.pop();
		}

		return parts;
	}
}
