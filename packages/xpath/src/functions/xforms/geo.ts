import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import { EvaluationContext } from '../../context/EvaluationContext.ts';
import { BooleanFunction } from '../../evaluator/functions/BooleanFunction.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { Geopoint } from '../../lib/geo/Geopoint.ts';
import { collectLines, validate } from '../../lib/geo/Geotrace.ts';
import type { GeotraceLine } from '../../lib/geo/GeotraceLine.ts';

const EARTH_EQUATORIAL_RADIUS_METERS = 6_378_100;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const closeShape = (lines: readonly GeotraceLine[]): readonly GeotraceLine[] => {
  const [firstLine, ...rest] = lines;
  const lastLine = rest[rest.length - 1];

  if (firstLine == null || lastLine == null) {
    return [];
  }

  const { start } = firstLine;
  const { end } = lastLine;

  if (start.latitude === end.latitude && start.longitude === end.longitude) {
    // already closed
    return lines;
  }

  return [...lines, { start: end, end: start }];
};

const geodesicArea = (lines: readonly GeotraceLine[]): number => {
  const shape = closeShape(lines);

  let total = 0;

  for (const { start, end } of shape) {
    total +=
      toRadians(end.longitude - start.longitude) *
      (2 + Math.sin(toRadians(end.latitude)) + Math.sin(toRadians(start.latitude)));
  }

  return Math.abs((total * EARTH_EQUATORIAL_RADIUS_METERS * EARTH_EQUATORIAL_RADIUS_METERS) / 2);
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
  const { valid, points } = validate(values);

  if (!valid || !points || points.length < 2) {
    return 0;
  }
  return geodesicArea(collectLines(points));
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
    const values = evaluateArgumentValues(context, args)
      .map((value) => value.trim())
      .filter((value) => value !== '');

    if (values.length === 0) {
      // no geo values given
      return NaN;
    }

    const { valid, points } = validate(values);
    if (!valid || !points) {
      throw new Error(
        "The function 'distance' received a value that does not represent GPS coordinates"
      );
    }

    if (points.length < 2) {
      return NaN;
    }

    const distances = collectLines(points).map(geodesicDistance);
    return sum(distances);
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
const calculateIsPointInGPSPolygon = (point: Geopoint, points: readonly Geopoint[]) => {
  const testx = point.longitude; // x maps to longitude
  const testy = point.latitude; // y maps to latitude
  let result = false;
  for (let i = 1; i < points.length; i++) {
    // geoshapes already duplicate the first point to last, so unlike the original algorithm there is no need to wrap j
    const p1 = points[i - 1]; // this is effectively j in the original algorithm
    const p2 = points[i]; // this is effectively i in the original algorithm
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

const validateGeoshape = (points: readonly Geopoint[]) => {
  if (points.length < 2) {
    return false;
  }
  const first = points[0]!;
  const last = points[points.length - 1]!;
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

    const { valid, points } = validate([shape]);

    if (!valid || !geopoint || !points || !validateGeoshape(points)) {
      return false;
    }
    return calculateIsPointInGPSPolygon(geopoint, points);
  }
);
