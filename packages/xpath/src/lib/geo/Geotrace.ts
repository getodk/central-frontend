import type { Geopoint } from './Geopoint.ts';
import { geopointCodec, type GeopointRuntimeValue } from './geopointCodec.ts';
import { GeotraceLine } from './GeotraceLine.ts';

export type GeotracePoints = readonly [Geopoint, Geopoint, ...Geopoint[]];

const isGeotracePoints = (
	geopoints: readonly GeopointRuntimeValue[]
): geopoints is GeotracePoints => {
	return (
		geopoints.length >= 2 &&
		geopoints.every((geopoint) => {
			return geopoint != null;
		})
	);
};

const collectLines = (geopoints: GeotracePoints): readonly GeotraceLine[] => {
	return geopoints.reduce((acc, geopoint, i) => {
		if (i === 0) {
			return acc;
		}

		// Non-null assertion safe: we ensure at least 2 points, and skip index 0.
		const start = geopoints[i - 1]!;
		const end = geopoint;

		acc.push(
			new GeotraceLine({
				start,
				end,
			})
		);

		return acc;
	}, Array<GeotraceLine>());
};

export class Geotrace {
	static fromEncodedGeotrace(encoded: string): Geotrace | null {
		const geopoints = encoded
			.trim()
			// Consistency with JavaRosa: any number of trailing semicolons are
			// ignored, with any amount of whitespace between them.
			.replace(/(\s*;)+$/, '')
			.split(/\s*;\s*/)
			.map((value) => {
				return geopointCodec.decodeValue(value);
			});

		return this.fromGeopoints(geopoints);
	}

	static fromEncodedValues(values: readonly string[]): Geotrace | null {
		const [head, ...tail] = values;

		if (head == null) {
			return null;
		}

		if (tail.length === 0) {
			return this.fromEncodedGeotrace(head);
		}

		const geopoints = values.map((value) => {
			return geopointCodec.decodeValue(value);
		});

		return this.fromGeopoints(geopoints);
	}

	static fromGeopoints(geopoints: readonly GeopointRuntimeValue[]): Geotrace | null {
		if (!isGeotracePoints(geopoints)) {
			return null;
		}

		return new this(geopoints);
	}

	readonly lines: readonly GeotraceLine[];

	private constructor(readonly geopoints: GeotracePoints) {
		this.lines = collectLines(geopoints);
	}
}
