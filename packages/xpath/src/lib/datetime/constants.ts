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

const ISO_OFFSET_SUBPATTERN = '([-+]\\d{2}:\\d{2}|Z)';

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
