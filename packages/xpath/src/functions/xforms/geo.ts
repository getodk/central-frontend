import { pairwise } from 'itertools-ts/lib/single';
import { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';

interface Point {
	readonly latitude: number;
	readonly longitude: number;
}

const DEGREES_MAX = {
	latitude: 90,
	longitude: 180,
} as const;

type GeographicAngleCoordinate = keyof typeof DEGREES_MAX;

const toDegrees = (coordinate: GeographicAngleCoordinate, value: string): number => {
	const degrees = Number(value);
	const absolute = Math.abs(degrees);
	const max = DEGREES_MAX[coordinate];

	if (absolute > max) {
		return NaN;
	}

	return degrees;
};

const INVALID_POINT: Point = {
	latitude: NaN,
	longitude: NaN,
};

const isInvalidPoint = (point: Point) => point === INVALID_POINT;

const evaluatePoints = (context: EvaluationContext, expression: EvaluableArgument): Point[] => {
	const results = expression.evaluate(context);

	const stringResults = [...results].map((result) => result.toString());
	const geopointStrings = stringResults.flatMap((result) => {
		const string = result.toString().trim();

		return string.split(/\s*;\s*/);
	});

	return geopointStrings.map((string) => {
		const coordinates = string.split(/\s+/);

		if (coordinates.length < 2 || coordinates.length > 4) {
			return INVALID_POINT;
		}

		const [latitudeString, longitudeString, ...rest] = coordinates;

		if (latitudeString == null || longitudeString == null || rest.length > 2) {
			return INVALID_POINT;
		}

		const latitude = toDegrees('latitude', latitudeString);
		const longitude = toDegrees('longitude', longitudeString);

		if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
			return INVALID_POINT;
		}

		return { latitude, longitude };
	});
};

interface Line {
	readonly start: Point;
	readonly end: Point;
}

const INVALID_LINE: Line = {
	start: INVALID_POINT,
	end: INVALID_POINT,
};

const evaluateLines = (context: EvaluationContext, expression: EvaluableArgument): Line[] => {
	const points = evaluatePoints(context, expression);

	if (points.length < 2) {
		return [INVALID_LINE];
	}

	return Array.from(pairwise(points)).map((line) => {
		const [start, end] = line;

		if (start === INVALID_POINT || end === INVALID_POINT) {
			return INVALID_LINE;
		}

		return {
			start,
			end,
		};
	});
};

const isInvalidLine = (line: Line) => line === INVALID_LINE;

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

const geodesicArea = (lines: readonly Line[]): number => {
	const [firstLine, ...rest] = lines;
	const lastLine = rest[rest.length - 1];

	if (firstLine == null || lastLine == null) {
		return 0;
	}

	if (lines.some(isInvalidLine)) {
		return NaN;
	}

	const { start } = firstLine;
	const { end } = lastLine;

	let shape: readonly Line[];

	if (start.latitude === end.latitude && start.longitude === end.longitude) {
		shape = lines;
	} else {
		if (isInvalidPoint(end) || isInvalidPoint(start)) {
			shape = [...lines, INVALID_LINE];
		} else {
			shape = [...lines, { start: end, end: start }];
		}
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

export const area = new NumberFunction(
	'area',
	[{ arityType: 'required' }],
	(context, [expression]) => {
		const lines = evaluateLines(context, expression!);

		if (lines.some(isInvalidLine)) {
			return NaN;
		}

		const areaResult = geodesicArea(lines);

		return toAbsolutePrecision(areaResult, PRECISION);
	}
);

const geodesicDistance = (line: Line): number => {
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
	[{ arityType: 'required' }],
	(context, [expression]) => {
		const lines = evaluateLines(context, expression!);

		if (lines.some(isInvalidLine)) {
			return NaN;
		}

		const distances = lines.map(geodesicDistance);

		return toAbsolutePrecision(sum(distances), PRECISION);
	}
);
