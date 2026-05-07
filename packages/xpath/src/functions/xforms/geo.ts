import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import { EvaluationContext } from '../../context/EvaluationContext.ts';
import { JRCompatibleGeoValueError } from '../../error/JRCompatibleGeoValueError.ts';
import { BooleanFunction } from '../../evaluator/functions/BooleanFunction.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { Geopoint } from '../../lib/geo/Geopoint.ts';
import { Geotrace } from '../../lib/geo/Geotrace.ts';
import type { GeotraceLine } from '../../lib/geo/GeotraceLine.ts';

const EARTH_EQUATORIAL_RADIUS_METERS = 6_378_100;
const PRECISION = 100;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const toPrecision = (value: number, precision: number) => {
	if (value === 0) {
		return 0;
	}

	return Math.round(value * precision) / precision;
};

const toAbsolutePrecision = (value: number, precision: number) => {
	if (value === 0) {
		return 0;
	}

	return Math.abs(toPrecision(value, precision));
};

const geodesicArea = (lines: readonly GeotraceLine[]): number => {
	const [firstLine, ...rest] = lines;
	const lastLine = rest[rest.length - 1];

	if (firstLine == null || lastLine == null) {
		return 0;
	}

	const { start } = firstLine;
	const { end } = lastLine;

	let shape: readonly GeotraceLine[];

	if (start.latitude === end.latitude && start.longitude === end.longitude) {
		shape = lines;
	} else {
		shape = [...lines, { start: end, end: start }];
	}

	let total = 0;

	// eslint-disable-next-line @typescript-eslint/no-shadow
	for (const { start, end } of shape) {
		total +=
			toRadians(end.longitude - start.longitude) *
			(2 + Math.sin(toRadians(end.latitude)) + Math.sin(toRadians(start.latitude)));
	}

	return (total * EARTH_EQUATORIAL_RADIUS_METERS * EARTH_EQUATORIAL_RADIUS_METERS) / 2;
};

const evaluateArgumentValues = <T extends XPathNode>(
	context: EvaluationContext<T>,
	args: readonly EvaluableArgument[]
): readonly string[] => {
	const evaluations = args.flatMap((arg) => [...arg.evaluate(context)]);

	return evaluations.map((evaluation) => evaluation.toString());
};

export const area = new NumberFunction('area', [{ arityType: 'required' }], (context, args) => {
	const values = evaluateArgumentValues(context, args);
	const geotrace = Geotrace.fromEncodedValues(values);
	const areaResult = geodesicArea(geotrace?.lines ?? []);

	return toAbsolutePrecision(areaResult, PRECISION);
});

const geodesicDistance = (line: GeotraceLine): number => {
	const { start, end } = line;
	const deltaLambda = toRadians(start.longitude - end.longitude);
	const phi0 = toRadians(start.latitude);
	const phi1 = toRadians(end.latitude);

	return (
		Math.acos(
			Math.sin(phi0) * Math.sin(phi1) + Math.cos(phi0) * Math.cos(phi1) * Math.cos(deltaLambda)
		) * EARTH_EQUATORIAL_RADIUS_METERS
	);
};

const sum = (values: readonly number[]) => {
	let total = 0;

	for (const value of values) {
		total += value;
	}

	return total;
};

export const distance = new NumberFunction(
	'distance',
	[{ arityType: 'required' }, { arityType: 'variadic' }],
	(context, args) => {
		const values = evaluateArgumentValues(context, args);
		const lines = Geotrace.fromEncodedValues(values)?.lines;

		if (lines == null) {
			throw new JRCompatibleGeoValueError('distance');
		}

		const distances = lines.map(geodesicDistance);

		return toAbsolutePrecision(sum(distances), PRECISION);
	}
);

/**
 * Returns whether a geopoint is inside the specified geoshape; aka 'geofencing'
 * @param point the geopoint location to check for inclusion.
 * @param polygon the closed list of geoshape coordinates defining the polygon 'fence'.
 * @return true if the location is inside the polygon; false otherwise.
 *
 * Adapted from https://wrfranklin.org/Research/Short_Notes/pnpoly.html:
 *
 * int pnpoly(int nvert, float *vertx, float *verty, float testx, float testy) {
 *     int i, j, c = 0;
 *     for (i = 0, j = nvert - 1; i < nvert; j = i++) {
 *         if (((verty[i] > testy) != (verty[j] > testy)) &&
 *             (testx < (vertx[j] - vertx[i]) * (testy - verty[i]) / (verty[j] - verty[i]) + vertx[i]))
 *             c = !c;
 *     }
 *     return c;
 * }
 */
const calculateIsPointInGPSPolygon = (point: Geopoint, polygon: Geotrace) => {
	const testx = point.longitude; // x maps to longitude
	const testy = point.latitude; // y maps to latitude
	let result = false;
	for (let i = 1; i < polygon.geopoints.length; i++) {
		// geoshapes already duplicate the first point to last, so unlike the original algorithm there is no need to wrap j
		const p1 = polygon.geopoints[i - 1]; // this is effectively j in the original algorithm
		const p2 = polygon.geopoints[i]; // this is effectively i in the original algorithm
		if (!p1 || !p2) {
			return false;
		}
		const { latitude: p1Lat, longitude: p1long } = p1;
		const { latitude: p2Lat, longitude: p2long } = p2;
		if (
			p2Lat > testy != p1Lat > testy &&
			testx < ((p1long - p2long) * (testy - p2Lat)) / (p1Lat - p2Lat) + p2long
		) {
			result = !result;
		}
	}
	return result;
};

const validateGeoshape = (shape: Geotrace) => {
	if (shape.geopoints.length < 2) {
		return false;
	}
	const first = shape.geopoints[0];
	const last = shape.geopoints[shape.geopoints.length - 1]!;
	return first.latitude === last.latitude && first.longitude === last.longitude;
};

export const geofence = new BooleanFunction(
	'geofence',
	[{ arityType: 'required' }, { arityType: 'required' }],
	(context, args) => {
		const [point, shape] = evaluateArgumentValues(context, args);
		if (!point || !shape) {
			return false;
		}
		const geopoint = Geopoint.fromNodeValue(point);
		const geoshape = Geotrace.fromEncodedGeotrace(shape);
		if (!geopoint || !geoshape || !validateGeoshape(geoshape)) {
			return false;
		}
		return calculateIsPointInGPSPolygon(geopoint, geoshape);
	}
);
