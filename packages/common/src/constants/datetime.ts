export const DAY_MILLISECONDS = 1000 * 60 * 60 * 24;

export const FRACTIONAL_SECOND_DIGITS = 3;

export const MILLISECOND_NANOSECONDS = BigInt(1_000_000);

const ISO_DATE_LIKE_SUBPATTERN = '\\d{4}-\\d{2}-\\d{2}';

export const ISO_DATE_LIKE_PATTERN = new RegExp(`^${ISO_DATE_LIKE_SUBPATTERN}(?=T|$)`);

const STRICT_TIME_FORMATS = ['\\d{2}:\\d{2}:\\d{2}\\.\\d+', '\\d{2}:\\d{2}:\\d{2}'];

// Strict: requires HH:MM:SS (with optional fractional seconds).
const STRICT_ISO_TIME_SUBPATTERN = `(${[...STRICT_TIME_FORMATS].join('|')})`;

// "Like" (lenient): also accepts partial times (e.g., HH:MM or HH alone).
const ISO_TIME_LIKE_SUBPATTERN = `(${[...STRICT_TIME_FORMATS, '\\d{2}:\\d{2}', '\\d{2}'].join(
	'|'
)})`;

const TIMEZONE_OFFSET_SUBPATTERN = '[-+]\\d{2}:\\d{2}';

// Detects presence of a timezone offset at the end of a string. It doesn't validate its range.
export const TIMEZONE_OFFSET_PATTERN = new RegExp(`${TIMEZONE_OFFSET_SUBPATTERN}$`);

const ISO_OFFSET_SUBPATTERN = `(${TIMEZONE_OFFSET_SUBPATTERN}|Z)`;

/*
 * Validates a timezone offset (e.g., "+01:00", "-12:30") in the format ±HH:MM.
 * Ensures hours are between 00 and 14, and minutes are between 00 and 59, matching standard timezone offset ranges.
 */
export const VALID_OFFSET_VALUE = new RegExp('^([+-]([0][0-9]|1[0-4]):([0-5][0-9])|Z)$', 'i');

// Used by XPath coercion. It accepts offset-bearing strings (e.g. 2026-04-22T14:30:00+07:00).
export const ISO_DATE_OR_DATE_TIME_LIKE_PATTERN = new RegExp(
	[
		'^',
		ISO_DATE_LIKE_SUBPATTERN,
		`(T${ISO_TIME_LIKE_SUBPATTERN}(${ISO_OFFSET_SUBPATTERN})?)?`,
		'$',
	].join('')
);

// Used by DateValueCodec. It intentionally rejects strings with timezone offsets.
export const ISO_DATE_OR_DATE_TIME_NO_OFFSET_PATTERN = new RegExp(
	['^', ISO_DATE_LIKE_SUBPATTERN, `(T${ISO_TIME_LIKE_SUBPATTERN})?`, '$'].join('')
);

export const ISO_DATE_TIME_WITH_OPTIONAL_OFFSET_PATTERN = new RegExp(
	[
		'^',
		ISO_DATE_LIKE_SUBPATTERN,
		'T',
		STRICT_ISO_TIME_SUBPATTERN,
		`(${ISO_OFFSET_SUBPATTERN})?`,
		'$',
	].join('')
);

export const ISO_TIME_WITH_OPTIONAL_OFFSET_PATTERN = new RegExp(
	['^', STRICT_ISO_TIME_SUBPATTERN, `(${ISO_OFFSET_SUBPATTERN})?`, '$'].join('')
);
