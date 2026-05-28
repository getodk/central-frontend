import { Geolocation, type LocationPoint, type LocationPointInput } from './Geolocation.ts';

export type GeopointRuntimeValue = LocationPoint | null;

export type GeopointInputValue = LocationPointInput | string | null;

export class Geopoint extends Geolocation {
	static parseStringToGeopoint(value: string): GeopointRuntimeValue {
		return Geolocation.parseString(value);
	}

	static parseGeopointToString(value: GeopointInputValue): string {
		return Geolocation.toCoordinatesString(value);
	}
}
