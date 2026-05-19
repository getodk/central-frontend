import { Geolocation, type LocationPoint, SEGMENT_SEPARATOR } from './Geolocation.ts';

export type GeotraceRuntimeValue = LocationPoint[] | null;

export type GeotraceInputValue = GeotraceRuntimeValue | string;

export class Geotrace extends Geolocation {
	static parseStringToGeotrace(value: string): GeotraceRuntimeValue {
		const parts = Geolocation.getSegments(value);
		if (parts === null) {
			return null;
		}

		const points = parts.map((point) => Geolocation.parseString(point)) as LocationPoint[];
		if (points.some((p) => p === null) || points.length < 2 || Geolocation.isClosedShape(points)) {
			return null;
		}

		return points;
	}

	static parseGeotraceString(points: GeotraceInputValue): string {
		const decodedPoints =
			typeof points === 'string' ? Geotrace.parseStringToGeotrace(points) : points;
		if (!decodedPoints) {
			return '';
		}

		const segments = decodedPoints.map((point) => Geolocation.toCoordinatesString(point));
		if (segments.some((s) => !s.length)) {
			return '';
		}

		return segments.join(SEGMENT_SEPARATOR);
	}
}
