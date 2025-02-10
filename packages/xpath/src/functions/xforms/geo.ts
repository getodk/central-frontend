import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import { EvaluationContext } from '../../context/EvaluationContext.ts';
import { JRCompatibleGeoValueError } from '../../error/JRCompatibleGeoValueError.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
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
