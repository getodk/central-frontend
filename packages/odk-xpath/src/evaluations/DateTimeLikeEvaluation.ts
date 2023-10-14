import { Temporal } from '@js-temporal/polyfill';
import {
  DAY_MILLISECONDS,
  DateTimeContext,
} from '../lib/datetime';
import { ValueEvaluation } from './ValueEvaluation.ts';

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
    protected readonly context: DateTimeContext,
    protected dateTime: Temporal.ZonedDateTime
  ) {
    super();

    const { epochMilliseconds } = dateTime;

    this.value = epochMilliseconds;

    this.booleanValue = epochMilliseconds !== 0;
    this.numberValue = epochMilliseconds / DAY_MILLISECONDS;

    const dateTimeString = context.toDateOrDateTimeString(dateTime);

    this.milliseconds = epochMilliseconds;
    this.dateTimeString = dateTimeString
    this.stringValue = dateTimeString.replace(/T00:00:00$/, '');
    this.dateString = dateTimeString.replace(/T.*$/, '');
  }
}
