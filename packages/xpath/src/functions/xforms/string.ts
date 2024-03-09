// TODO: make digest optional, and the `crypto-js` package along with it
import { MD5, SHA1, SHA256, SHA384, SHA512 } from 'crypto-js';
import * as base64 from 'crypto-js/enc-base64';
import * as hex from 'crypto-js/enc-hex';
import { BooleanFunction } from '../../evaluator/functions/BooleanFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { evaluateInt } from '../_shared/number.ts';
import { toStrings } from '../_shared/string.ts';

export const coalesce = new StringFunction(
	'coalesce',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
	],
	(context, [aExpression, bExpression]): string => {
		const a = aExpression!.evaluate(context).toString();

		if (a !== '') {
			return a;
		}

		return bExpression!.evaluate(context).toString();
	}
);

export const concat = new StringFunction(
	'concat',
	[{ arityType: 'variadic', typeHint: 'string' }],
	(context, expressions): string => {
		if (expressions.length === 0) {
			return '';
		}

		return expressions
			.flatMap((expression) => {
				const results = expression.evaluate(context);

				return Array.from(results).map((result) => result.toString());
			})
			.join('');
	}
);

const digestHashFunctions = {
	MD5,
	'SHA-1': SHA1,
	'SHA-256': SHA256,
	'SHA-384': SHA384,
	'SHA-512': SHA512,
} as const;

type DigestAlgorithm = keyof typeof digestHashFunctions;

const isDigestAlgorithm = (algorithm: string): algorithm is DigestAlgorithm =>
	algorithm in digestHashFunctions;

const digestEncodeFunctions = {
	base64,
	hex,
};

type DigestEncoding = keyof typeof digestEncodeFunctions;

const isDigestEncoding = (encoding: string): encoding is DigestEncoding =>
	encoding in digestEncodeFunctions;

export const digest = new StringFunction(
	'digest',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'optional', typeHint: 'string' },
	],
	(context, [valueExpression, algorithmExpression, encodingExpression]) => {
		const value = valueExpression!.evaluate(context).toString();
		const algorithm = algorithmExpression!.evaluate(context).toString();

		if (!isDigestAlgorithm(algorithm)) {
			throw `todo unknown digest algorithm ${algorithm}`;
		}

		const encoding = encodingExpression?.evaluate(context).toString() ?? 'base64';

		if (!isDigestEncoding(encoding)) {
			throw `todo unknown digest encoding ${encoding}`;
		}

		const fn = digestHashFunctions[algorithm];
		const encode = digestEncodeFunctions[encoding];
		const hash = fn(value);

		return encode.stringify(hash);
	}
);

export const endsWith = new BooleanFunction(
	'ends-with',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
	],
	(context, [haystackExpression, needleExpression]): boolean => {
		const haystack = haystackExpression!.evaluate(context).toString();
		const needle = needleExpression!.evaluate(context).toString();

		const result = haystack.endsWith(needle);

		return result;
	}
);

export const join = new StringFunction(
	'join',
	[
		{ arityType: 'required', typeHint: 'string' },
		// Deviates from ODK XForms spec, matches ORXE
		{ arityType: 'variadic' },
	],
	(context, [glueExpression, ...expressions]): string => {
		const glue = glueExpression!.evaluate(context).toString();
		const strings = toStrings(context, expressions);

		return strings.join(glue);
	}
);

export const regex = new BooleanFunction(
	'regex',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
	],
	(context, [valueExpression, patternExpression]): boolean => {
		const value = valueExpression!.evaluate(context).toString();
		// TODO: various memoizations (static expression, regex instance)
		const pattern = new RegExp(patternExpression!.evaluate(context).toString());

		return pattern.test(value);
	}
);

export const substr = new StringFunction(
	'substr',
	[
		{ arityType: 'required' },
		{ arityType: 'required', typeHint: 'number' },
		{ arityType: 'optional', typeHint: 'number' },
	],
	(context, [stringExpression, startExpression, endExpression]): string => {
		const string = stringExpression!.evaluate(context).toString();

		const { length } = string;

		if (length === 0) {
			return '';
		}

		let start = evaluateInt(context, startExpression!);
		let end = endExpression != null ? evaluateInt(context, endExpression) : length;

		if (start < 0) {
			start = length + start;
		}

		if (end < 0) {
			end = length + end;
		}

		end = Math.min(Math.max(0, end), length);
		start = Math.min(Math.max(0, start), length);

		return start <= end ? string.substring(start, end) : '';
	}
);

export const uuid = new StringFunction(
	'uuid',
	[{ arityType: 'optional', typeHint: 'number' }],
	(context, [lengthExpression]) => {
		let result: string = crypto.randomUUID();

		if (lengthExpression == null) {
			return result;
		}

		const outputLength = lengthExpression.evaluate(context).toNumber();

		if (Number.isNaN(outputLength)) {
			throw 'todo';
		}

		while (result.length < outputLength) {
			result = `${result}${crypto.randomUUID()}`;
		}

		return result.slice(0, outputLength);
	}
);
