import { Temporal } from '@js-temporal/polyfill';
import { DAY_MILLISECONDS } from '../lib/datetime/constants.ts';
import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';
import { ValueEvaluation } from './ValueEvaluation.ts';
import { localDateTimeOrDateString } from '../lib/datetime/functions.ts';

interface PrecomputedXPathValues {
	readonly booleanValue?: boolean;
	readonly numberValue?: number;
	readonly stringValue?: string;
}

const INVALID_DATE_TIME_STRING = 'Invalid Date';

export class DateTimeLikeEvaluation extends ValueEvaluation<'NUMBER'> {
	readonly type = 'NUMBER';
	readonly nodes = null;
	readonly value: number;

	protected readonly booleanValue: boolean;
	protected readonly numberValue: number;
	protected readonly stringValue: string;

	protected readonly milliseconds: number;
	protected readonly dateString: string;
	protected readonly dateTimeString: string;

	constructor(
		readonly context: LocationPathEvaluation,
		protected dateTime: Temporal.ZonedDateTime | null,
		precomputedValues: PrecomputedXPathValues = {}
	) {
		super();

		const { booleanValue, numberValue, stringValue } = precomputedValues;

		if (dateTime == null) {
			this.value = NaN;
			this.booleanValue = booleanValue ?? false;
			this.numberValue = numberValue ?? NaN;
			this.milliseconds = NaN;
			this.dateString = INVALID_DATE_TIME_STRING;
			this.dateTimeString = INVALID_DATE_TIME_STRING;
			this.stringValue = stringValue ?? INVALID_DATE_TIME_STRING;

			return;
		}

		const { epochMilliseconds } = dateTime;

		this.value = epochMilliseconds;

		this.booleanValue = booleanValue ?? epochMilliseconds !== 0;
		this.numberValue = numberValue ?? epochMilliseconds / DAY_MILLISECONDS;

		const dateTimeString = localDateTimeOrDateString(dateTime);

		this.milliseconds = epochMilliseconds;
		this.dateTimeString = dateTimeString;
		this.stringValue = stringValue ?? dateTimeString;
		this.dateString = dateTimeString.replace(/T.*$/, '');
	}
}
