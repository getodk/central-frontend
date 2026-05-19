import { Geolocation, type LocationPoint, SEGMENT_SEPARATOR } from './Geolocation.ts';

export type GeoshapeRuntimeValue = LocationPoint[] | null;

export type GeoshapeInputValue = GeoshapeRuntimeValue | string;

export class Geoshape extends Geolocation {
	static parseStringToGeoshape(value: string): GeoshapeRuntimeValue {
		const parts = Geolocation.getSegments(value);
		if (parts === null) {
			return null;
		}

		const points = parts.map((point) => Geolocation.parseString(point)) as LocationPoint[];
		if (points.some((p) => p === null) || points.length < 3 || !Geolocation.isClosedShape(points)) {
			return null;
		}

		return points;
	}

	static parseGeoshapeString(points: GeoshapeInputValue): string {
		const decodedPoints =
			typeof points === 'string' ? Geoshape.parseStringToGeoshape(points) : points;
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
