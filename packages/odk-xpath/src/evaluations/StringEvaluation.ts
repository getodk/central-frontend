import { ValueEvaluation } from './ValueEvaluation.ts';

export class StringEvaluation extends ValueEvaluation<'STRING'> {
  readonly type = 'STRING';
  readonly nodes = null;

  protected readonly booleanValue: boolean;
  protected readonly numberValue: number;
  protected readonly stringValue: string;

  constructor(
    readonly value: string,
    readonly isEmpty: boolean = value === ''
  ) {
    super();

    this.booleanValue = !isEmpty;
    this.numberValue = isEmpty ? NaN : Number(value);
    this.stringValue = value;
  }
}
