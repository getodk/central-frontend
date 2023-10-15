export const DAY_MILLISECONDS = 1000 * 60 * 60 * 24;

const ISO_DATE_LIKE_SUBPATTERN = '\\d{4}-\\d{2}-\\d{2}';
const ISO_DATE_LIKE_PATTERN = new RegExp(`^${ISO_DATE_LIKE_SUBPATTERN}(?=T|$)`);

export const isISODateLike = (value: string) => ISO_DATE_LIKE_PATTERN.test(value);

const ISO_TIME_LIKE_SUBPATTERN = `(${[
	'\\d{2}:\\d{2}:\\d{2}\\.\\d+',
	'\\d{2}:\\d{2}:\\d{2}',
	'\\d{2}:\\d{2}',
	'\\d{2}',
].join('|')})`;
const ISO_TIME_LIKE_PATTERN = new RegExp(`^${ISO_TIME_LIKE_SUBPATTERN}$`);

export const isISOTimeLike = (value: string) => ISO_TIME_LIKE_PATTERN.test(value);

const ISO_DATE_TIME_LIKE_PATTERN = new RegExp(
	['^', ISO_DATE_LIKE_SUBPATTERN, 'T', ISO_TIME_LIKE_SUBPATTERN, '$'].join('')
);

export const isISODateTimeLike = (value: string) => ISO_DATE_TIME_LIKE_PATTERN.test(value);
