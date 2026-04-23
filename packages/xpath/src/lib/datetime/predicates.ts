import { Temporal } from 'temporal-polyfill';
import { ISO_DATE_OR_DATE_TIME_LIKE_PATTERN } from '@getodk/common/constants/datetime.ts';

export const isISODateOrDateTimeLike = (value: string) =>
	ISO_DATE_OR_DATE_TIME_LIKE_PATTERN.test(value);

export const isValidTimeString = (value: string): boolean => {
	try {
		return Temporal.PlainTime.from(value) != null;
	} catch {
		return false;
	}
};
