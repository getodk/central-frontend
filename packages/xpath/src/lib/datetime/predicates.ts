import { Temporal } from '@js-temporal/polyfill';
import {
	ISO_DATE_LIKE_PATTERN,
	ISO_DATE_OR_DATE_TIME_LIKE_PATTERN,
	ISO_DATE_TIME_LIKE_PATTERN,
	ISO_TIME_LIKE_PATTERN,
} from './constants.ts';

export const isISODateLike = (value: string) => ISO_DATE_LIKE_PATTERN.test(value);

export const isISOTimeLike = (value: string) => ISO_TIME_LIKE_PATTERN.test(value);

export const isISODateTimeLike = (value: string) => ISO_DATE_TIME_LIKE_PATTERN.test(value);

export const isISODateOrDateTimeLike = (value: string) =>
	ISO_DATE_OR_DATE_TIME_LIKE_PATTERN.test(value);

export const isValidTimeString = (value: string): boolean => {
	try {
		return Temporal.PlainTime.from(value) != null;
	} catch {
		return false;
	}
};
