import { Temporal } from 'temporal-polyfill';
import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import { DAY_MILLISECONDS } from '@getodk/common/constants/datetime.ts';
import type { LocationPathEvaluation } from './LocationPathEvaluation.ts';
import { ValueEvaluation } from './ValueEvaluation.ts';

interface PrecomputedXPathValues {
  readonly booleanValue?: boolean;
  readonly numberValue?: number;
  readonly stringValue?: string;
}

const INVALID_DATE_TIME_STRING = 'Invalid Date';

export class DateLikeEvaluation<T extends XPathNode> extends ValueEvaluation<T, 'NUMBER'> {
  readonly type = 'NUMBER';
  readonly nodes = null;
  readonly value: number;

  protected readonly booleanValue: boolean;
  protected readonly numberValue: number;
  protected readonly stringValue: string;

  constructor(
    readonly context: LocationPathEvaluation<T>,
    protected date: Temporal.PlainDate | null,
    precomputedValues: PrecomputedXPathValues = {}
  ) {
    super();

    const { booleanValue, numberValue, stringValue } = precomputedValues;

    if (date == null) {
      this.value = NaN;
      this.booleanValue = booleanValue ?? false;
      this.numberValue = numberValue ?? NaN;
      this.stringValue = stringValue ?? INVALID_DATE_TIME_STRING;

      return;
    }

    const epoch = Temporal.PlainDate.from('1970-01-01'); // keeps coming up....
    const days = date.since(epoch, { largestUnit: 'days' }).days;
    this.value = days * DAY_MILLISECONDS;

    this.booleanValue = booleanValue ?? days !== 0;
    this.numberValue = numberValue ?? days;

    const dateTimeString = date.toString();

    this.stringValue = stringValue ?? dateTimeString;
  }
}
