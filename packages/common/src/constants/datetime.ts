export const DAY_MILLISECONDS = 1000 * 60 * 60 * 24;

export const MILLISECOND_NANOSECONDS = BigInt(1_000_000);

const ISO_DATE_LIKE_SUBPATTERN = '\\d{4}-\\d{2}-\\d{2}';

export const ISO_DATE_LIKE_PATTERN = new RegExp(`^${ISO_DATE_LIKE_SUBPATTERN}(?=T|$)`);

const ISO_TIME_LIKE_SUBPATTERN = `(${[
	'\\d{2}:\\d{2}:\\d{2}\\.\\d+',
	'\\d{2}:\\d{2}:\\d{2}',
	'\\d{2}:\\d{2}',
	'\\d{2}',
].join('|')})`;

export const ISO_TIME_LIKE_PATTERN = new RegExp(`^${ISO_TIME_LIKE_SUBPATTERN}$`);

const TIMEZONE_OFFSET_SUBPATTERN = '[-+]\\d{2}:\\d{2}';

export const TIMEZONE_OFFSET_PATTERN = new RegExp(`${TIMEZONE_OFFSET_SUBPATTERN}$`);

const ISO_OFFSET_SUBPATTERN = `(${TIMEZONE_OFFSET_SUBPATTERN}|Z)`;

/*
 * Validates a timezone offset (e.g., "+01:00", "-12:30") in the format ±HH:MM.
 * Ensures hours are between 00 and 14, and minutes are between 00 and 59, matching standard timezone offset ranges.
 */
export const VALID_OFFSET_VALUE = new RegExp('^[+-]([0][0-9]|1[0-4]):([0-5][0-9])$');

export const ISO_DATE_TIME_LIKE_PATTERN = new RegExp(
	[
		'^',
		ISO_DATE_LIKE_SUBPATTERN,
		'T',
		ISO_TIME_LIKE_SUBPATTERN,
		`(${ISO_OFFSET_SUBPATTERN})`,
		'$',
	].join('')
);

export const ISO_DATE_OR_DATE_TIME_LIKE_PATTERN = new RegExp(
	[
		'^',
		ISO_DATE_LIKE_SUBPATTERN,
		`(T${ISO_TIME_LIKE_SUBPATTERN}(${ISO_OFFSET_SUBPATTERN})?)?`,
		'$',
	].join('')
);

export const ISO_DATE_OR_DATE_TIME_NO_OFFSET_PATTERN = new RegExp(
	['^', ISO_DATE_LIKE_SUBPATTERN, `(T${ISO_TIME_LIKE_SUBPATTERN})?`, '$'].join('')
);
