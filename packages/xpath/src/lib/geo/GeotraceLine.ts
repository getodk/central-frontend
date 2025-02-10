import type { Geopoint } from './Geopoint.ts';

interface GeotraceLinePoints {
	readonly start: Geopoint;
	readonly end: Geopoint;
}

export class GeotraceLine implements GeotraceLinePoints {
	readonly start: Geopoint;
	readonly end: Geopoint;

	constructor(points: GeotraceLinePoints) {
		this.start = points.start;
		this.end = points.end;
	}
}
