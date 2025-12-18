import { Geolocation, type LocationPoint } from './Geolocation.ts';

export type GeopointRuntimeValue = LocationPoint | null;

export type GeopointInputValue = GeopointRuntimeValue | string;

export class Geopoint extends Geolocation {
	static parseStringToGeopoint(value: string): GeopointRuntimeValue {
		return Geolocation.parseString(value);
	}

	static parseGeopointToString(value: GeopointInputValue): string {
		return Geolocation.toCoordinatesString(value);
	}
}
