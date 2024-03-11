import { Temporal } from '@js-temporal/polyfill';
import { EvaluationContext } from '../../context/EvaluationContext.ts';
import { DateTimeLikeEvaluation } from '../../evaluations/DateTimeLikeEvaluation.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { StringEvaluation } from '../../evaluations/StringEvaluation.ts';
import { FunctionImplementation } from '../../evaluator/functions/FunctionImplementation.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { dateTimeFromNumber, dateTimeFromString } from '../../lib/datetime/coercion.ts';
import { DAY_MILLISECONDS } from '../../lib/datetime/constants.ts';
import { now } from '../../lib/datetime/functions.ts';
import { isValidTimeString } from '../../lib/datetime/predicates.ts';

export const today = new FunctionImplementation('today', [], (context) => {
	const todayDateTime = now(context.timeZone).with({
		hour: 0,
		minute: 0,
		second: 0,
		millisecond: 0,
		microsecond: 0,
		nanosecond: 0,
	});

	return new DateTimeLikeEvaluation(context, todayDateTime);
});

export const xfNow = new FunctionImplementation('now', [], (context) => {
	return new DateTimeLikeEvaluation(context, now(context.timeZone));
});

type DateTimeFormatFunction = (dateTime: Temporal.ZonedDateTime) => string;
type DateFormatterRecord = Record<`%${string}`, DateTimeFormatFunction>;

// TODO: localization
const shortMonths = [
	null,
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec',
] as const;

// TODO: localization
const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// TODO: Can use `Intl`?
const dateFormatters = {
	/**
	 * 4-digit year
	 */
	'%Y': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.year).padStart(4, '0');
	},

	/**
	 * 2-digit year
	 */
	'%y': (dateTime: Temporal.ZonedDateTime): string => {
		return dateFormatters['%Y'](dateTime).slice(2);
	},

	/**
	 * 0-padded month
	 */
	'%m': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.month).padStart(2, '0');
	},

	/**
	 * numeric month
	 */
	'%n': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.month);
	},

	/**
	 * short text month (Jan, Feb, etc)*
	 */
	'%b': (dateTime: Temporal.ZonedDateTime): string => {
		return shortMonths[dateTime.month] ?? '';
	},

	/**
	 * 0-padded day of month
	 */
	'%d': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.day).padStart(2, '0');
	},

	/**
	 * day of month
	 */
	'%e': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.day);
	},

	/**
	 * short text day (Sun, Mon, etc).*
	 */
	'%a': (dateTime: Temporal.ZonedDateTime): string => {
		return shortDays[dateTime.dayOfWeek] ?? '';
	},
} as const satisfies DateFormatterRecord;

type DateFormatters = typeof dateFormatters;

// TODO: Can use `Intl`?
const timeFormatters = {
	/**
	 * 0-padded hour (24-hr time)
	 */
	'%H': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.hour).padStart(2, '0');
	},

	/**
	 * hour (24-hr time)
	 */
	'%h': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.hour);
	},

	/**
	 * 0-padded minute
	 */
	'%M': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.minute).padStart(2, '0');
	},

	/**
	 * 0-padded second
	 */
	'%S': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.second).padStart(2, '0');
	},

	/**
	 * 0-padded millisecond ticks.*
	 */
	'%3': (dateTime: Temporal.ZonedDateTime): string => {
		return String(dateTime.millisecond).padStart(3, '0');
	},
} as const satisfies DateFormatterRecord;

type TimeFormatters = typeof timeFormatters;

const dateTimeFormatters = {
	...dateFormatters,
	...timeFormatters,
} as const;

type DateTimeFormatters = DateFormatters | (DateFormatters & TimeFormatters);

const formatter = (formatters: DateTimeFormatters) => {
	const identifierPattern = new RegExp(`${Object.keys(formatters).join('|')}`, 'g');

	return (format: string, value: Temporal.ZonedDateTime) => {
		return format.replaceAll(identifierPattern, (key) => {
			return formatters[key as keyof typeof formatters](value);
		});
	};
};

const dateFormatter = formatter(dateFormatters);

