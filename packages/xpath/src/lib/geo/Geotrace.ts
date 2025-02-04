import { JRCompatibleGeoValueError } from '../../error/JRCompatibleGeoValueError.ts';
import { Geopoint } from './Geopoint.ts';
import { GeotraceLine } from './GeotraceLine.ts';

export type GeotracePoints = readonly [Geopoint, Geopoint, ...Geopoint[]];

const isGeotracePoints = (geopoints: readonly Geopoint[]): geopoints is GeotracePoints => {
	return geopoints.length >= 2;
};

type AssertGeotracePoints = (geopoints: readonly Geopoint[]) => asserts geopoints is GeotracePoints;

const assertGeotracePoints: AssertGeotracePoints = (geopoints) => {
	if (!isGeotracePoints(geopoints)) {
		throw new JRCompatibleGeoValueError();
	}
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
	static fromEncodedGeotrace(encoded: string): Geotrace {
		const geopoints = encoded
			.replace(/\s*;\s*$/, '')
			.split(/\s*;\s*/)
			.map((value) => {
				return Geopoint.fromNodeValue(value);
			});

		return this.fromGeopoints(geopoints);
	}

	static fromEncodedValues(values: readonly string[]): Geotrace {
		const [head, ...tail] = values;

		if (head == null) {
			throw new JRCompatibleGeoValueError();
		}

		if (tail.length === 0) {
			return this.fromEncodedGeotrace(head);
		}

		const geopoints = values.map((value) => {
			return Geopoint.fromNodeValue(value);
		});

		return this.fromGeopoints(geopoints);
	}

	static fromGeopoints(geopoints: readonly Geopoint[]): Geotrace {
		assertGeotracePoints(geopoints);

		return new this(geopoints);
	}

	readonly lines: readonly GeotraceLine[];

	private constructor(readonly geopoints: GeotracePoints) {
		this.lines = collectLines(geopoints);
	}
}