export const formatDate = new StringFunction(
	'format-date',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
	],
	(context, [expression, formatExpression]) => {
		const format = formatExpression!.evaluate(context).toString();
		const value = expression!.evaluate(context).toString();
		const dateTime = dateTimeFromString(context.timeZone, value);

		if (dateTime == null) {
			return '';
		}

		return dateFormatter(format, dateTime);
	}
);

const dateTimeFormatter = formatter(dateTimeFormatters);

export const formatDateTime = new StringFunction(
	'format-date-time',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
	],
	(context, [expression, formatExpression]) => {
		const format = formatExpression!.evaluate(context).toString();
		const value = expression!.evaluate(context).toString();

		const dateTime = dateTimeFromString(context.timeZone, value);

		if (dateTime == null) {
			return '';
		}

		return dateTimeFormatter(format, dateTime);
	}
);

const evaluateDateTime = (
	context: EvaluationContext,
	evaluation: Evaluation
): Temporal.ZonedDateTime | null => {
	const { timeZone } = context;

	switch (evaluation.type) {
		case 'NUMBER': {
			const days = evaluation.toNumber();

			if (Number.isNaN(days)) {
				return null;
			}

			const milliseconds = days * DAY_MILLISECONDS;

			return dateTimeFromNumber(timeZone, milliseconds);
		}

		case 'STRING': {
			const stringValue = evaluation.toString();

			return dateTimeFromString(timeZone, stringValue);
		}

		default:
			throw 'todo';
	}
};

const UNPADDED_MONTH_DAY_PATTERN = /^(\d{4})-([1-9]|\d{2})-([1-9]|\d{2})(T.*)?$/;

const DATE_OR_DATE_TIME_PATTERN =
	/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[-+]\d{2}:\d{2})?)?/;

export const date = new FunctionImplementation(
	'date',
	[
		// TODO: spec says variadic?!
		{ arityType: 'required' },
	],
	(context, [expression]) => {
		const results = expression!.evaluate(context);

		switch (results.type) {
			case 'BOOLEAN':
				return new StringEvaluation(context, '');

			case 'STRING': {
				const string = results.toString();

				if (string === '') {
					return new StringEvaluation(context, string);
				}

				if (!DATE_OR_DATE_TIME_PATTERN.test(string)) {
					const unpaddedMatches = string.match(UNPADDED_MONTH_DAY_PATTERN);

					if (unpaddedMatches == null) {
						return new DateTimeLikeEvaluation(context, null);
					}

					const [, year, month, day, rest = ''] = unpaddedMatches;

					const paddedString = `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}${rest}`;
					const dateTime = dateTimeFromString(context.timeZone, paddedString);

					return new DateTimeLikeEvaluation(context, dateTime);
				}

				break;
			}

			case 'NUMBER':
				break;

			default:
				throw '';
		}

		const dateTime = evaluateDateTime(context, results);

		return new DateTimeLikeEvaluation(context, dateTime);
	}
);

export const decimalDateTime = new NumberFunction(
	'decimal-date-time',
	[{ arityType: 'required' }],
	(context, [expression]) => {
		const results = expression!.evaluate(context);
		const dateTime = evaluateDateTime(context, results);

		if (dateTime == null) {
			return NaN;
		}

		return dateTime.epochMilliseconds / DAY_MILLISECONDS;
	}
);

export const decimalTime = new NumberFunction(
	'decimal-time',
	[{ arityType: 'required' }],
	(context, [expression]) => {
		const string = expression!.evaluate(context).toString();

		if (!isValidTimeString(string)) {
			return NaN;
		}

		if (/^\d{2}:\d{2}(:[0-5]\d)?(\.\d+)?(Z|[-+]\d{2}:\d{2})?$/.test(string)) {
			const dateTimeString = `1970-01-01T${string}`;

			const dateTime = dateTimeFromString(context.timeZone, dateTimeString);

			if (dateTime == null) {
				return NaN;
			}

			const { epochMilliseconds } = dateTime
				.toPlainDateTime()
				.with({
					year: 1970,
					month: 1,
					day: 1,
				})
				.toZonedDateTime('utc');

			return epochMilliseconds / DAY_MILLISECONDS;
		}

		return NaN;
	}
);
